# xAlliance XP Leaderboard

A SvelteKit app that displays the xAlliance DAO XP leaderboard with live tier filters and Herotag display. Data is periodically fetched from Kepler and cached to a local `static/leaderboard.json` snapshot for fast client loads.

## Features
- Tiered leaderboard with XP totals and status levels
- Herotag resolution when available, with address copy-to-clipboard
- Auto-refresh background job that writes `static/leaderboard.json` every minute
- Client-side filtering by tier and cache-bypass fetches for fresh data

## Prerequisites
- Bun 1.0+

## Quickstart
```sh
# install deps
bun install

# run dev server
bun run dev

# build for production
bun run build

# preview production build
bun run preview
```

## Environment Variables
This app reads a private API key at server start to fetch data from Kepler:

- `KEPLER_KEY`: Kepler API key for `https://kepler-api.projectx.mx/`

Provide it via your shell environment (recommended for local dev):
```sh
export KEPLER_KEY="your-kepler-api-key"
bun run dev
```

Or configure it in your deployment provider's environment settings.

## How it works
- `src/hooks.server.js` calls `startLeaderboardRefresher()` once on first server start.
- `src/lib/server/refresher.js`:
  - Queries Kepler for DAO members and tiers using `KEPLER_KEY`.
  - Converts base64 responses, computes each member's status tier by min XP thresholds.
  - Tries to resolve Herotags from `https://herotag.projectx.mx/search` with a few payload fallbacks.
  - Writes a snapshot to `static/leaderboard.json` immediately and every 60 seconds.
- The client page (`src/routes/+page.svelte`) loads the snapshot via `getFullLeaderboard()` from `src/lib/api/index.js` and renders a filterable table.
- On back/forward navigation, it re-invalidates the data to refresh.

If `KEPLER_KEY` is missing, the refresher writes an empty leaderboard.

## Available scripts
- `bun run dev`: Start the Vite dev server
- `bun run build`: Build for production
- `bun run preview`: Preview the production build
- `bun run format`: Format with Prettier
- `bun run lint`: Check formatting with Prettier

## Deployment
- Build with `bun run build` and serve the output with an appropriate adapter (default is `@sveltejs/adapter-auto`).
- Ensure `KEPLER_KEY` is set in the deployment environment.
- The refresher writes to `static/leaderboard.json` at runtime. In serverless environments where the filesystem is read-only, you may need to:
  - Use an adapter/environment that allows runtime writes; or
  - Modify the refresher to persist snapshots to a writable store (e.g., object storage) and serve from there.

## Troubleshooting
- No data appearing: verify `KEPLER_KEY` is configured and valid.
- Snapshot not updating: confirm the environment allows writing to `static/leaderboard.json` and that `hooks.server.js` runs on startup.
- CORS/fetch errors: ensure outbound access to `kepler-api.projectx.mx` and `herotag.projectx.mx`.

## License
MIT
