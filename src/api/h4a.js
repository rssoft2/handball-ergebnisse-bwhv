import { API_BASE, CACHE_TTL_MS } from '../config.js'
import { parseGameDate, trim } from '../utils/format.js'

const CACHE_PREFIX = 'h4a:cache:v1'

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
    live: Boolean(game.live),
    done: homeGoals !== null && awayGoals !== null,
    dateObj: parseGameDate(game.gDate, game.gTime),
  }
}

function byDateAsc(a, b) {
  return (a.dateObj?.getTime() ?? 0) - (b.dateObj?.getTime() ?? 0)
}

function byDateDesc(a, b) {
  return (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0)
}

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
    played: matches.filter((m) => m.done).sort(byDateDesc),
    upcoming: matches.filter((m) => !m.done).sort(byDateAsc),
  }
}

/* ------------------------------------------------------------------ */
/* Öffentliche API                                                     */
/* ------------------------------------------------------------------ */

// Verbände / Bereiche (aus dem Menü der Schnittstelle)
export async function fetchRegions(org) {
  return getCached(`regions:${org}`, async () => {
    const payload = await getJson({ cmd: 'po', og: org })
    const list = payload.menu?.org?.list ?? {}
    return Object.entries(list).map(([id, name]) => ({ id, name: trim(name) }))
  })
}

// Ligen eines Verbands / Bereichs
export async function fetchLeagues(org, region) {
  return getCached(`leagues:${org}:${region || 'all'}`, async () => {
    const params = { cmd: 'po', og: org }
    if (region) params.o = region
    const payload = await getJson(params)
    const classes = payload.content?.classes ?? []
    return classes
      .map((c) => ({
        id: String(c.gClassID),
        sname: trim(c.gClassSname),
        name: trim(c.gClassLname),
        level: trim(c.gClassLevelName),
        gender: trim(c.gClassGender),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
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
