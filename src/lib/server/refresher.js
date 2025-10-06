import { KEPLER_KEY } from '$env/static/private';
import fs from 'node:fs/promises';
import path from 'node:path';

const KEPLER_URL = 'https://kepler-api.projectx.mx/mainnet/api/query';
const HEROTAG_URL = 'https://herotag.projectx.mx/search';

function base64ToBytes(b64) {
  if (typeof b64 !== 'string') return new Uint8Array();
  if (b64 === '') return new Uint8Array();
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

function bytesToBigIntBE(bytes) {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}

function b64ToDecimalString(b64) {
  if (b64 === '') return '0';
  const bytes = base64ToBytes(b64);
  if (bytes.length === 0) return '0';
  return bytesToBigIntBE(bytes).toString(10);
}

function b64ToUtf8(b64) {
  if (b64 === '') return '';
  return Buffer.from(b64, 'base64').toString('utf8');
}

async function fetchFromKepler(fetchImpl) {
  if (!KEPLER_KEY) {
    return { items: [], meta: { count: 0 }, tiers: [] };
  }
  const [membersRes, tiersRes] = await Promise.all([
    fetchImpl(KEPLER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Api-Key': KEPLER_KEY },
      body: JSON.stringify({
        scAddress: 'erd1qqqqqqqqqqqqqpgqpsdn5ctxtn9zuuysj67m255hyyy2ww49l3ts7cl4gw',
        funcName: 'getDaoMembers',
        args: []
      })
    }),
    fetchImpl(KEPLER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Api-Key': KEPLER_KEY },
      body: JSON.stringify({
        scAddress: 'erd1qqqqqqqqqqqqqpgqpsdn5ctxtn9zuuysj67m255hyyy2ww49l3ts7cl4gw',
        funcName: 'getAllTiers',
        args: []
      })
    })
  ]);

  if (!membersRes.ok || !tiersRes.ok) {
    return { items: [], meta: { count: 0 }, tiers: [] };
  }

  const membersRaw = await membersRes.json();
  const tiersRaw = await tiersRes.json();

  const membersArr = Array.isArray(membersRaw?.returnData) ? membersRaw.returnData : [];
  const { bech32 } = await import('bech32');
  function toHexFromBase64(b64) {
    const bytes = base64ToBytes(b64);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  function hexToBech32Erd(hex) {
    if (!hex) return '';
    const words = bech32.toWords(Buffer.from(hex, 'hex'));
    return bech32.encode('erd', words);
  }

  const members = [];
  for (let i = 0; i + 1 < membersArr.length; i += 2) {
    const address = hexToBech32Erd(toHexFromBase64(membersArr[i]));
    const pointStr = b64ToDecimalString(membersArr[i + 1]);
    const points = Number(pointStr);
    members.push({ address, points });
  }

  const tiersArr = Array.isArray(tiersRaw?.returnData) ? tiersRaw.returnData : [];
  const tiers = [];
  for (let i = 0; i + 2 < tiersArr.length; i += 3) {
    const name = b64ToUtf8(tiersArr[i]);
    const minStr = b64ToDecimalString(tiersArr[i + 1]);
    const levelStr = b64ToDecimalString(tiersArr[i + 2]);
    tiers.push({ name, min: Number(minStr), level: Number(levelStr) });
  }
  tiers.sort((a, b) => a.min - b.min);

  function getStatusTier(points) {
    let current = null;
    for (const t of tiers) {
      if (points >= t.min) current = t;
      else break;
    }
    return current ? { name: current.name, level: current.level } : { name: '', level: 0 };
  }

  const addresses = members.map((m) => m.address);
  let herotags = {};
  async function tryFetchHerotags(payload) {
    const r = await fetchImpl(HEROTAG_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return null;
    try {
      return await r.json();
    } catch {
      return null;
    }
  }
  let ht = await tryFetchHerotags({ addresses });
  if (!ht) ht = await tryFetchHerotags(addresses);
  if (!ht) ht = await tryFetchHerotags({ addrs: addresses });
  if (ht) {
    if (Array.isArray(ht)) {
      for (const it of ht) {
        if (it && typeof it.address === 'string') herotags[it.address] = it.herotag || it.username || it.name || '';
      }
    } else if (ht && typeof ht === 'object') {
      for (const key of Object.keys(ht)) {
        const val = ht[key];
        if (typeof val === 'string') herotags[key] = val;
        else if (val && typeof val === 'object') herotags[key] = val.herotag || val.username || val.name || '';
      }
    }
  }

  const items = members.map((m) => {
    const statusTier = getStatusTier(m.points);
    return {
      address: m.address,
      herotag: herotags[m.address] || '',
      points: m.points,
      status: statusTier.name,
      statusLevel: statusTier.level
    };
  });
  items.sort((a, b) => b.points - a.points);

  return { items, meta: { count: items.length }, tiers };
}

let intervalStarted = false;

export async function startLeaderboardRefresher() {
  if (intervalStarted) return;
  intervalStarted = true;

  async function writeSnapshot() {
    try {
      const data = await fetchFromKepler(globalThis.fetch);
      const outPath = path.join(process.cwd(), 'static', 'leaderboard.json');
      const payload = JSON.stringify({ ...data, lastUpdated: new Date().toISOString() });
      await fs.writeFile(outPath, payload, 'utf8');
    } catch (e) {
      // ignore errors; next tick will retry
    }
  }

  // Write immediately and then every minute
  writeSnapshot();
  setInterval(writeSnapshot, 60_000);
}


