# AGENTS.md

Project memory for opencode. Read this first every session. Keep it short and current.

## What this is

Mobile-first web app that shows **handball results, standings and fixtures** for the
Baden-Württembergischer HV (BWHV, org `216`) plus its region **Schwarzwald-Rhein**
(`246`). German UI. Unofficial companion view, with **HSG Ettlingen** highlighted
everywhere. No backend — the browser calls the public handball4all JSON API directly.
Spielberichte (PDF) kommen über den CORS-fähigen Textdienst r.jina.ai (siehe unten).

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

- `src/config.js` — `API_BASE`, `ORG`, `REGION`, cache TTLs (+ `LEAGUE_STATS_*`), `REPORT_BASE`/`REPORT_PROXY_BASE`, zeitliche Statuslogik
- `src/api/h4a.js` — all HTTP + normalization + cache + age/section grouping
- `src/api/reports.js` — Spielberichte: Text über Jina holen + parsen (Meta, Spielerstatistik, Spielverlauf)
- `src/api/leagueStats.js` — Liga-Statistik: alle Berichte einer Liga laden + Torschützenliste aggregieren (`fetchLeagueScorers`, `aggregateScorers`)
- `src/api/live.js` — Live-Ticker: `if_ticker_data.php` abfragen + normalisieren
- `src/hooks/useAsync.js` — generic async loader (`{status,data,error,reload}`)
- `src/hooks/useReports.js` — Vorladen/Parsen der Berichte (Queue, Fortschritt, `ensure`)
- `src/hooks/useLive.js` — Live-Ticker laden + alle 15 s aktualisieren (nur bei sichtbarem Tab)
- `src/hooks/useLiveGames.js` — laufende Spiele laden + alle 30 s aktualisieren (Live-Tab, nur bei sichtbarem Tab)
- `src/hooks/useClubSchedule.js` — Spieltag-Spiele eines Vereins (`fetchClubSchedule`)
- `src/hooks/useSpieltag.js` — Spielpläne aller Favoriten-Vereine (Spieltag-Tab, kein Polling)
- `src/hooks/useLeagueScorers.js` — Torschützenliste einer Liga (alle Berichte; nur bei sichtbarem Screen)
- `src/utils/format.js` — date helpers (`parseGameDate`, `startOfDaysAgo`, `weekendRange`/`weekendOf`, …)
- `src/utils/spieltag.js` — Wochenend-Auswahl + Gruppierung (`pickWeekend`, `groupByDay`, `dayLabel`, `weekendLabel`)
- `src/utils/teams.js` — favorite matching (`isFavoriteTeam`, `normalizeTeamName`, `isSubsequence`)
- `src/components/` — Header, LeagueList, LeagueDetail, ClubScreen, StandingsTable, MatchList/MatchCard, StateMessage, LiveGamesView, SpieltagView, LiveScreen, PlayerStats, ReportHeader/ReportStatsScreen/ReportTimelineScreen, LeagueScorersScreen
- `src/App.jsx` — wiring: screen state, URL `?cl=`, theme state, data loading, Bericht-Navigation
- `scripts/qr.mjs` — LAN QR code generator
- `.github/workflows/deploy.yml` — GitHub Pages deploy
- `misc/` — reference screenshots (7meter design)

## Data / API (handball4all)

Base: `https://spo.handball4all.de/service/if_g_json.php`, response is an array; use `data[0]`.

- `cmd=po&og=<org>` → statewide leagues (`content.classes`), incl. `gClassLevelName`, `gClassGender`, `gClassAGsDesc`
- `cmd=po&og=<org>&o=<region>` → regional leagues
- `cmd=ps&og=<org>&cl=<league>&ca=1` → standings (`content.score`) + games (`content.futureGames.games`)
- `cmd=cs&og=<org>&cs=<text>` → club search (`searchResult.list`, `{id,lname}`, max 50)
- `cmd=pcu&og=<org>&c=<clubId>` → club page (`content.classes[].games`, grouped by league; je Liga die Partien des **aktuellen Spieltags**)

