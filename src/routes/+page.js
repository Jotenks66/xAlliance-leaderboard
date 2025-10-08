import { getFullLeaderboard } from '$lib/api/index.js';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
  // Tie this load to a specific invalidation key so we can force re-run
  depends('data:leaderboard');
  try {
    const full = await getFullLeaderboard(fetch);
    return {
      leaderboard: full.items ?? [],
      tiers: full.tiers ?? [],
      totalCount: full?.meta?.count ?? (Array.isArray(full?.items) ? full.items.length : 0),
      lastUpdated: full?.lastUpdated ?? null,
      error: null
    };
  } catch (e) {
    return { leaderboard: [], tiers: [], totalCount: 0, lastUpdated: null, error: 'Unable to load leaderboard. Please try again later.' };
  }
}


