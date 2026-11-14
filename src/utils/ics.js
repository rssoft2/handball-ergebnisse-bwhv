const encoder = new TextEncoder()

const TIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

const pad = (value) => String(value).padStart(2, '0')

function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function foldLine(line) {
  if (encoder.encode(line).length <= 75) return line

  const parts = []
  let part = ''
  let bytes = 0
  let limit = 75

  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > limit) {
      parts.push(part)
      part = char
      bytes = size
      limit = 74
    } else {
      part += char
      bytes += size
    }
  }

  if (part) parts.push(part)
  return parts.join('\r\n ')
}

function parseWhen(game) {
  const date = String(game?.date ?? '').match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/)
  if (!date) return null

  let year = Number(date[3])
  if (year < 100) year += 2000

  const time = String(game?.time ?? '').trim().match(/^(\d{1,2}):(\d{2})/)
  const hasTime = Boolean(time)
  const hour = hasTime ? Number(time[1]) : 0
  const minute = hasTime ? Number(time[2]) : 0
  const month = Number(date[2])
  const day = Number(date[1])

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    hasTime,
    sortKey: Date.UTC(year, month - 1, day, hour, minute),
  }
}

function addDays(value, days) {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day + days))
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

function icsDate(value) {
  return `${value.year}${pad(value.month)}${pad(value.day)}`
}

function icsTime(hour, minute) {
  return `${pad(hour)}${pad(minute)}00`
}

function utcStamp(value) {
  const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date()
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function uidFor(game) {
  const base =
    String(game?.id ?? '').trim() ||
    `${game?.date ?? ''}-${game?.home ?? ''}-${game?.away ?? ''}`
  const safe = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safe || 'spiel'}@handball-ergebnisse-bwhv`
}

function eventFor(game, when, stamp, leagueShortName) {
  const home = String(game?.home ?? '').trim()
  const away = String(game?.away ?? '').trim()
  const league = String(game?.leagueName ?? '').trim()
  const shortLeague = String(leagueShortName ?? '').trim()
  const venue = String(game?.venue ?? '').trim()
  const street = String(game?.street ?? '').trim()
  const postal = String(game?.postal ?? '').trim()
  const town = String(game?.town ?? '').trim()

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uidFor(game)}`,
    `DTSTAMP:${stamp}`,
  ]

  if (when.hasTime) {
    const totalMinutes = when.hour * 60 + when.minute + 90
    const dayOffset = Math.floor(totalMinutes / 1440)
    const endMinutes = totalMinutes % 1440
    const endDate = addDays(when, dayOffset)

    lines.push(`DTSTART;TZID=Europe/Berlin:${icsDate(when)}T${icsTime(when.hour, when.minute)}`)
    lines.push(
      `DTEND;TZID=Europe/Berlin:${icsDate(endDate)}T${icsTime(
        Math.floor(endMinutes / 60),
        endMinutes % 60,
      )}`,
    )
  } else {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(when)}`)
    lines.push(`DTEND;VALUE=DATE:${icsDate(addDays(when, 1))}`)
  }

  const title = [home, away].filter(Boolean).join(' – ') || 'Handballspiel'
  lines.push(`SUMMARY:${escapeText(shortLeague ? `[${shortLeague}] ${title}` : title)}`)

  const location = [venue, street, [postal, town].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  if (location) lines.push(`LOCATION:${escapeText(location)}`)

  const description = [league, home && `Heim: ${home}`, away && `Gast: ${away}`]
    .filter(Boolean)
    .join('\n')
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`)

  lines.push('STATUS:CONFIRMED', 'SEQUENCE:0', 'END:VEVENT')
  return lines
}

export function buildTeamCalendarIcs({ teamName, leagueShortName, games, now = new Date() }) {
  const stamp = utcStamp(now)
  const seen = new Set()
  const entries = []

  for (const game of games ?? []) {
    const when = parseWhen(game)
    if (!when) continue

    const key = String(game?.id ?? '').trim() || `${game?.date}|${game?.time}|${game?.home}|${game?.away}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ game, when })
  }

  entries.sort((a, b) => a.when.sortKey - b.when.sortKey || uidFor(a.game).localeCompare(uidFor(b.game)))

  const name = String(teamName ?? '').trim() || 'Team'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Handball Ergebnisse BWHV//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`Spielplan ${name}`)}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    ...TIMEZONE,
  ]

  for (const entry of entries) {
    lines.push(...eventFor(entry.game, entry.when, stamp, leagueShortName))
  }

  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

export function teamCalendarFilename(teamName) {
  const name = String(teamName ?? '')
    .trim()
    .replace(/ß/g, 'ss')
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `Spielplan-${name || 'Team'}.ics`
}
