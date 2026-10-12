export const API_BASE = 'https://spo.handball4all.de/service/if_g_json.php'

// Es werden ausschließlich Daten des Baden-Württembergischen HV geladen:
// landesweite Ligen (ohne Bereich) plus die Ligen des Bereichs Schwarzwald-Rhein.
export const ORG = '216'
export const REGION = '246'

// Teams, die in Tabelle und Spielen hervorgehoben werden (Teilstring-Vergleich)
export const FAVORITE_TEAMS = ['HSG Ettlingen']

// Daten werden für diese Dauer zwischengespeichert
export const CACHE_TTL_MS = 5 * 60 * 1000

// Basis-Link zu den öffentlichen Spielberichten
export const REPORT_BASE = 'https://spo.handball4all.de/misc/sboPublicReports.php?sGID='