`fetchBwhvLeagues` merges statewide + region 246, drops leagues without a section
(`sectionOf`: Inklusion/Sonstige excluded), and sorts by section → age → level → name.
Standings rows include `pointsPlus`/`pointsMinus` (shown as `plus:minus`). Games have
**names only** (no team ids) plus `gHomePoints`/`gGuestPoints`. `normalizeLeague` splits
into `live`, `played` (done, newest first) and `upcoming`. Spiele tragen `dateObj` als
**Zeitstempel (Zahl)**, damit er die JSON-Zwischenspeicherung übersteht (sonst `Date` →
String → `getTime`-Crash). Cache prefix `h4a:cache:v7`;
theme persisted under `h4a:theme`. All UI text is German.

### Live-Ticker
Live-Spiele tragen in der API `live: true` sowie `gToken`/`gAppid`; die Antwort enthält
`head.live` als Poll-Intervall in Sekunden (> 0 solange live). `normalizeGame` legt
`live`, `token`, `appid` offen. Die Ticker-Daten kommen **CORS-freigegeben**
(`access-control-allow-origin: *`) per POST mit leerem Body:

`https://spo.handball4all.de/service/if_ticker_data.php?token=<gToken>&cmd=<cmd>`

- `cmd=getGameInfo` → Envelope (`status` 0 = ok, 3 = keine Daten) **plus** Spielobjekt:
  `class_lname`, `home_lname`, `guest_lname`, `datetime` (`YYYY-MM-DD HH:mm:ss`),
  `gym_name`/`gym_town`, `report.refereeA/B`, `status`/`status_description`.
- `cmd=getAllGameInfo` → `team_home`/`team_guest.team_members[]` (`player_no`, `prename`, `name`).
- `cmd=getAllTickerMessages` → **Array**; je Eintrag `game_time` (Sekunden), `message`
  (deutscher Text), `home_score`, `guest_score`.

Offizielle Seite: **direkt** `ticker/index.html?token=` verlinken (Dojo-App, kein
`X-Frame-Options`). `ticker.html?token=&appid=` ist nur eine Demo-Hülle, die per JS
`document.location.replace("ticker.php?"+search)` macht; `ticker.php` → 302
`ticker/index.html?token=`. Der Umweg ist unzuverlässig (leere Query → `?token=`), daher
`TICKER_PAGE_BASE` = `ticker/index.html`. Der offizielle Ticker pollt selbst alle 15 s (max. 10×).

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

- Screens: **LeagueList** (Tabs **Auswahl** / **Live** / **Spieltag** / **Favoriten**; Auswahl = bundesweit + Bereich 246,
  gruppiert nach Männer / Männliche Jugenden / Frauen / Weibliche Jugenden / Gemischte Jugenden /
  Minis, durchsuchbar, alle Sektionen zugeklappt) → **LeagueDetail** (eine Seite: Letzte Spiele,
  Tabelle, Kommende Spiele). Letzte Spiele **absteigend** (neueste oben), initial nur die
  letzten 7 Tage, Rest per „Alle anzeigen". Tabelle mit `plus:minus`-Punkten und **Form** (letzte 5, S/U/N).
