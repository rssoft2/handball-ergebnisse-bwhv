import {
  API_BASE,
  CACHE_TTL_MS,
  CLUB_SEARCH_TTL_MS,
  CLUB_TEAMS_TTL_MS,
  MAX_CLUBS_PER_SEARCH,
  CLUB_FETCH_INTERVAL_MS,
  THROTTLE_RETRIES,
  THROTTLE_BACKOFF_MS,
} from '../config.js'
import { parseGameDate, trim } from '../utils/format.js'

const CACHE_PREFIX = 'h4a:cache:v7'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

// Ein einzelner Aufruf. Bei Drosselung wird der Fehler markiert (`throttled`),
// damit `getJson` ihn mit Backoff wiederholen kann.
async function requestJson(params) {
  const url = new URL(API_BASE)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  const text = await res.text()

  if (res.status === 429 || res.status === 401 || /too many requests/i.test(text)) {
    const error = new Error(`Die Handball4all-Schnittstelle drosselt gerade (${res.status}).`)
    error.throttled = true
    throw error
  }
  if (!res.ok) {
    throw new Error(`Die Handball4all-Schnittstelle antwortet mit Fehler ${res.status}.`)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Die Schnittstelle liefert keine gültige Antwort.')
  }

  const payload = Array.isArray(data) ? data[0] : data
  if (!payload) throw new Error('Leere Antwort der Schnittstelle.')
  if (payload.error) {
    const error = new Error(`Die Schnittstelle meldet einen Fehler: ${payload.error}`)
    if (/too many requests/i.test(String(payload.error))) error.throttled = true
    throw error
  }
  return payload
}

// Bei Drosselung (429) ein paar Mal mit wachsendem Abstand erneut versuchen –
// die API erlaubt nur wenige Anfragen pro Zeitfenster.
async function getJson(params) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestJson(params)
    } catch (error) {
      if (error.throttled && attempt < THROTTLE_RETRIES) {
        await sleep(THROTTLE_BACKOFF_MS * (attempt + 1))
        continue
      }
      throw error
    }
  }
}

/* ------------------------------------------------------------------ */
/* Kleiner Cache (Speicher + localStorage)                             */
/* ------------------------------------------------------------------ */

const memCache = new Map()

function readCache(key) {
  const fresh = (entry) => entry && Date.now() - entry.t < (entry.ttl ?? CACHE_TTL_MS)

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

function writeCache(key, value, ttl) {
  const entry = { t: Date.now(), v: value }
  if (ttl) entry.ttl = ttl
  memCache.set(key, entry)
  try {
    localStorage.setItem(`${CACHE_PREFIX}:${key}`, JSON.stringify(entry))
  } catch {
    /* ignorieren */
  }
}

async function getCached(key, loader, force = false, ttl) {
  if (!force) {
    const cached = readCache(key)
    if (cached) return cached
  }
  const value = await loader()
  writeCache(key, value, ttl)
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
  const date = parseGameDate(game.gDate, game.gTime)
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
    // Als Zeitstempel (Zahl) speichern – übersteht die JSON-Zwischenspeicherung.
    dateObj: date ? date.getTime() : null,
  }
}

const byDateAsc = (a, b) => (a.dateObj ?? 0) - (b.dateObj ?? 0)
const byDateDesc = (a, b) => (b.dateObj ?? 0) - (a.dateObj ?? 0)

