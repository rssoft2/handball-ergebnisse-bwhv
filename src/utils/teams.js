// Prüft, ob ein Teamname einem der Favoriten entspricht (Teilstring, ohne Groß/Klein).
export function isFavoriteTeam(name, favorites = []) {
  if (!name) return false
  const lower = name.toLowerCase()
  return favorites.some((fav) => fav && lower.includes(fav.toLowerCase()))
}

// Baut pro Team die Form der letzten Spiele (S/U/N, älteste zuerst) auf.
// Erwartet absteigend sortierte gespielte Partien (neueste zuerst).
export function buildFormByTeam(games, limit = 5) {
  const byTeam = new Map()

  const push = (team, result) => {
    if (!team) return
    if (!byTeam.has(team)) byTeam.set(team, [])
    byTeam.get(team).push(result)
  }

  for (const game of games) {
    if (!game.done) continue
    const home = game.homeGoals > game.awayGoals ? 'S' : game.homeGoals < game.awayGoals ? 'N' : 'U'
    const away = home === 'S' ? 'N' : home === 'N' ? 'S' : 'U'
    push(game.home, home)
    push(game.away, away)
  }

  const form = {}
  for (const [team, results] of byTeam) {
    // zuletzt gespielte zuerst erfasst -> auf die letzten `limit` kürzen,
    // dann umdrehen, damit die Anzeige alt -> neu läuft.
    form[team] = results.slice(0, limit).reverse()
  }
  return form
}
