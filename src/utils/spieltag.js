// Wochenend-Auswahl und -Gruppierung für die Spieltagsübersicht.
import { weekendRange, weekendOf } from './format.js'

const DAY_MS = 24 * 60 * 60 * 1000

function inRange(game, range) {
  return game.dateObj != null && game.dateObj >= range.start.getTime() && game.dateObj < range.end.getTime()
}

// Spiele des aktuellen Wochenendes (Sa+So); sind dort keine, das Wochenende des
// nächsten anstehenden Spiels. Liefert { range, games }.
export function pickWeekend(games) {
  const list = Array.isArray(games) ? games : []
  const range = weekendRange()
  const current = list.filter((g) => inRange(g, range))
  if (current.length) return { range, games: current }

  const next = list
    .filter((g) => g.dateObj != null && g.dateObj >= range.start.getTime())
    .sort((a, b) => a.dateObj - b.dateObj)[0]
  if (!next) return { range, games: [] }

  const nextRange = weekendOf(next.dateObj)
  return { range: nextRange, games: list.filter((g) => inRange(g, nextRange)) }
}

// Spiele nach Kalendertag gruppieren, aufsteigend nach Tag/Zeit.
export function groupByDay(games) {
  const map = new Map()
  for (const game of games) {
    if (game.dateObj == null) continue
    const d = new Date(game.dateObj)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const key = day.getTime()
    if (!map.has(key)) map.set(key, { date: day, games: [] })
    map.get(key).games.push(game)
  }
  for (const entry of map.values()) entry.games.sort((a, b) => (a.dateObj ?? 0) - (b.dateObj ?? 0))
  return [...map.values()].sort((a, b) => a.date - b.date)
}

const pad = (n) => String(n).padStart(2, '0')

export function dayLabel(date) {
  const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' })
  return `${weekday}, ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function weekendLabel(range) {
  const end = new Date(range.end.getTime() - DAY_MS)
  return `${pad(range.start.getDate())}.${pad(range.start.getMonth() + 1)}. – ${pad(end.getDate())}.${pad(end.getMonth() + 1)}.${end.getFullYear()}`
}
