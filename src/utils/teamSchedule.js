import { isFavoriteTeam } from './teams.js'

const byDateAsc = (a, b) => (a.dateObj ?? 0) - (b.dateObj ?? 0)
const byDateDesc = (a, b) => (b.dateObj ?? 0) - (a.dateObj ?? 0)

function teamMatches(name, teamName, nameMap) {
  if (!name) return false
  const mapped = nameMap?.[name]
  if (mapped) return mapped === teamName
  return name === teamName || isFavoriteTeam(name, [teamName])
}

export function scheduleForTeam(data, teamName) {
  if (!data || !teamName) return { live: [], upcoming: [], played: [] }

  const nameMap = data.teamNameMap ?? {}
  const seen = new Set()
  const games = []

  for (const game of [...(data.live ?? []), ...(data.played ?? []), ...(data.upcoming ?? [])]) {
    if (!game?.id || seen.has(game.id)) continue
    if (!teamMatches(game.home, teamName, nameMap) && !teamMatches(game.away, teamName, nameMap)) {
      continue
    }
    seen.add(game.id)
    games.push(game)
  }

  return {
    live: games.filter((game) => game.status === 'live').sort(byDateAsc),
    upcoming: games.filter((game) => game.status === 'upcoming').sort(byDateAsc),
    played: games.filter((game) => game.status === 'finished').sort(byDateDesc),
  }
}
