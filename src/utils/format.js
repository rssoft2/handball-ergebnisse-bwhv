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


