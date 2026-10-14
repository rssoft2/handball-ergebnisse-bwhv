import {
  REPORT_BASE,
  REPORT_PROXY_BASE,
  REPORT_TTL_MS,
  THROTTLE_RETRIES,
  THROTTLE_BACKOFF_MS,
} from '../config.js'

// Spielberichte (PDF) können im Browser nicht direkt geladen werden: die
// handball4all-URL setzt keine CORS-Header. Deshalb holen wir den Text über
// r.jina.ai (CORS-freigegeben) im Format "text" – dort hat jede PDF-Zeile eine
// eigene Zeile, wodurch sich Mannschaftsliste und Spielverlauf auswerten lassen.
const CACHE_PREFIX = 'h4a:report:v4'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function reportUrl(sGID) {
  return `${REPORT_PROXY_BASE}${REPORT_BASE}${sGID}`
}

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

function readCache(sGID) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}:${sGID}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() - entry.t > REPORT_TTL_MS) return null
    return entry.v
  } catch {
    return null
  }
}

function writeCache(sGID, value) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}:${sGID}`, JSON.stringify({ t: Date.now(), v: value }))
  } catch {
    /* localStorage nicht verfügbar / voll – ignorieren */
  }
}

export function cachedReport(sGID) {
  return sGID ? readCache(sGID) : null
}

/* ------------------------------------------------------------------ */
/* Laden                                                               */
/* ------------------------------------------------------------------ */

async function fetchText(sGID) {
  const url = reportUrl(sGID)
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { headers: { Accept: 'text/plain', 'X-Return-Format': 'text' } })
    const text = await res.text()

    if (res.status === 429 || /too many requests|rate limit/i.test(text.slice(0, 400))) {
      if (attempt < THROTTLE_RETRIES) {
        await sleep(THROTTLE_BACKOFF_MS * (attempt + 1))
        continue
      }
      const error = new Error('Der Berichtsdienst drosselt gerade. Bitte später erneut versuchen.')
      error.throttled = true
      throw error
    }
    if (!res.ok) {
      throw new Error(`Bericht konnte nicht geladen werden (${res.status}).`)
    }
    return text
  }
}

export async function getReport(sGID, force = false) {
  if (!sGID) throw new Error('Für dieses Spiel liegt kein Bericht vor.')
  if (!force) {
    const cached = readCache(sGID)
    if (cached) return cached
  }
  const text = await fetchText(sGID)
  const parsed = parseReport(text)
  writeCache(sGID, parsed)
  return parsed
}

/* ------------------------------------------------------------------ */
/* Auswertung des Berichtstexts                                        */
/* ------------------------------------------------------------------ */

function textOf(re, text) {
  const m = text.match(re)
  return m ? m[1].trim() : ''
}

function normName(name) {
  return String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

function isSub(short, full) {
  if (!short) return false
  let i = 0
  for (const ch of full) {
    if (ch === short[i]) i += 1
    if (i === short.length) return true
  }
  return false
}

// Ordnet ein Teamkürzel ("SG Hei/Hel/Gon") Heim oder Gast zu.
function resolveIsHome(code, homeFull, awayFull) {
  const c = normName(code)
  if (!c) return null
  const home = isSub(c, normName(homeFull))
  const away = isSub(c, normName(awayFull))
  if (home && !away) return true
  if (away && !home) return false
  return null
}

const EVENT_LINE_RE = /^\s*\d{1,2}:\d{2}:\d{2}\s+\d{2}:\d{2}\s/
const ACTION_RE =
  '(7m, KEIN Tor durch|7m-Tor durch|Tor durch|Auszeit|2-min Strafe für|Verwarnung für|Disqualifikation mit Bericht für|Disqualifikation für)'
const EVENT_RE = new RegExp(
  `(\\d{1,2}:\\d{2}:\\d{2})\\s+(\\d{2}:\\d{2})\\s+(?:(\\d{1,3}:\\d{1,3})\\s+)?${ACTION_RE}\\s*(.*?)(?=\\s*\\d{1,2}:\\d{2}:\\d{2}\\s+\\d{2}:\\d{2}\\s|$)`,
  'g',
)

function parseActor(rest) {
  const withNr = rest.match(/^(.*?)\s*\(([^)]*),\s*([^)]*)\)$/)
  if (withNr) {
    return { name: withNr[1].trim(), nr: withNr[2].trim(), teamCode: withNr[3].trim() }
  }
  const official = rest.match(/^(.*?),\s*(.*)$/)
  if (official) {
    return { name: official[1].trim(), nr: '', teamCode: official[2].trim() }
  }
  return { name: rest, nr: '', teamCode: '' }
}

function parseEvents(lines) {
  // Nur echte Verlaufszeilen behalten (Kopf-/Fußzeilen der Seiten fallen weg).
  const timeline = lines.filter((l) => EVENT_LINE_RE.test(l)).join('\n')
  const events = []
  EVENT_RE.lastIndex = 0
  let m
  while ((m = EVENT_RE.exec(timeline))) {
    const [, clock, playTime, score, action, restRaw] = m
    const rest = (restRaw || '').trim()

    if (action === 'Auszeit') {
      events.push({ type: 'timeout', clock, playTime, score: null, teamLabel: rest })
      continue
    }

    const actor = parseActor(rest)

    if (action.includes('Tor durch')) {
      events.push({
        type: 'goal',
        clock,
        playTime,
        score: score || null,
        name: actor.name,
        nr: actor.nr,
        teamCode: actor.teamCode,
        seven: action === '7m-Tor durch',
        missed: action === '7m, KEIN Tor durch',
      })
      continue
    }

    const card =
      action === 'Verwarnung für'
        ? 'yellow'
        : action === '2-min Strafe für'
          ? 'two'
          : action === 'Disqualifikation mit Bericht für'
            ? 'blue'
            : 'red'
    events.push({
      type: 'card',
      card,
      clock,
      playTime,
      score: score || null,
      ...actor,
    })
  }
  return events
}

// Eine Zeile der Mannschaftsliste -> Spieler oder null (Funktionär/Kopfzeile).
function parseRosterRow(line) {
  const parts = line.trim().split(/\s+/)
  // Spieler haben eine Zahl in der Nr.-Spalte; A–E sind Betreuer/Trainer.
  if (!/^\d{1,3}$/.test(parts[0])) return null

  let i = 1
  const nameParts = []
  while (i < parts.length && !/\d/.test(parts[i])) {
    nameParts.push(parts[i])
    i += 1
  }
  const name = nameParts.join(' ')
  if (!name) return null

  let goals = 0
  let seven = null
  for (const token of parts.slice(i)) {
    if (/^\d+\/\d+$/.test(token)) {
      seven = token
    } else if (/^(19|20)\d{2}$/.test(token)) {
      // Jahrgang – ignorieren
    } else if (/^\d+$/.test(token) && goals === 0) {
      goals = Number(token)
    }
  }
  return { nr: parts[0], name, goals, seven, cards: [] }
}

function parseRoster(lines) {
  const sections = { home: [], away: [] }
  let side = null
  let homeLabel = ''
  let awayLabel = ''

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('Heim:')) {
      side = 'home'
      homeLabel = line.slice('Heim:'.length).trim()
      continue
    }
    if (line.startsWith('Gast:')) {
      side = 'away'
      awayLabel = line.slice('Gast:'.length).trim()
      continue
    }
    if (/^Spielverlauf/.test(line)) break
    if (!side) continue

    const player = parseRosterRow(line)
    if (player) sections[side].push(player)
  }
  return { homeLabel, awayLabel, sections }
}

const MILESTONE_RANK = 40

// Die dritte Hinausstellung (2 Minuten) ist automatisch eine Disqualifikation.
// Der Bericht protokolliert beim dritten Vergehen sowohl "2-min Strafe" als auch
// "Disqualifikation" zur selben Zeit -> beide zu einer roten Karte zusammenfassen.
function applyCardRules(events) {
  const groups = new Map()
  for (const event of events) {
    if (event.type !== 'card') continue
    const key = `${event.teamCode}|${event.nr}|${event.name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(event)
  }

  const removed = new Set()
  for (const list of groups.values()) {
    const twos = list.filter((e) => e.card === 'two')
    if (twos.length < 3) continue
    const third = twos[2]
    const duplicate = list.find(
      (e) => e.card === 'red' && e !== third && e.playTime === third.playTime,
    )
    third.card = 'red'
    if (duplicate) removed.add(duplicate)
  }

  return removed.size ? events.filter((e) => !removed.has(e)) : events
}

