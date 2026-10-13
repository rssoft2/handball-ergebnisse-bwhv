# AGENTS.md

Project memory for opencode. Read this first every session. Keep it short and current.

## What this is

Mobile-first web app that shows **handball results, standings and fixtures** for the
Baden-Württembergischer HV (BWHV, org `216`) plus its region **Schwarzwald-Rhein**
(`246`). German UI. Unofficial companion view, with **HSG Ettlingen** highlighted
everywhere. No backend — the browser calls the public handball4all JSON API directly.

## Commands

- `npm run dev` — Vite dev server (host exposed on LAN)
- `npm run build` — production build to `dist/` (plain `vite build`, not watch)
- `npm run preview` — preview the build
- `npm run qr` — prints LAN URL as a terminal QR and writes `app-qr.png` (gitignored)

No test runner and no linter. Verify via the dev server + UI and `npm run build`.

## Stack

React 19 + Vite 8 (`base: './'`), Tailwind CSS v4 via `@tailwindcss/vite` (no
`tailwind.config`; theme lives in `src/index.css`). Plain JS/JSX (no TypeScript). State
is local React state + a tiny cache; no router (screens via state, league in URL `?cl=`).

## Structure

- `src/config.js` — `API_BASE`, `ORG`, `REGION`, `FAVORITE_TEAMS`, cache TTL, report base
- `src/api/h4a.js` — all HTTP + normalization + cache + age/section grouping
- `src/hooks/useAsync.js` — generic async loader (`{status,data,error,reload}`)
- `src/utils/format.js` — date helpers (`parseGameDate`, `startOfDaysAgo`, …)
- `src/utils/teams.js` — favorite matching (`isFavoriteTeam`) + form (`buildFormByTeam`)
- `src/components/` — Header, LeagueList, LeagueDetail, StandingsTable, MatchList/MatchCard, StateMessage
- `src/App.jsx` — wiring: screen state, URL `?cl=`, theme state, data loading
- `scripts/qr.mjs` — LAN QR code generator
- `.github/workflows/deploy.yml` — GitHub Pages deploy
- `misc/` — reference screenshots (7meter design)

## Data / API (handball4all)

Base: `https://spo.handball4all.de/service/if_g_json.php`, response is an array; use `data[0]`.

- `cmd=po&og=<org>` → statewide leagues (`content.classes`), incl. `gClassLevelName`, `gClassGender`, `gClassAGsDesc`
- `cmd=po&og=<org>&o=<region>` → regional leagues
- `cmd=ps&og=<org>&cl=<league>&ca=1` → standings (`content.score`) + games (`content.futureGames.games`)
- `cmd=cs&og=<org>&cs=<text>` → club search (`searchResult.list`, `{id,lname}`, max 50)
- `cmd=pcu&og=<org>&c=<clubId>` → club page (`content.classes[].games`, grouped by league)

`fetchBwhvLeagues` merges statewide + region 246, drops leagues without a section
(`sectionOf`: Inklusion/Sonstige excluded), and sorts by section → age → level → name.
Standings rows include `pointsPlus`/`pointsMinus` (shown as `plus:minus`). Games have
**names only** (no team ids) plus `gHomePoints`/`gGuestPoints`. `normalizeLeague` splits
into `live`, `played` (done, newest first) and `upcoming`. Spiele tragen `dateObj` als
**Zeitstempel (Zahl)**, damit er die JSON-Zwischenspeicherung übersteht (sonst `Date` →
String → `getTime`-Crash). Cache prefix `h4a:cache:v7`;
theme persisted under `h4a:theme`. All UI text is German.

## Conventions

- Use **semantic tokens** (`bg-surface`, `text-ink`, `text-muted`, `border-line`,
  `text-accent`, `bg-favbg` …) defined in `src/index.css`; don't hardcode slate/white.
  Light + dark (navy) switch automatically via `data-theme` on `<html>`.
- Favor `tabular-nums`; sections use `max-w-3xl mx-auto px-4`.
- Comments in German, sparse. Don't add comments unless they earn their place.
- Reuse `useAsync`; keep API/normalization in `api/h4a.js`, not components.
- Favorite-team highlight is the amber token (`--fav-*`) across table and cards.
- Fonts: Space Grotesk (headings), Hanken Grotesk (body). Design oriented on 7meter.app (not 1:1).

## Current state / decisions

