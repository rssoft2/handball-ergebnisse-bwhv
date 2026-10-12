import { API_BASE, CACHE_TTL_MS } from '../config.js'
import { parseGameDate, trim } from '../utils/format.js'

const CACHE_PREFIX = 'h4a:cache:v3'

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

async function getJson(params) {
  const url = new URL(API_BASE)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Die Handball4all-Schnittstelle antwortet mit Fehler ${res.status}.`)
  }

  const data = await res.json()
  const payload = Array.isArray(data) ? data[0] : data
  if (!payload) throw new Error('Leere Antwort der Schnittstelle.')
  if (payload.error) {
    throw new Error(`Die Schnittstelle meldet einen Fehler: ${payload.error}`)
  }
  return payload
}

/* ------------------------------------------------------------------ */
/* Kleiner Cache (Speicher + localStorage)                             */
/* ------------------------------------------------------------------ */

const memCache = new Map()

function readCache(key) {
  const fresh = (entry) => entry && Date.now() - entry.t < CACHE_TTL_MS

  if (fresh(memCache.get(key))) return memCache.get(key).v

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}:${key}`)
    if (raw) {
      const entry = JSON.parse(raw)
      if (fresh(entry)) {
        memCache.set(key, entry)
        return entry.v
      }
    }
  } catch {
    /* localStorage nicht verfügbar – ignorieren */
  }
  return null
}

function writeCache(key, value) {
  const entry = { t: Date.now(), v: value }
  memCache.set(key, entry)
  try {
    localStorage.setItem(`${CACHE_PREFIX}:${key}`, JSON.stringify(entry))
  } catch {
    /* ignorieren */
  }
}

async function getCached(key, loader, force = false) {
  if (!force) {
    const cached = readCache(key)
    if (cached) return cached
  }
  const value = await loader()
  writeCache(key, value)
  return value
}

/* ------------------------------------------------------------------ */
/* Altersklassen                                                       */
/* ------------------------------------------------------------------ */

const AGE_ORDER = {
  Männer: 0,
  Frauen: 1,
  'Männliche A-Jugend': 2,
  'Weibliche A-Jugend': 3,
  'Männliche B-Jugend': 4,
  'Weibliche B-Jugend': 5,
  'Männliche C-Jugend': 6,
  'Weibliche C-Jugend': 7,
  'Männliche D-Jugend': 8,
  'Weibliche D-Jugend': 9,
  'Männliche E-Jugend': 10,
  'Weibliche E-Jugend': 11,
  'Gemischte D-Jugend': 12,
  'Gemischte E-Jugend': 13,
  'Gemischte F-Jugend': 14,
  Minis: 15,
  Inklusion: 16,
  Sonstige: 17,
}

// Reihenfolge der Bereiche auf dem Startscreen.
const SECTION_ORDER = [
  'Männer',
  'Männliche Jugenden',
  'Frauen',
  'Weibliche Jugenden',
  'Gemischte Jugenden',
  'Minis',
]

const LEVEL_ORDER = [
  'Regionalliga',
  'Oberliga',
  'Verbandsliga',
  'Landesliga',
  'Bezirksoberliga',
  'Bezirksliga',
  'Bezirksklasse',
  '2. Bezirksklasse',
  '3. Bezirksklasse',
  '4. Bezirksklasse',
  'Pokal',
  'Freundschaftsspiele',
  'Sonstige Wettbewerbe',
]

function ageGroupOf(gender, desc) {
  const d = trim(desc)
  if (gender === 'm') {
    if (d === 'M') return 'Männer'
    if ('ABCDE'.includes(d) && d.length === 1) return `Männliche ${d}-Jugend`
  } else if (gender === 'w') {
    if (d === 'F') return 'Frauen'
    if ('ABCDE'.includes(d) && d.length === 1) return `Weibliche ${d}-Jugend`
  } else if (gender === 'g') {
    const lower = d.toLowerCase()
    if (lower.startsWith('gu') || lower === 'minis') return 'Minis'
    if (lower.startsWith('inkl')) return 'Inklusion'
    if ('DEF'.includes(d) && d.length === 1) return `Gemischte ${d}-Jugend`
  }
  return 'Sonstige'
}

function sectionOf(ageGroup) {
  if (ageGroup === 'Männer') return 'Männer'
  if (ageGroup.startsWith('Männliche')) return 'Männliche Jugenden'
  if (ageGroup === 'Frauen') return 'Frauen'
  if (ageGroup.startsWith('Weibliche')) return 'Weibliche Jugenden'
  if (ageGroup.startsWith('Gemischte')) return 'Gemischte Jugenden'
  if (ageGroup === 'Minis') return 'Minis'
  return null
}

function sectionRank(section) {
  const index = SECTION_ORDER.indexOf(section)
  return index === -1 ? SECTION_ORDER.length : index
}

