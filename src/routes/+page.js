import { getFullLeaderboard } from '$lib/api/index.js';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
  // Tie this load to a specific invalidation key so we can force re-run
  depends('data:leaderboard');
  try {
    const full = await getFullLeaderboard(fetch);
    return { leaderboard: full.items ?? [], tiers: full.tiers ?? [], error: null };
  } catch (e) {
    return { leaderboard: [], tiers: [], error: 'Unable to load leaderboard. Please try again later.' };
  }
}


