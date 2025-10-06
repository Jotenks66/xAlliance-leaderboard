<script>
  import { afterNavigate, invalidate, invalidateAll } from '$app/navigation';
  import Toast from '$lib/components/Toast.svelte';
  let { data } = $props();
  const leaderboard = data?.leaderboard ?? [];
  const tiers = data?.tiers?.items ?? data?.tiers ?? [];
  const error = data?.error || null;
  const formatNumber = (n) => new Intl.NumberFormat().format(n);
  let selectedLevel = $state(0);
  const filtered = () => (selectedLevel ? leaderboard.filter((i) => i.statusLevel === selectedLevel) : leaderboard);
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
    <div class="tiers">
      {#each tiers as t}
        <button class={`tier-item tier-l${t.level} ${selectedLevel === t.level ? 'active' : ''}`} onclick={() => toggleTier(t.level)}>
          <div class="tier-name">{t.name}</div>
          <div class="tier-meta">{formatNumber(t.min)}XP</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="panel" style="padding: 12px 16px;">
  <h1 class="title" style="margin: 0 0 8px">Leaderboard</h1>

{#if error}
  <p class="subtle">{error}</p>
{:else if leaderboard.length === 0}
  <p class="subtle">No entries yet.</p>
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
            <td class="rank">{idx + 1}</td>
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

  <Toast message="Copied" visible={!!copiedAddress} />
{/if}
</div>
