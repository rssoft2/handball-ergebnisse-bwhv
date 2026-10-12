# AGENTS.md

Project memory for opencode. Read this first every session. Keep it short and current.

## What this is

Mobile-first web app that shows **handball results, standings and fixtures** for
Baden-Württemberg (handball4all data). German UI. Unofficial companion view, with
**HSG Ettlingen** highlighted everywhere. No backend — the browser calls the public
handball4all JSON API directly.

## Commands

- `npm run dev` — Vite dev server (host exposed on LAN)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the build
- `npm run qr` — prints LAN URL as a terminal QR and writes `app-qr.png` (gitignored)

No test runner and no linter are configured yet. Verify changes by running the dev
server and checking the UI, plus `npm run build` for compile errors.

## Stack

React 19 + Vite 8, Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config`; theme
lives in `src/index.css`). Plain JS/JSX (no TypeScript). State is local React state +
a tiny cache; no router, no state library.

## Structure

- `src/config.js` — API base, default org/region/league, `FAVORITE_TEAMS`, cache TTL, report base URL
- `src/api/h4a.js` — all HTTP + normalization + in-memory/localStorage cache
- `src/hooks/useAsync.js` — generic async loader (`{status,data,error,reload}`)
- `src/utils/format.js`, `src/utils/teams.js` — date formatting, favorite-team matching
- `src/components/` — Header, LeagueSelector, TabSwitcher, StandingsTable, MatchList/MatchCard, StateMessage
- `src/App.jsx` — wiring: selection state (URL params + localStorage), data loading, tab switch
- `scripts/qr.mjs` — LAN QR code generator

## Data / API (handball4all)

Base: `https://spo.handball4all.de/service/if_g_json.php`, response is an array; use `data[0]`.

- `cmd=po&og=<org>` → menu of areas/regions (`menu.org.list`)
- `cmd=po&og=<org>&o=<region>` → leagues (`content.classes`)
- `cmd=ps&og=<org>&cl=<league>&ca=1` → standings (`content.score`) + games (`content.futureGames.games`)

`normalizeLeague` splits games into `played` (has both goals, newest first) and `upcoming`.
Favorites matched as case-insensitive **substring** (`isFavoriteTeam`). Cache key prefix
`h4a:cache:v1`; selection persisted under `h4a:selection:v1`. All UI text is German.

## Conventions

- Tailwind utility classes only; always provide `dark:` variants (light + dark theme).
- Favor `tabular-nums` for scores/standings; keep sections `max-w-3xl mx-auto px-4`.
- Comments in German, sparse. Don't add comments unless they earn their place.
- Reuse `useAsync` for data fetching; keep API/normalization in `api/h4a.js`, not components.
- Favorite-team highlighting is the amber accent used across table and cards.

## Current state / decisions

- Live app logic is feature-complete for: league picker (region + search), table,
  results, upcoming fixtures, report links, refresh, LIVE badges, caching.
- Selection is shareable via query params (`og`, `o`, `cl`, `tab`).
- Git: repo initialized, **no commits yet** — all files currently untracked.
- `Torschuetzenliste_HSG_Ettlingen.pdf` (top-scorer list) is present but **not yet
  integrated**; a scorer-list feature was a candidate next step.

## Next steps / open questions

- PWA / deployment target not decided.
