// Wochen-/Tages-Auswahl und -Gruppierung für die Spielplan-Ansichten.

const DAY_MS = 24 * 60 * 60 * 1000

function inRange(game, range) {
  return game.dateObj != null && game.dateObj >= range.start.getTime() && game.dateObj < range.end.getTime()
}

// Spiele innerhalb einer Zeitspanne (start inklusiv, end exklusiv).
export function gamesInRange(games, range) {
  return (Array.isArray(games) ? games : []).filter((game) => inRange(game, range))
}

// Kalenderwoche um ein Datum: Montag 00:00 bis Montag 00:00 (exklusiv).
export function weekOf(ms, now = new Date()) {
  const base = ms == null ? now : new Date(ms)
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const dow = d.getDay() // 0 = Sonntag … 6 = Samstag
  d.setDate(d.getDate() - ((dow + 6) % 7))
  const end = new Date(d)
  end.setDate(end.getDate() + 7)
  return { start: d, end }
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

function rangeLabel(range) {
  const end = new Date(range.end.getTime() - DAY_MS)
  return `${pad(range.start.getDate())}.${pad(range.start.getMonth() + 1)}. – ${pad(end.getDate())}.${pad(end.getMonth() + 1)}.${end.getFullYear()}`
}

export function weekLabel(range) {
  return rangeLabel(range)
}

// ISO-Datum (YYYY-MM-DD) für ein Datum/einen Zeitstempel.
export function isoDate(ms) {
  const d = ms == null ? new Date() : new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIsoDate(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

// Montag der Woche, in der das Datum liegt, als ISO-Datum.
export function mondayIsoOf(ms) {
  return isoDate(weekOf(ms).start)
}