// Normalisiert Teamnamen für den Abgleich (Groß/Klein, Umlaute, Sonderzeichen egal).
function normalizeTeamName(name) {
  return trim(name)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

// Prüft, ob `short` als Teilsequenz in `full` steckt.
function isSubsequence(short, full) {
  if (!short) return false
  let i = 0
  for (const char of full) {
    if (char === short[i]) i += 1
    if (i === short.length) return true
  }
  return false
}

// Die API liefert in Spielen nur Kurznamen ("SG Hei/Hel/Gon"), in der Tabelle
// aber Langnamen ("SG Heidelsheim/Helmsheim/Gondelsheim"). Der Kurzname ist
// (fast) immer eine Teilsequenz des Langnamens – darüber ordnen wir zu.
function buildTeamNameMap(shortNames, fullNames) {
  const fulls = [...new Set(fullNames.filter(Boolean))].map((name) => ({
    name,
    norm: normalizeTeamName(name),
  }))

  const map = new Map()
  for (const short of shortNames) {
    const s = trim(short)
    if (!s) continue
    const ns = normalizeTeamName(s)
    if (ns.length < 2) continue
    const matches = fulls.filter((f) => isSubsequence(ns, f.norm))
    if (matches.length === 0) continue
    matches.sort((a, b) => Math.abs(a.norm.length - ns.length) - Math.abs(b.norm.length - ns.length))
    map.set(s, matches[0].name)
  }
  return map
}

// Form (S/U/N) pro Team aus den gespielten Partien (neueste zuerst) ableiten.
function buildFormByTeam(played, nameMap, limit = 5) {
  const byTeam = new Map()
  const push = (team, result) => {
    if (!team) return
    if (!byTeam.has(team)) byTeam.set(team, [])
    byTeam.get(team).push(result)
  }

  for (const game of played) {
    const home = game.homeGoals > game.awayGoals ? 'S' : game.homeGoals < game.awayGoals ? 'N' : 'U'
    const away = home === 'S' ? 'N' : home === 'N' ? 'S' : 'U'
    push(nameMap.get(game.home), home)
    push(nameMap.get(game.away), away)
  }

  const form = {}
  for (const [team, results] of byTeam) {
    // zuletzt gespielt zuerst erfasst -> auf die letzten `limit` kürzen, dann
    // umdrehen, damit die Anzeige alt -> neu läuft.
    form[team] = results.slice(0, limit).reverse()
  }
  return form
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
      pointsPlus: toNumber(row.pointsPlus),
      pointsMinus: toNumber(row.pointsMinus),
      points: toNumber(row.pointsPlus),
    }
  })

  const rawGames = content.futureGames?.games ?? []
  const matches = rawGames.map(normalizeGame)

  const played = matches.filter((m) => m.done && !m.live).sort(byDateDesc)
  const gameTeamNames = new Set()
  for (const m of matches) {
    gameTeamNames.add(m.home)
    gameTeamNames.add(m.away)
  }
  const teamNameMap = buildTeamNameMap(
    gameTeamNames,
    standings.map((s) => s.name),
  )
  const formByTeam = buildFormByTeam(played, teamNameMap)

  return {
    meta: {
      name: trim(head.name),
      subtitle: trim(head.headline2),
      area: trim(head.headline1),
      updated: trim(head.actualized),
      live: Boolean(head.live),
    },
    standings,
    played,
    formByTeam,
    live: matches.filter((m) => m.live).sort(byDateAsc),
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

/* ------------------------------------------------------------------ */
/* Mannschafts-/Vereinssuche                                            */
/* ------------------------------------------------------------------ */
// Die API kennt keine direkte Mannschaftssuche. Es gibt aber eine
// Vereinssuche (`cmd=cs&cs=<text>`) und pro Verein eine Seite (`cmd=pcu&c=<id>`)
// mit allen Spielen des Vereins, gruppiert nach Liga. Aus den Spielen leiten wir
// die Mannschaften des Vereins samt Liga ab. Der Suchtext steht im Parameter,
// der wie der Befehl heißt (`cs=<text>`).

function isThrottled(error) {
  return error?.throttled === true || /\b(429|401)\b|\btoo many requests\b/i.test(error?.message ?? '')
}

// Vereine zu einem Suchbegriff. Liefert [{ clubId, clubName }].
async function findClubs(org, query) {
  const key = `clubs:${org}:${query.toLowerCase()}`
  const cached = readCache(key)
  if (cached) return cached

  const payload = await getJson({ cmd: 'cs', og: org, cs: query })
  const list = payload.searchResult?.list ?? []
  const clubs = list
    .map((item) => ({ clubId: String(item.id), clubName: trim(item.lname) }))
    .filter((club) => club.clubId && club.clubName)

  writeCache(key, clubs, CLUB_SEARCH_TTL_MS)
  return clubs
}

// Mannschaften eines Vereins (aus dessen Spielen) mit Liga-Label.
async function fetchClubTeams(org, club) {
  const key = `clubteams:${org}:${club.clubId}`
  const cached = readCache(key)
  if (cached) return cached

  const payload = await getJson({ cmd: 'pcu', og: org, c: club.clubId })
  const classes = payload.content?.classes ?? []
  const clubNorm = normalizeTeamName(club.clubName)

  const byTeam = new Map()
  for (const cls of classes) {
    const leagueId = cls.gClassID
    const leagueName = trim(cls.gClassLname || cls.gClassSname)
    for (const game of cls.games ?? []) {
      for (const raw of [game.gHomeTeam, game.gGuestTeam]) {
        const teamName = trim(raw)
        if (!teamName) continue
        // Nur die eigene Mannschaft des Vereins. Kurzname (aus den Spielen) und
        // Vereinsname sind oft unterschiedlich lang ("HSG Ettlingen" vs.
        // "HSG Ettlingen 2"), daher in beide Richtungen prüfen.
        const teamNorm = normalizeTeamName(teamName)
        const matches =
          isSubsequence(clubNorm, teamNorm) || isSubsequence(teamNorm, clubNorm)
        if (!matches) continue
        const id = `${leagueId}:${teamName}`
        if (byTeam.has(id)) continue
        byTeam.set(id, { teamName, leagueId, leagueName, clubName: club.clubName })
      }
    }
  }

  const teams = [...byTeam.values()].sort((a, b) => a.teamName.localeCompare(b.teamName, 'de'))
  writeCache(key, teams, CLUB_TEAMS_TTL_MS)
  return teams
}

// Sucht Vereine zum Begriff und sammelt deren Mannschaften. `onClubs` wird noch
// vor dem Laden der Mannschaften aufgerufen (für sofortiges Feedback).
// `throttled` ist true, wenn die API gedrosselt hat (429/401) – dann sind die
// Ergebnisse unvollständig bzw. leer.
export async function searchTeams(org, query, { onClubs } = {}) {
  const q = trim(query)
  if (q.length < 2) return { clubs: [], teams: [], throttled: false }

  let clubs
  try {
    clubs = await findClubs(org, q)
  } catch (error) {
    if (isThrottled(error)) return { clubs: [], teams: [], throttled: true }
    throw error
  }
  if (onClubs) onClubs(clubs)

  const limited = clubs.slice(0, MAX_CLUBS_PER_SEARCH)
  const teams = []
  const seen = new Set()
  let throttled = false
  for (const club of limited) {
    await sleep(CLUB_FETCH_INTERVAL_MS)
    let clubTeams
    try {
      clubTeams = await fetchClubTeams(org, club)
    } catch (error) {
      if (isThrottled(error)) {
        throttled = true
        break
      }
      continue
    }
    for (const team of clubTeams) {
      const id = `${team.leagueId}:${team.teamName}`
      if (seen.has(id)) continue
      seen.add(id)
      teams.push(team)
    }
  }

  teams.sort((a, b) => a.teamName.localeCompare(b.teamName, 'de'))
  return { clubs, teams, throttled }
}
