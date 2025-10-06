<script>
  import { afterNavigate, invalidate, invalidateAll } from '$app/navigation';
  import Toast from '$lib/components/Toast.svelte';
  let { data } = $props();
  const leaderboard = data?.leaderboard ?? [];
  const tiers = data?.tiers?.items ?? data?.tiers ?? [];
  const error = data?.error || null;
  const totalCount = data?.totalCount ?? (Array.isArray(leaderboard) ? leaderboard.length : 0);
  const lastUpdated = data?.lastUpdated ?? null;
  const formatNumber = (n) => new Intl.NumberFormat().format(n);
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };
  let selectedLevel = $state(0);
  let search = $state('');
  let tierCounts = $state({});
  function computeTierCounts() {
    const counts = {};
    for (const it of leaderboard) {
      const lvl = Number(it?.statusLevel || 0);
      counts[lvl] = (counts[lvl] || 0) + 1;
    }
    tierCounts = counts;
  }
  computeTierCounts();
  const filtered = () => {
    const base = selectedLevel ? leaderboard.filter((i) => i.statusLevel === selectedLevel) : leaderboard;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((i) => {
      const name = (i.herotag || '').toLowerCase();
      const addr = (i.address || '').toLowerCase();
      return name.includes(q) || addr.includes(q);
    });
  };
  function toggleTier(level) {
    selectedLevel = selectedLevel === level ? 0 : level;
  }

  function displayUser(item) {
    if (item?.herotag && item.herotag.trim().length > 0) return item.herotag;
    const addr = item?.address || '';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 7)}…${addr.slice(-7)}`;
  }

  async function copyAddress(addr) {
    try {
      await navigator.clipboard.writeText(addr);
      copiedAddress = addr;
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedAddress = '';
      }, 1200);
    } catch (e) {
      // noop
    }
  }
  let copiedAddress = $state('');
  let copyTimeout;

  // When navigating back/forward, the browser may restore from bfcache without rerunning load.
  // This ensures we re-fetch the leaderboard data on restore.
  afterNavigate((nav) => {
    // Re-fetch when navigating via browser history (back/forward)
    if (nav.type === 'popstate') {
      invalidate('data:leaderboard');
    }
  });

  // Note: do not invalidate on initial mount to avoid double-fetch
</script>

<div class="panel" style="margin-bottom: 16px; padding: 12px 16px;">
  <div class="title" style="font-size: 22px; margin: 0 0 8px;">Tiers</div>
  {#if !tiers || tiers.length === 0}
    <div class="subtle">No tiers available.</div>
  {:else}
    <div class="tiers" role="tablist" aria-label="Tier filters">
      <button class={`tier-item ${selectedLevel === 0 ? 'active' : ''}`} role="tab" aria-selected={selectedLevel === 0} onclick={() => toggleTier(0)}>
        <span class="tier-dot"></span>
        <span class="tier-name">All</span>
        <span class="tier-meta">{formatNumber(leaderboard.length)} members</span>
      </button>
      {#each tiers as t}
        <button class={`tier-item tier-l${t.level} ${selectedLevel === t.level ? 'active' : ''}`} role="tab" aria-selected={selectedLevel === t.level} onclick={() => toggleTier(t.level)}>
          <span class="tier-dot"></span>
          <span class="tier-name">{t.name}</span>
          <span class="tier-meta">{formatNumber(t.min)}XP</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="panel" style="padding: 12px 16px;">
  <h1 class="title" style="margin: 0 8px 8px">Leaderboard</h1>
  <div class="toolbar" style="display:flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 8px 8px 12px;">
    <div class="badges" style="display:flex; gap: 8px; align-items:center;">
      <span class="badge" title="Total members">Total: {formatNumber(totalCount)}</span>
      {#if lastUpdated}
        <span class="badge" title={lastUpdated}>Updated: {formatTime(lastUpdated)}</span>
      {/if}
    </div>
    <div class="search-wrap" style="position: relative; min-width: 220px;">
      <input class="search" placeholder="Search user or address…" value={search} oninput={(e) => search = e.currentTarget.value} aria-label="Search leaderboard" />
    </div>
  </div>

{#if error}
  <p class="subtle">{error}</p>
{:else if leaderboard.length === 0}
  <p class="subtle">No entries yet.</p>
{:else}
  {#if filtered().length === 0}
    <p class="subtle" style="padding: 8px 8px 12px;">No members match your filter.</p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="rank">#</th>
            <th>User</th>
            <th>Tier</th>
            <th>XP</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered() as item, idx}
            <tr>
              <td class="rank">
                {idx + 1}
              </td>
              <td>
                <button class="user" title="Click to copy address" onclick={() => copyAddress(item.address)}>
                  <span class="herotag user-text">{displayUser(item)}</span>
                </button>
              </td>
              <td><span class={`status l${item.statusLevel || 0}`}>{item.status || '—'}</span></td>
              <td class="points big-points">{formatNumber(item.points)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <Toast message="Copied" visible={!!copiedAddress} />
{/if}
</div>
