export const API_BASE = 'https://spo.handball4all.de/service/if_g_json.php'

// Standard-Auswahl (Baden-Württembergischer HV, männliche B-Jugend Bezirksliga)
export const DEFAULT_ORG = '216'
export const DEFAULT_REGION = ''
export const DEFAULT_LEAGUE = '164656'

// Teams, die in Tabelle und Spielen hervorgehoben werden (Teilstring-Vergleich)
export const FAVORITE_TEAMS = ['HSG Ettlingen']

// Daten werden für diese Dauer zwischengespeichert
export const CACHE_TTL_MS = 5 * 60 * 1000

// Basis-Link zu den öffentlichen Spielberichten
export const REPORT_BASE = 'https://spo.handball4all.de/misc/sboPublicReports.php?sGID='
