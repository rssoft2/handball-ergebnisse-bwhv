// Wandelt "19.09.26" + "14:15" in ein Date-Objekt um (für Sortierung).
export function parseGameDate(gDate, gTime) {
  if (!gDate) return null
  const m = String(gDate).match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  let year = Number(m[3])
  if (year < 100) year += 2000

  let hours = 0
  let minutes = 0
  const t = gTime ? String(gTime).match(/(\d{1,2}):(\d{2})/) : null
  if (t) {
    hours = Number(t[1])
    minutes = Number(t[2])
  }
  return new Date(year, month - 1, day, hours, minutes)
}

// "19.09.26" -> "19.09.2026"
export function formatDate(gDate) {
  if (!gDate) return ''
  const m = String(gDate).match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/)
  if (!m) return String(gDate)
  let year = m[3]
  if (year.length === 2) year = `20${year}`
  const dd = m[1].padStart(2, '0')
  const mm = m[2].padStart(2, '0')
  return `${dd}.${mm}.${year}`
}

export function formatTime(gTime) {
  return gTime ? String(gTime).trim() : ''
}

export function trim(value) {
  return value == null ? '' : String(value).trim()
}

// Mitternacht vor `days` Tagen (gleicher Wochentag, eine Woche zurück bei days=7).
export function startOfDaysAgo(days, now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
}

// Mitternacht des Tages eines Zeitstempels.
function dayStart(ms) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Zeitspanne des Wochenendes um ein Datum: Samstag 00:00 bis Montag 00:00
// (exklusiv, deckt also Samstag + Sonntag ab).
export function weekendOf(ms, now = new Date()) {
  const date = ms == null ? dayStart(now.getTime()) : dayStart(ms)
  const dow = date.getDay() // 0 = Sonntag … 6 = Samstag
  const toSaturday = (6 - dow + 7) % 7
  const saturday = addDays(date, dow === 0 ? -1 : toSaturday)
  return { start: saturday, end: addDays(saturday, 2) }
}

// Aktuelles bzw. kommendes Wochenende: ist heute Samstag/Sonntag, dieses
// Wochenende, sonst das nächste.
export function weekendRange(now = new Date()) {
  const today = dayStart(now.getTime())
  const dow = today.getDay()
  const saturday = dow === 0 ? addDays(today, -1) : addDays(today, (6 - dow + 7) % 7)
  return { start: saturday, end: addDays(saturday, 2) }
}
