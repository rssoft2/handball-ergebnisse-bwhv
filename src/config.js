export const API_BASE = 'https://spo.handball4all.de/service/if_g_json.php'

// Es werden ausschließlich Daten des Baden-Württembergischen HV geladen:
// landesweite Ligen (ohne Bereich) plus die Ligen des Bereichs Schwarzwald-Rhein.
export const ORG = '216'
export const REGION = '246'

// Teams, die in Tabelle und Spielen hervorgehoben werden (Teilstring-Vergleich)
export const FAVORITE_TEAMS = ['HSG Ettlingen']

// Daten werden für diese Dauer zwischengespeichert
export const CACHE_TTL_MS = 5 * 60 * 1000

// Mannschaftslisten je Liga (für die Team-Suche) ändern sich selten.
// Lange TTL: der Index wird nur einmal aufgebaut und dann wiederverwendet.
export const TEAM_INDEX_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Basis-Link zu den öffentlichen Spielberichten
export const REPORT_BASE = 'https://spo.handball4all.de/misc/sboPublicReports.php?sGID='

// Einfache Zugangshürde: Zugang nur mit ?k=<secret>. Es liegt nur der
// SHA-256-Hash im Code, das Secret selbst wird nicht ausgeliefert.
// Hinweis: reine Hürde, kein echter Schutz (Bundle/URL sind auslesbar).
export const ACCESS_PARAM = 'k'
export const ACCESS_HASH =
  'a9049ec1e706542bc3231b8d8f40a462102ec72b16ad0f2468af97c6a89574e6'
export const ACCESS_STORAGE_KEY = 'h4a:key'
