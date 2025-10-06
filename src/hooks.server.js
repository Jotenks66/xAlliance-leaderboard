import { startLeaderboardRefresher } from '$lib/server/refresher.js';

// Kick off the background refresher on first server startup
startLeaderboardRefresher();

export const handle = async ({ event, resolve }) => {
  return resolve(event);
};