export function parseReport(text) {
  const raw = String(text || '')

  const endstand = raw.match(/Endstand\s+(\d+):(\d+)\s*\((\d+):(\d+)\)/)
  const teams = raw.match(/Heim\s*-\s*Gast\s+(.*?)\s+-\s+(.*?)\s+Endstand/)
  const league = raw.match(
    /Spielklasse[^:]*:\s*(.*?)\s+Spiel\/Datum\s+(\S+)\s*,\s*am\s+([\d.]+)\s+um\s+(\d{1,2}:\d{2})h/,
  )
  const venue = raw.match(/Spielort\s+(.*?)\s+Heim\s*-\s*Gast/)

  const meta = {
    league: league ? league[1].trim() : '',
    no: league ? league[2].trim() : '',
    date: league ? league[3].trim() : '',
    time: league ? league[4].trim() : '',
    venue: venue ? venue[1].trim() : '',
    homeFull: teams ? teams[1].trim() : '',
    awayFull: teams ? teams[2].trim() : '',
    homeGoals: endstand ? Number(endstand[1]) : null,
    awayGoals: endstand ? Number(endstand[2]) : null,
    homeHalf: endstand ? Number(endstand[3]) : null,
    awayHalf: endstand ? Number(endstand[4]) : null,
    winner: textOf(/Sieger\s+(.*?)\s+Zuschauer/, raw),
    spectators: textOf(/Zuschauer:\s*(.*?)\s+Schiedsrichter/, raw),
  }

  const lines = raw.split('\n')
  const events = applyCardRules(parseEvents(lines))

  const roster = parseRoster(lines)
  const rosterTeams = [
    { side: 'home', label: roster.homeLabel || meta.homeFull, players: roster.sections.home },
    { side: 'away', label: roster.awayLabel || meta.awayFull, players: roster.sections.away },
  ].map((team) => ({
    ...team,
    goals: team.players.reduce((sum, p) => sum + p.goals, 0),
  }))

  // Karten aus dem Spielverlauf den Spielern der Mannschaftsliste zuordnen.
  for (const event of events) {
    if (event.type !== 'card') continue
    const side = resolveIsHome(event.teamCode, meta.homeFull, meta.awayFull)
    if (side === null) continue
    const team = rosterTeams[side ? 0 : 1]
    const target = team.players.find(
      (p) => p.nr === event.nr && normName(p.name) === normName(event.name),
    )
    if (target) target.cards.push({ kind: event.card, time: event.playTime })
  }

  // Kurzkürzel ("SG Hei/Hel/Gon") -> vollständiger Teamname für den Verlauf.
  // Nebenbei werden Tore je Mannschaft gezählt, um das 40. Tor einer Mannschaft
  // zu finden (nicht das 40. Tor des Spiels insgesamt).
  const codeLabels = {}
  const teamGoalCount = { home: 0, away: 0 }
  let milestone = null
  for (const event of events) {
    if (event.type === 'timeout' || !event.teamCode) continue
    const isHome = resolveIsHome(event.teamCode, meta.homeFull, meta.awayFull)
    event.side = isHome
    if (!codeLabels[event.teamCode]) {
      codeLabels[event.teamCode] =
        isHome === true
          ? meta.homeFull || event.teamCode
          : isHome === false
            ? meta.awayFull || event.teamCode
            : event.teamCode
    }
    if (event.type === 'goal' && !event.missed && isHome !== null) {
      const key = isHome ? 'home' : 'away'
      teamGoalCount[key] += 1
      event.teamGoalRank = teamGoalCount[key]
      if (!milestone && event.teamGoalRank === MILESTONE_RANK) {
        milestone = {
          rank: MILESTONE_RANK,
          side: isHome,
          name: event.name,
          nr: event.nr,
          teamCode: event.teamCode,
          clock: event.clock,
          playTime: event.playTime,
          score: event.score,
        }
      }
    }
  }

  return {
    meta,
    events,
    timeouts: events.filter((e) => e.type === 'timeout'),
    codeLabels,
    teams: rosterTeams,
    hasData: events.length > 0,
    hasRoster: rosterTeams.some((team) => team.players.length > 0),
    milestone,
  }
}
