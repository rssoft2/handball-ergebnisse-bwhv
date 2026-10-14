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

// Basis-Link zu den öffentlichen Spielberichten (PDF). Die URL erlaubt kein
// CORS, deshalb wird der Bericht im Browser über einen Textdienst geladen.
export const REPORT_BASE = 'https://spo.handball4all.de/misc/sboPublicReports.php?sGID='

// CORS-fähiger Dienst, der das PDF in Text umwandelt (r.jina.ai/<url>).
export const REPORT_PROXY_BASE = 'https://r.jina.ai/'

// Berichte sind nach Spielende unveränderlich -> lange zwischenspeichern.
export const REPORT_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Einfache Zugangshürde: Zugang nur mit ?k=<secret>. Es liegt nur der
// SHA-256-Hash im Code, das Secret selbst wird nicht ausgeliefert.
// Hinweis: reine Hürde, kein echter Schutz (Bundle/URL sind auslesbar).
export const ACCESS_PARAM = 'k'
export const ACCESS_HASH =
  'a9049ec1e706542bc3231b8d8f40a462102ec72b16ad0f2468af97c6a89574e6'
export const ACCESS_STORAGE_KEY = 'h4a:key'
