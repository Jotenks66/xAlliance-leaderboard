const defaultHeaders = { 'content-type': 'application/json' };

async function request(path, init = {}, fetchImpl = fetch) {
  const res = await fetchImpl(path, {
    // Ensure we always bypass caches so data is fresh on load/reload
    cache: 'no-store',
    ...init,
    headers: { ...defaultHeaders, ...(init.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  try {
    return await res.clone().json();
  } catch {
    return await res.text();
  }
}

export function getHealth(fetchImpl) {
  return request('/api/health', {}, fetchImpl);
}

export function getFullLeaderboard(fetchImpl) {
  return request('/leaderboard.json', {}, fetchImpl);
}


