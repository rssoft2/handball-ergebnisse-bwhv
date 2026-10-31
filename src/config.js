// App-Version (Anzeige im Footer)
export const APP_VERSION = '1.15.0'

export const API_BASE = 'https://spo.handball4all.de/service/if_g_json.php'

// Es werden ausschließlich Daten des Baden-Württembergischen HV geladen:
// landesweite Ligen (ohne Bereich) plus die Ligen des Bereichs Schwarzwald-Rhein.
export const ORG = '216'
export const REGION = '246'

// Daten werden für diese Dauer zwischengespeichert
export const CACHE_TTL_MS = 5 * 60 * 1000

// Team-Suche: Vereins-Suche und Vereinsseiten ändern sich selten.
export const CLUB_SEARCH_TTL_MS = 10 * 60 * 1000
export const CLUB_TEAMS_TTL_MS = 24 * 60 * 60 * 1000

// Pro Suche: höchstens so viele Vereine auflösen; Pause zwischen den Aufrufen,
// um die Drosselung der API (429) zu vermeiden.
export const MAX_CLUBS_PER_SEARCH = 8
export const CLUB_FETCH_INTERVAL_MS = 600

// Die API erlaubt nur wenige Anfragen pro Zeitfenster (sonst 429). Bei einer
// Drosselung wird mit wachsendem Abstand erneut versucht.
export const THROTTLE_RETRIES = 3
export const THROTTLE_BACKOFF_MS = 1500

// Kleine Pause zwischen aufeinanderfolgenden API-Aufrufen, damit keine
// Anfrage-Bursts entstehen (die API drosselt sonst schnell).
export const REQUEST_GAP_MS = 500

// Live-Ticker: Live-Spiele der API tragen gToken/gAppid. Die Ticker-Daten
// kommen CORS-freigegeben (access-control-allow-origin: *) von if_ticker_data.php.
export const TICKER_DATA_BASE = 'https://spo.handball4all.de/service/if_ticker_data.php'

// Offizielle Ticker-Seite (Dojo-App) zum Verlinken/Öffnen in neuem Tab. Direkt die
// Zielseite verwenden: `ticker.html` ist nur eine Demo-Hülle, die per JS auf
// `ticker.php` weiterleitet (dort 302 → `ticker/index.html`). Der Umweg ist
// unzuverlässig; `ticker.php?token=` landet am Ende genau hier.
export const TICKER_PAGE_BASE = 'https://spo.handball4all.de/service/ticker/index.html'

// Der offizielle Ticker fragt selbst alle 15 s nach neuen Nachrichten.
export const LIVE_POLL_MS = 15000

// Übersicht aller laufenden Spiele (Live-Tab der Startseite): kurz cachen und
// aktualisieren, solange der Tab sichtbar ist. Nicht zu häufig pollen – die
// `po`-Übersicht ist schwer und die API drosselt schnell.
export const LIVE_LIST_POLL_MS = 30000
export const LIVE_LIST_TTL_MS = 20000

// Basis-Link zu den öffentlichen Spielberichten (PDF). Die URL erlaubt kein
// CORS, deshalb wird der Bericht im Browser über einen Textdienst geladen.
export const REPORT_BASE = 'https://spo.handball4all.de/misc/sboPublicReports.php?sGID='

// CORS-fähiger Dienst, der das PDF in Text umwandelt (r.jina.ai/<url>).
export const REPORT_PROXY_BASE = 'https://r.jina.ai/'

// Berichte sind nach Spielende unveränderlich -> lange zwischenspeichern.
export const REPORT_TTL_MS = 365 * 24 * 60 * 60 * 1000

// Liga-Statistik (Torschützenliste): aggregiert alle Berichte einer Liga.
// Ergebnis wird signaturbasiert (Anzahl beendeter Spiele) zwischengespeichert.
export const LEAGUE_STATS_TTL_MS = 7 * 24 * 60 * 60 * 1000
// Zusätzliche Pause zwischen den Berichtsaufrufen (der Textdienst drosselt).
export const LEAGUE_STATS_GAP_MS = 400

// Wochenplan (Spielwoche): `po&do=`-Aufrufe (landesweit + Region) liefern alle
// Spiele einer Woche. Kurz cachen, weil Scores/Live sich ändern.
export const SCHEDULE_TTL_MS = 5 * 60 * 1000

// Einfache Zugangshürde: Zugang nur mit ?k=<secret>. Es liegt nur der
// SHA-256-Hash im Code, das Secret selbst wird nicht ausgeliefert.
// Hinweis: reine Hürde, kein echter Schutz (Bundle/URL sind auslesbar).
export const ACCESS_PARAM = 'k'
export const ACCESS_HASH =
  'a9049ec1e706542bc3231b8d8f40a462102ec72b16ad0f2468af97c6a89574e6'
export const ACCESS_STORAGE_KEY = 'h4a:key'
