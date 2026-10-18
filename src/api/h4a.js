import {
  API_BASE,
  CACHE_TTL_MS,
  CLUB_SEARCH_TTL_MS,
  CLUB_TEAMS_TTL_MS,
  CLUB_GAMES_TTL_MS,
  MAX_CLUBS_PER_SEARCH,
  CLUB_FETCH_INTERVAL_MS,
  THROTTLE_RETRIES,
  THROTTLE_BACKOFF_MS,
  REQUEST_GAP_MS,
  LIVE_LIST_TTL_MS,
} from '../config.js'
import { parseGameDate, trim } from '../utils/format.js'
import { isSubsequence, normalizeTeamName } from '../utils/teams.js'

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
  const done = homeGoals !== null && awayGoals !== null
  const date = parseGameDate(game.gDate, game.gTime)
  const startMs = date ? date.getTime() : null

  // Status über die Anstoßzeit: vorher anstehend, danach live (Flag) bzw. beendet.
  let status
  if (live) status = 'live'
  else if (startMs !== null ? Date.now() >= startMs : done) status = 'finished'
  else status = 'upcoming'

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
    token: trim(game.gToken),
    appid: trim(game.gAppid),
    done,
    status,
    // Als Zeitstempel (Zahl) speichern – übersteht die JSON-Zwischenspeicherung.
    dateObj: startMs,
  }
}

const byDateAsc = (a, b) => (a.dateObj ?? 0) - (b.dateObj ?? 0)
const byDateDesc = (a, b) => (b.dateObj ?? 0) - (a.dateObj ?? 0)

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
    if (!game.done) continue
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

  const played = matches.filter((m) => m.status === 'finished').sort(byDateDesc)
  const playedDone = played.filter((m) => m.done)
  const gameTeamNames = new Set()
  for (const m of matches) {
    gameTeamNames.add(m.home)
    gameTeamNames.add(m.away)
  }
  const teamNameMap = buildTeamNameMap(
    gameTeamNames,
    standings.map((s) => s.name),
  )
  const formByTeam = buildFormByTeam(playedDone, teamNameMap)

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
    live: matches.filter((m) => m.status === 'live').sort(byDateAsc),
    upcoming: matches.filter((m) => m.status === 'upcoming').sort(byDateAsc),
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

// Alle derzeit laufenden Spiele aus einer `po`-Antwort (Wochenübersicht).
function liveGamesOfPayload(payload) {
  const games = []
  for (const c of payload?.content?.classes ?? []) {
    const live = (c.games ?? []).filter((g) => g.live)
    if (!live.length) continue
    const ageGroup = ageGroupOf(trim(c.gClassGender), c.gClassAGsDesc)
    const section = sectionOf(ageGroup)
    if (!section) continue
    for (const raw of live) {
      games.push({
        ...normalizeGame(raw),
        leagueId: String(c.gClassID),
        leagueName: trim(c.gClassLname),
        leagueLevel: trim(c.gClassLevelName),
        leagueSection: section,
        ageGroup,
      })
    }
  }
  return games
}

// Alle laufenden Spiele landesweit + Bereich – für den Live-Tab der Startseite.
export async function fetchLiveGames(org, region, force = false) {
  return getCached(
    `live:${org}:${region}`,
    async () => {
      const params = [{ cmd: 'po', og: org }]
      if (region) params.push({ cmd: 'po', og: org, o: region })
      // Nacheinander mit kleiner Pause statt parallel – die API drosselt
      // gleichzeitige Aufrufe schnell.
      const payloads = []
      for (let i = 0; i < params.length; i += 1) {
        if (i > 0) await sleep(REQUEST_GAP_MS)
        payloads.push(await getJson(params[i]))
      }

      const byId = new Map()
      for (const payload of payloads) {
        for (const game of liveGamesOfPayload(payload)) byId.set(game.id, game)
      }

      return [...byId.values()].sort((a, b) => {
        const sectionDiff = sectionRank(a.leagueSection) - sectionRank(b.leagueSection)
        if (sectionDiff !== 0) return sectionDiff
        const ageDiff = (AGE_ORDER[a.ageGroup] ?? 99) - (AGE_ORDER[b.ageGroup] ?? 99)
        if (ageDiff !== 0) return ageDiff
        const levelDiff = levelRank(a.leagueLevel) - levelRank(b.leagueLevel)
        if (levelDiff !== 0) return levelDiff
        const nameDiff = a.leagueName.localeCompare(b.leagueName, 'de')
        if (nameDiff !== 0) return nameDiff
        return byDateAsc(a, b)
      })
    },
    force,
    LIVE_LIST_TTL_MS,
  )
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

export function isThrottled(error) {
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
export async function fetchClubTeams(org, club) {
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

// Spieltag-/Spielplan-Spiele eines Vereins: alle Mannschaften, alle Spiele aus
// der `pcu`-Vereinsseite (je Liga die aktuellen Partien). Mit Liga-Infos, aufsteigend
// nach Tag/Zeit. Kurz gecacht, weil sich Scores/Live ändern.
export async function fetchClubSchedule(org, club, force = false) {
  const clubId = String(club?.clubId ?? '').trim()
  if (!clubId) return []
  return getCached(
    `clubgames:${org}:${clubId}`,
    async () => {
      const payload = await getJson({ cmd: 'pcu', og: org, c: clubId })
      const classes = payload.content?.classes ?? []
      const byId = new Map()
      for (const cls of classes) {
        const ageGroup = ageGroupOf(trim(cls.gClassGender), cls.gClassAGsDesc)
        const section = sectionOf(ageGroup)
        for (const raw of cls.games ?? []) {
          const game = normalizeGame(raw)
          byId.set(game.id, {
            ...game,
            leagueId: String(cls.gClassID),
            leagueName: trim(cls.gClassLname || cls.gClassSname),
            leagueLevel: trim(cls.gClassLevelName),
            leagueSection: section,
            ageGroup,
          })
        }
      }
      return [...byId.values()].sort(byDateAsc)
    },
    force,
    CLUB_GAMES_TTL_MS,
  )
}

// Spielpläne mehrerer Vereine (für den Spieltag-Tab) – nacheinander mit kleiner
// Pause, damit die API nicht drosselt. `throttled` markiert unvollständige Ergebnisse.
export async function fetchClubsSchedules(org, clubs) {
  const list = Array.isArray(clubs) ? clubs : []
  const result = []
  let throttled = false
  for (let i = 0; i < list.length; i += 1) {
    if (i > 0) await sleep(REQUEST_GAP_MS)
    const club = list[i]
    try {
      const games = await fetchClubSchedule(org, club)
      result.push({ clubId: String(club.clubId), clubName: trim(club.clubName), games })
    } catch (error) {
      if (isThrottled(error)) {
        throttled = true
        break
      }
      result.push({ clubId: String(club.clubId), clubName: trim(club.clubName), games: [] })
    }
  }
  return { clubs: result, throttled }
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