- **Favoriten** (Ligen, Vereine, Mannschaften) **pro Gerät** in `localStorage` unter
  `h4a:favorites:v1` — kein Backend/Login, nicht geräteübergreifend. `src/utils/favorites.js`
  (pure: `load/save/toggle` + `isLeagueFavorite`/`isClubFavorite`/`isTeamFavorite`/
  `favoriteTeamNames`), `src/hooks/useFavorites.js` (State, Persistenz, Cross-Tab via
  `storage`-Event). Stern-Toggle (`FavoriteStar`) an Liga-Zeilen, Verein-/Team-Treffern und für
  die aktuelle Liga im Header. Favoriten-Tab (`FavoritesView`) listet Ligen / Vereine (aufklappbar
  → lädt `fetchClubTeams` lazy) / Mannschaften. Eine Mannschaft ist über **Name + Liga**
  identifiziert (derselbe Name, z. B. „HSG Ettlingen", kommt in vielen Ligen vor –
  ohne die Liga würden alle diese Zeilen einen Stern bekommen). Hervorhebung in Tabelle/Spielen über
  `favoriteTeamNames` (Teamnamen **und** Vereinsnamen). `isFavoriteTeam` (`utils/teams.js`) matcht erst
  per Teilstring, sonst per normalisiertem Teilsequenz-Abgleich in beide Richtungen (Kurzname im Spiel
  vs. Langname im Favoriten, z. B. „SG PF/Eutingen" ↔ „SG Pforzheim/Eutingen"); Team-Nummern
  („… 2") werden getrennt verglichen, ein Vereinsfavorit **ohne** Nummer deckt alle Mannschaften ab.
  `normalizeTeamName`/`isSubsequence` liegen dort und werden auch von `api/h4a.js` (Vereins-/
  Mannschaftszuordnung) genutzt. Kein Standard-Favorit (leerer Start), kein Export.
- Deep-Link einer Liga via `?cl=<id>`; Zurück-Button im Header.
- **Spielberichte** (Statistik + Verlauf als eigene Screens): Die PDF-URL
  (`REPORT_BASE`, `sGID`) setzt **kein CORS** → im Browser nicht direkt ladbar. Der Text kommt
  über **r.jina.ai** (`REPORT_PROXY_BASE + REPORT_BASE + sGID`, CORS-frei, ~2,5 s) mit Header
  **`X-Return-Format: text`** – dadurch hat jede PDF-Zeile eine eigene Textzeile (im Default-
  Markdown sind die Spalten verschoben). `api/reports.js`:
  - Meta aus „Übersicht Spieldaten" (Spielklasse, Nr., Datum/Zeit, Ort, Heim–Gast, Endstand, Sieger).
  - **Mannschaftsliste** → Spieler je Team (Nr., Name, Tore, `7m/ Tore` wie `2/1` =
    **Versuche/verwandelte**, zweite Zahl). Nur Zeilen mit
    **Zahl in der Nr.-Spalte** sind Spieler, Buchstaben (A–E) sind Trainer/Betreuer (werden übersprungen).
  - **Spielverlauf** (`hh:mm:ss  mm:ss  [Stand]  Aktion`) → Events: `Tor durch` / `7m-Tor durch` /
    `7m, KEIN Tor durch`; `Auszeit …`; Karten `Verwarnung für` (gelb), `2-min Strafe für` (»2«-Karte),
    `Disqualifikation für` (rot), `Disqualifikation mit Bericht für` (blau). Karten werden über
    Team-Kürzel + Nr./Name den Spielern der Mannschaftsliste zugeordnet (Offizielle ohne Nr. fallen weg).
  - **40. Tor**: `milestone` markiert den Spieler des 40. Tores **einer Mannschaft** (nicht des
    Spiels insgesamt; `teamGoalRank` je Seite). Hervorhebung in Statistik + Verlauf. Oft `null`.
  Die Team-Summen der Mannschaftsliste entsprechen dem Endstand. `ReportCards.jsx` rendert die Karten
  (gelb/rot/blau als farbige Rechtecke, 2 Min als invertierte Karte mit »2'«). Die **3. Hinausstellung**
  ist automatisch rot (der Bericht loggt dann zusätzlich eine Disqualifikation zur selben Zeit →
  `applyCardRules` fasst beide zu einer roten Karte zusammen). Spielverlauf wird **umgekehrt** gezeigt
  (Spielende oben, Spielanfang unten). `useReports` lädt die sichtbaren
  „Letzten Spiele" (7 Tage) im Hintergrund sequenziell vor (Cache `h4a:report:v4`), `ensure(sGID)`
  lädt on demand. Buttons **Statistik**/**Verlauf** (+ PDF) an `MatchCard`; Screens via `App`-State
  `reportNav`, Header-Zurück zur Liga.
- **Liga-Statistik / Torschützenliste**: `api/leagueStats.js` →
  `fetchLeagueScorers(org, league, {onProgress, force})` zieht `fetchLeague` (gecacht) und lädt
  für alle `played`-Spiele mit `reportId` die Berichte **sequenziell** über `getReport` (gecachte
  überspringen, `LEAGUE_STATS_GAP_MS` Pause). `aggregateScorers` summiert je Spieler Tore,
  7m-Treffer, Spiele und Karten; nur Spieler mit `goals>0`, sortiert Tore↓ / Feld↓ / Name. Spieler
  werden je Team **nur nach Name** zusammengefasst (Rückennummern wechseln zwischen Spielen),
  angezeigt wird die häufigste Nummer. 7m-Treffer aus der Spalte „7m/ Tore" =
  **Versuche/verwandelte** → zweite Zahl.
  Nur **vollständige** Durchläufe (keine fehlgeschlagenen
  Berichte) werden gecacht: `h4a:leaguestats:v2:${org}:${league}` mit Signatur = sGID-Liste,
  TTL `LEAGUE_STATS_TTL_MS`. Berichte sind unveränderlich → `REPORT_TTL_MS` jetzt **1 Jahr**.
  Screen `LeagueScorersScreen` (App-State `statsNav`, erreichbar über Button „Torschützenliste"
  in `LeagueDetail`) zeigt Fortschrittsbalken + Tabelle (Rang/Nr./Spieler/Team/Sp/Tore/Feld/7m,
  sortiert nach Toren; Feld = Tore − 7m),
  Favoriten-Team hervorgehoben, Hinweis „Basis x/y Spiele" falls Berichte fehlen. `useLeagueScorers`
  lädt nur bei sichtbarem Screen und verwirft laufende Ergebnisse beim Verlassen (kein Polling).
- **Live-Tab** (Startseite): listet alle laufenden Spiele landesweit + Bereich 246.
  `fetchLiveGames(org, region)` zieht die `po`-Übersichten beider Bereiche, sammelt Spiele mit
  `live === true` (inkl. Liga-Info), dedupliziert per `gID` und sortiert (Sektion → Alter → Level
  → Liga → Zeit). `useLiveGames` lädt + aktualisiert alle 30 s (`LIVE_LIST_POLL_MS`, Cache-TTL
  `LIVE_LIST_TTL_MS`), nur solange der Tab sichtbar ist. `LiveGamesView` zeigt Anzahl +
  `MatchCard` je Spiel (Karte zeigt den Liga-Namen); Tabs zeigen die Live-Anzahl als Badge.
  `head.live` der API ist **immer 0** – die Anzahl kommt aus `game.live`.
- **Live-Ticker**: Ein Live-Spiel (`game.live && game.token`) zeigt an der `MatchCard` einen
  roten **Live-Ticker**-Button → `LiveScreen` (App-State `liveNav`). `useLive(token)` lädt den
  Snapshot und aktualisiert ihn alle 15 s (`LIVE_POLL_MS`). `api/live.js` klassifiziert die
  Nachrichten per Präfix (`classifyMessage`: Tor / 7m / 7m-Wurf / Verwarnung / 2-min / Disq. /
  Auszeit / Spielstand / Spielzeit). Kopf: Liga, LIVE-Badge, Teams, Stand + Spielzeit (aus der
  letzten Aktion); Liste **neueste Aktion oben**; Karten via `CardMark`; „Spielstand"- und
  Uhr-Meldungen („Spielzeit gestoppt/gestartet", `kind: 'clock'`) werden ausgeblendet.
  Button **Offizieller Ticker** öffnet `ticker/index.html?token=` in neuem Tab. Die Roh­nachrichten
  nennen die Teams „Heimmannschaft"/„Gastmannschaft". `classifyMessage` erkennt den Typ, `buildActions`
  formatiert die Anzeige einheitlich und baut dabei **Spielerstatistik** auf: `formatMessage` →
  „<Aktion> für <Heim|Gast> durch die Nummer <nr> <Name>" (Aktionen: `Tor`, `7m Tor`, `Verwarnung`,
  `2-min Strafe`, `Disqualifikation`, `Disqualifikation mit Bericht`; `Auszeit für Heim/Gast`;
  `7m-Wurf für Gast: Kein Treffer`). Nummer via `/Nummer\s+(\d+)/`, Seite aus „Heim-/Gastmannschaft".
  **Achtung**: Karten nennen die Nummer **vor** dem Team („… für die Nummer 7 der Heimmannschaft"),
  verworfene 7m haben **keine** Nummer. `buildActions` zählt Tore (goal + 7m-Tor) je Spieler,
  7m-Tore, Karten und markiert das 40. Tor einer Mannschaft (`milestone`); Team-Tore = Summe.
  `resolvePlayerNames` entfällt (steckt jetzt in `buildActions`). Der Live-Screen hat zwei Tabs **Ticker** /
  **Aufstellung**: `Lineup` zeigt je Team dieselbe Statistik-Tabelle wie der Spielbericht über die
  gemeinsame Komponente `PlayerStats.jsx` (`TeamStats`, inkl. `isMilestonePlayer`; auch von
  `ReportStatsScreen` genutzt), Spieler aus `teams.home/away.players`. `normalizeTeam` filtert
  Offizielle (Buchstaben als `player_no`) heraus und sortiert nach Nummer.
- **Spieltagsübersicht** (Wochenend-Spiele eines Vereins): `fetchClubSchedule(org, club)`
  nutzt `cmd=pcu&c=<clubId>` – die Vereinsseite liefert je Liga genau die Partien des aktuellen
  Spieltags (Feldaufbau wie `po`, daher `normalizeGame` + Liga-Info/`ageGroup`). Kurz gecacht
  (`clubgames:${org}:${clubId}`, `CLUB_GAMES_TTL_MS` 5 min), aufsteigend nach `dateObj`.
  `fetchClubsSchedules(org, clubs)` lädt mehrere Vereine **nacheinander** (`REQUEST_GAP_MS`) und
  liefert `{clubs, throttled}`. `src/utils/spieltag.js`: `pickWeekend` wählt Sa+So des aktuellen
  Wochenendes, sonst das Wochenende des nächsten anstehenden Spiels (`weekendRange`/`weekendOf`
  in `format.js`); `groupByDay` gruppiert nach Tag, `dayLabel`/`weekendLabel` formatieren.
  Zwei Einstiege: (1) Tipp auf einen Verein (Favoriten-Kalender-Button bzw. Suchtreffer „Vereine")
  → `ClubScreen` (App-State `clubNav`); (2) Startseiten-Tab **Spieltag** → `SpieltagView` mit allen
  Favoriten-Vereinen (je Verein Überschrift antippbar → `ClubScreen`, darunter Spiele nach Tag).
  Header im `ClubScreen`: Vereinstitel + Stern zum Favorisieren. **Keine** Favoriten-Hervorhebung
  der Spiele in den Spieltag-Ansichten (bewusst). Kein Polling (nur manuell).
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
  Suche ab („drosselt gerade … bitte warten"). Gegen Drosselung zusätzlich: Polling nur bei
  sichtbarem Tab (Tab-Kontext), `fetchLiveGames` ruft die beiden `po`-Übersichten **nacheinander**
  mit `REQUEST_GAP_MS`-Pause auf (kein Burst), und `fetchLiveSnapshot` cacht Steckbrief/Kader
  (`baseCache`), sodass beim Polling nur noch `getAllTickerMessages` anfällt.
- Zugangshürde: `KeyGate` verlangt `?k=<secret>` (sonst „Kein Zugang"), merkt sich die
  Freigabe unter `h4a:key`, `k` bleibt in der URL. Nur der SHA-256-Hash steht in
  `config.js` (`ACCESS_HASH`); Secret nur im Einladungslink, **nicht** im Repo. Reine
  Hürde, kein echter Schutz. `index.html` hat `noindex`.
- Dark/Light-Toggle im Header (`data-theme`, `h4a:theme`); flackerfreies Init-Script in `index.html`.
- PWA: `public/manifest.webmanifest` + Icons unter `public/icons/` (aus `misc/app-icon.png`
  generiert), iOS-Metas in `index.html`, Safe-Area in `index.css`. Kein Service Worker.
- Git: `main`, remote `origin` = `https://github.com/rssoft2/handball-ergebnisse-bwhv`.
- Hosting: **GitHub Pages** via Actions → https://rssoft2.github.io/handball-ergebnisse-bwhv/