function levelRank(level) {
  const index = LEVEL_ORDER.indexOf(level)
  return index === -1 ? LEVEL_ORDER.length : index
}

/* ------------------------------------------------------------------ */
/* Normalisierung                                                      */
/* ------------------------------------------------------------------ */

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function parseGoals(value) {
  const text = trim(value)
  if (text === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

function normalizeGame(game) {
  const homeGoals = parseGoals(game.gHomeGoals)
  const awayGoals = parseGoals(game.gGuestGoals)
  const live = Boolean(game.live)
  return {
    id: game.gID,
    reportId: game.sGID,
    date: trim(game.gDate),
    weekday: trim(game.gWDay),
    time: trim(game.gTime),
    home: trim(game.gHomeTeam),
    away: trim(game.gGuestTeam),
    homeGoals,
    awayGoals,
    homeHalftime: parseGoals(game.gHomeGoals_1),
    awayHalftime: parseGoals(game.gGuestGoals_1),
    venue: trim(game.gGymnasiumName),
    town: trim(game.gGymnasiumTown),
    street: trim(game.gGymnasiumStreet),
    live,
    done: homeGoals !== null && awayGoals !== null,
    dateObj: parseGameDate(game.gDate, game.gTime),
  }
}

const byDateAsc = (a, b) => (a.dateObj?.getTime() ?? 0) - (b.dateObj?.getTime() ?? 0)
const byDateDesc = (a, b) => (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0)

function normalizeLeague(payload) {
  const head = payload.head ?? {}
  const content = payload.content ?? {}

  const standings = (content.score ?? []).map((row, index) => {
    const goalsFor = toNumber(row.numGoalsShot)
    const goalsAgainst = toNumber(row.numGoalsGot)
    return {
      rank: toNumber(row.tabScore) || index + 1,
      teamId: row.tabTeamID,
      name: trim(row.tabTeamname),
      played: toNumber(row.numPlayedGames),
      won: toNumber(row.numWonGames),
      draw: toNumber(row.numEqualGames),
      lost: toNumber(row.numLostGames),
      goalsFor,
      goalsAgainst,
      diff: goalsFor - goalsAgainst,
      pointsPlus: toNumber(row.pointsPlus),
      pointsMinus: toNumber(row.pointsMinus),
      points: toNumber(row.pointsPlus),
    }
  })

  const rawGames = content.futureGames?.games ?? []
  const matches = rawGames.map(normalizeGame)

  return {
    meta: {
      name: trim(head.name),
      subtitle: trim(head.headline2),
      area: trim(head.headline1),
      updated: trim(head.actualized),
      live: Boolean(head.live),
    },
    standings,
    live: matches.filter((m) => m.live).sort(byDateAsc),
    played: matches.filter((m) => m.done && !m.live).sort(byDateDesc),
    upcoming: matches.filter((m) => !m.done && !m.live).sort(byDateAsc),
  }
}

/* ------------------------------------------------------------------ */
/* Öffentliche API                                                     */
/* ------------------------------------------------------------------ */

async function fetchClassList(org, region) {
  const params = { cmd: 'po', og: org }
  if (region) params.o = region
  const payload = await getJson(params)
  const classes = payload.content?.classes ?? []
  return classes.map((c) => {
    const gender = trim(c.gClassGender)
    const ageGroup = ageGroupOf(gender, c.gClassAGsDesc)
    return {
      id: String(c.gClassID),
      sname: trim(c.gClassSname),
      name: trim(c.gClassLname),
      level: trim(c.gClassLevelName),
      ageGroup,
      section: sectionOf(ageGroup),
    }
  })
}

// Alle relevanten Ligen (landesweit + Bereich), gruppierbar nach Altersklasse.
export async function fetchBwhvLeagues(org, region) {
  return getCached(`leagues:${org}:${region}`, async () => {
    const [statewide, regional] = await Promise.all([
      fetchClassList(org, null),
      fetchClassList(org, region),
    ])
    const byId = new Map()
    for (const item of [...statewide, ...regional]) {
      if (item.section) byId.set(item.id, item)
    }

    return [...byId.values()].sort((a, b) => {
      const sectionDiff = sectionRank(a.section) - sectionRank(b.section)
      if (sectionDiff !== 0) return sectionDiff
      const ageDiff = (AGE_ORDER[a.ageGroup] ?? 99) - (AGE_ORDER[b.ageGroup] ?? 99)
      if (ageDiff !== 0) return ageDiff
      const levelDiff = levelRank(a.level) - levelRank(b.level)
      if (levelDiff !== 0) return levelDiff
      return a.name.localeCompare(b.name, 'de')
    })
  })
}

// Tabelle + Spiele einer Liga
export async function fetchLeague(org, league, force = false) {
  return getCached(
    `league:${org}:${league}`,
    async () => {
      const payload = await getJson({ cmd: 'ps', og: org, cl: league, ca: 1 })
      return normalizeLeague(payload)
    },
    force,
  )
}