- Screens: **LeagueList** (Tabs **Auswahl** / **Favoriten**; Auswahl = bundesweit + Bereich 246,
  gruppiert nach Männer / Männliche Jugenden / Frauen / Weibliche Jugenden / Gemischte Jugenden /
  Minis, durchsuchbar, alle Sektionen zugeklappt) → **LeagueDetail** (eine Seite: Aktuelle Spiele,
  Tabelle, Kommende Spiele). Aktuelle Spiele aufsteigend, initial nur die letzten 7 Tage,
  Rest per „Alle anzeigen". Tabelle mit `plus:minus`-Punkten und **Form** (letzte 5, S/U/N).
- **Favoriten** (Ligen, Vereine, Mannschaften) **pro Gerät** in `localStorage` unter
  `h4a:favorites:v1` — kein Backend/Login, nicht geräteübergreifend. `src/utils/favorites.js`
  (pure: `load/save/toggle` + `isLeagueFavorite`/`isClubFavorite`/`isTeamFavorite`/
  `favoriteTeamNames`), `src/hooks/useFavorites.js` (State, Persistenz, Cross-Tab via
  `storage`-Event). Stern-Toggle (`FavoriteStar`) an Liga-Zeilen, Verein-/Team-Treffern und für
  die aktuelle Liga im Header. Favoriten-Tab (`FavoritesView`) listet Ligen / Vereine (aufklappbar
  → lädt `fetchClubTeams` lazy) / Mannschaften. Hervorhebung in Tabelle/Spielen über
  `favoriteTeamNames` (Teamnamen **und** Vereinsnamen, weiterhin Teilstring-Match via
  `isFavoriteTeam`). Kein Standard-Favorit (leerer Start), kein Export.
- Deep-Link einer Liga via `?cl=<id>`; Zurück-Button im Header.
- Suche im LeagueList filtert Ligen, Vereine **und** Mannschaften (search-as-you-type; Vereine
  mit `id`=ClubID, Teams mit Liga-Label). Mannschaften kommen über die API-Suche:
  `cmd=cs&cs=<text>` (Vereinssuche, bis 50 Treffer mit `id`=ClubID) → je Verein
  `cmd=pcu&c=<clubId>` (alle Spiele nach Liga gruppiert) → daraus die eigenen Mannschaften
  (Abgleich des Kurznamens aus den Spielen mit dem Vereinsnamen via `isSubsequence`).
  **Merkregel**: der Suchtext steht im Parameter, der wie der Befehl heißt (`cs=<text>`).
  `searchTeams` in `api/h4a.js`; max. `MAX_CLUBS_PER_SEARCH` Vereine je Suche, ~0,6 s Pause,
  Vereine 10 min / Vereinsteams 24 h gecacht. `fetchClubTeams` ist exportiert (für Favoriten).
  **Rate-Limit**: die API drosselt sehr schnell (429/401 oder Body
  `{ "error": "Too many requests" }`). Deshalb wiederholt `getJson` gedrosselte Aufrufe
  automatisch mit Backoff (`THROTTLE_RETRIES`/`THROTTLE_BACKOFF_MS`); erst danach bricht die
  Suche ab („drosselt gerade … bitte warten").
- Zugangshürde: `KeyGate` verlangt `?k=<secret>` (sonst „Kein Zugang"), merkt sich die
  Freigabe unter `h4a:key`, `k` bleibt in der URL. Nur der SHA-256-Hash steht in
  `config.js` (`ACCESS_HASH`); Secret nur im Einladungslink, **nicht** im Repo. Reine
  Hürde, kein echter Schutz. `index.html` hat `noindex`.
- Dark/Light-Toggle im Header (`data-theme`, `h4a:theme`); flackerfreies Init-Script in `index.html`.
- PWA: `public/manifest.webmanifest` + Icons unter `public/icons/` (aus `misc/app-icon.png`
  generiert), iOS-Metas in `index.html`, Safe-Area in `index.css`. Kein Service Worker.
- Git: `main`, remote `origin` = `https://github.com/rssoft2/handball-ergebnisse-bwhv`.
- Hosting: **GitHub Pages** via Actions → https://rssoft2.github.io/handball-ergebnisse-bwhv/

## Next steps / open questions

- Optional: scorer/top-scorer list feature (no data source wired up yet).
- Optional: custom domain (CNAME), PWA.
