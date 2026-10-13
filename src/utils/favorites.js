// Favoriten (Ligen, Vereine, Mannschaften) – pro Gerät/Browser in localStorage.
// Kein Backend: die Daten liegen ausschließlich lokal vor.

export const FAVORITES_STORAGE_KEY = 'h4a:favorites:v1'

export const EMPTY_FAVORITES = { leagues: [], clubs: [], teams: [] }

const key = (value) => String(value ?? '').trim().toLowerCase()

function asArray(value) {
  return Array.isArray(value) ? value : []
}

// Robust gegen kaputte/ältere Einträge: nur brauchbare Objekte behalten, deduplizieren.
function normalize(raw) {
  const data = raw && typeof raw === 'object' ? raw : {}

  const leagues = []
  const leagueIds = new Set()
  for (const item of asArray(data.leagues)) {
    const id = String(item?.id ?? '').trim()
    if (!id || leagueIds.has(id)) continue
    leagueIds.add(id)
    leagues.push({
      id,
      name: String(item?.name ?? '').trim(),
      level: String(item?.level ?? '').trim(),
    })
  }

  const clubs = []
  const clubIds = new Set()
  for (const item of asArray(data.clubs)) {
    const clubId = String(item?.clubId ?? '').trim()
    const clubName = String(item?.clubName ?? '').trim()
    if (!clubId || !clubName || clubIds.has(clubId)) continue
    clubIds.add(clubId)
    clubs.push({ clubId, clubName })
  }

  const teams = []
  const teamKeys = new Set()
  for (const item of asArray(data.teams)) {
    const name = String(item?.name ?? '').trim()
    if (!name) continue
    const leagueId = String(item?.leagueId ?? '').trim()
    const dedupe = `${leagueId}:${key(name)}`
    if (teamKeys.has(dedupe)) continue
    teamKeys.add(dedupe)
    teams.push({
      name,
      leagueId,
      leagueName: String(item?.leagueName ?? '').trim(),
    })
  }

  return { leagues, clubs, teams }
}

export function loadFavorites() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return { ...EMPTY_FAVORITES }
    return normalize(JSON.parse(raw))
  } catch {
    return { ...EMPTY_FAVORITES }
  }
}

export function saveFavorites(favorites) {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    /* localStorage nicht verfügbar – ignorieren */
  }
}

/* ------------------------------------------------------------------ */
/* Prüfen                                                              */
/* ------------------------------------------------------------------ */

export function isLeagueFavorite(favorites, leagueId) {
  const id = String(leagueId ?? '').trim()
  return Boolean(id) && favorites.leagues.some((item) => item.id === id)
}

export function isClubFavorite(favorites, clubName) {
  const needle = key(clubName)
  if (!needle) return false
  return favorites.clubs.some((item) => key(item.clubName) === needle)
}

// Mannschaften werden über Name UND Liga identifiziert: derselbe Name kann in
// mehreren Ligen vorkommen (z.B. die erste Mannschaft jeder Altersklasse).
export function isTeamFavorite(favorites, teamName, leagueId) {
  const needle = key(teamName)
  if (!needle) return false
  const lid = String(leagueId ?? '').trim()
  return favorites.teams.some((item) => key(item.name) === needle && item.leagueId === lid)
}

// Für die Hervorhebung in Tabelle und Spielen: Teamnamen aus Mannschafts-
// UND Vereins-Favoriten (Verein deckt seine Mannschaften mit ab).
export function favoriteTeamNames(favorites) {
  return [
    ...favorites.teams.map((team) => team.name),
    ...favorites.clubs.map((club) => club.clubName),
  ].filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* Umschalten                                                          */
/* ------------------------------------------------------------------ */

export function toggleLeague(favorites, league) {
  const id = String(league?.id ?? '').trim()
  if (!id) return favorites
  if (isLeagueFavorite(favorites, id)) {
    return { ...favorites, leagues: favorites.leagues.filter((item) => item.id !== id) }
  }
  return {
    ...favorites,
    leagues: [
      { id, name: String(league.name ?? '').trim(), level: String(league.level ?? '').trim() },
      ...favorites.leagues,
    ],
  }
}

export function toggleClub(favorites, club) {
  const clubId = String(club?.clubId ?? '').trim()
  const clubName = String(club?.clubName ?? '').trim()
  if (!clubId || !clubName) return favorites
  const exists = favorites.clubs.some((item) => item.clubId === clubId)
  if (exists) {
    return { ...favorites, clubs: favorites.clubs.filter((item) => item.clubId !== clubId) }
  }
  return { ...favorites, clubs: [{ clubId, clubName }, ...favorites.clubs] }
}

export function toggleTeam(favorites, team) {
  const name = String(team?.name ?? team?.teamName ?? '').trim()
  if (!name) return favorites
  const leagueId = String(team?.leagueId ?? '').trim()
  if (isTeamFavorite(favorites, name, leagueId)) {
    return {
      ...favorites,
      teams: favorites.teams.filter(
        (item) => !(key(item.name) === key(name) && item.leagueId === leagueId),
      ),
    }
  }
  return {
    ...favorites,
    teams: [
      {
        name,
        leagueId,
        leagueName: String(team?.leagueName ?? '').trim(),
      },
      ...favorites.teams,
    ],
  }
}
