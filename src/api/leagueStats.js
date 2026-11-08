import { LEAGUE_STATS_TTL_MS, LEAGUE_STATS_GAP_MS } from '../config.js'
import { normalizeTeamName } from '../utils/teams.js'
import { scheduleForTeam, teamMatches } from '../utils/teamSchedule.js'
import { fetchLeague } from './h4a.js'
import { getCachedReport, getReport } from './reports.js'

// Liga-/Team-Statistik: beendete Spiele auswerten und daraus Torschützen sowie
// Strafen aggregieren. Die Spielberichte sind unveränderlich und werden
// von `getReport` dauerhaft gecacht; das aggregierte Ergebnis wird zusätzlich
// signaturbasiert (Liste der Berichts-IDs) zwischengespeichert.
const CACHE_PREFIX = 'h4a:leaguestats:v4'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function normKey(name) {
  return String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

// Die Berichtsspalte „7m/ Tore" zeigt "Versuche/verwandelte" (z. B. "6/5" bei
// 5 verwandelten 7m und 1 Fehlwurf). Verwandelt ist also die zweite Zahl.
function parseSeven(seven) {
  const m = String(seven || '').match(/^(\d+)\s*\/\s*(\d+)$/)
  return m ? Number(m[2]) : 0
}

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

function cacheKey(org, league, teamName) {
  const base = `${CACHE_PREFIX}:${org}:${league}`
  const team = String(teamName ?? '').trim()
  return team ? `${base}:team:${normalizeTeamName(team)}` : base
}

function readCache(org, league, teamName) {
  try {
    const raw = localStorage.getItem(cacheKey(org, league, teamName))
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() - entry.t > LEAGUE_STATS_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(org, league, teamName, signature, value) {
  try {
    localStorage.setItem(
      cacheKey(org, league, teamName),
      JSON.stringify({ t: Date.now(), signature, v: value }),
    )
  } catch {
    /* localStorage nicht verfügbar / voll – ignorieren */
  }
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

// Spieler werden über Team + Name identifiziert (Rückennummern wechseln
// zwischen Spielen); angezeigt wird die häufigste Nummer.
function aggregatePlayers(reports) {
  const byPlayer = new Map()

  for (const report of reports) {
    if (!report || !Array.isArray(report.teams)) continue
    for (const team of report.teams) {
      const teamKey = normKey(team.label)
      for (const p of team.players || []) {
        const key = `${teamKey}|${normKey(p.name)}`
        let agg = byPlayer.get(key)
        if (!agg) {
          agg = {
            name: p.name,
            team: team.label,
            goals: 0,
            seven: 0,
            games: 0,
            yellow: 0,
            two: 0,
            red: 0,
            blue: 0,
            total: 0,
            nrs: {},
          }
          byPlayer.set(key, agg)
        }
        agg.goals += p.goals || 0
        agg.seven += parseSeven(p.seven)
        agg.games += 1
        const nr = String(p.nr || '').trim()
        if (nr) agg.nrs[nr] = (agg.nrs[nr] || 0) + 1
        for (const card of p.cards || []) {
          if (
            card.kind === 'yellow' ||
            card.kind === 'two' ||
            card.kind === 'red' ||
            card.kind === 'blue'
          ) {
            const weight = card.kind === 'red' && !card.indirect ? 2 : 1
            agg[card.kind] += weight
            agg.total += weight
          }
        }
      }
    }
  }

  return [...byPlayer.values()].map((p) => {
    const nrs = Object.entries(p.nrs).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    const { nrs: _drop, ...rest } = p
    return { ...rest, nr: nrs.length ? nrs[0][0] : '' }
  })
}

const byGoals = (a, b) =>
  b.goals - a.goals ||
  b.goals - b.seven - (a.goals - a.seven) ||
  a.name.localeCompare(b.name, 'de') ||
  a.team.localeCompare(b.team, 'de')

const byPenalties = (a, b) =>
  b.total - a.total ||
  b.red - a.red ||
  b.two - a.two ||
  b.yellow - a.yellow ||
  b.blue - a.blue ||
  a.name.localeCompare(b.name, 'de') ||
  a.team.localeCompare(b.team, 'de')

// Nur Spieler mit mindestens einem Tor.
export function aggregateScorers(reports) {
  return aggregatePlayers(reports)
    .filter((p) => p.goals > 0)
    .sort(byGoals)
}

// Nur Spieler mit mindestens einer Karte (Gelb, 2 Min, Rot oder Blau).
export function aggregatePenalties(reports) {
  return aggregatePlayers(reports)
    .filter((p) => p.total > 0)
    .sort(byPenalties)
}

export function filterPlayersByTeam(players, teamName, nameMap) {
  const team = String(teamName ?? '').trim()
  if (!team) return players
  return (players || []).filter((player) => teamMatches(player.team, team, nameMap))
}

/* ------------------------------------------------------------------ */
/* Laden                                                               */
/* ------------------------------------------------------------------ */

// Torschützen und Strafen einer Liga oder eines Teams. Lädt nacheinander alle
// noch nicht gecachten Berichte (der Textdienst drosselt) und meldet den
// Fortschritt über onProgress. Nur ein vollständiger Durchlauf wird gecacht.
export async function fetchLeagueStats(
  org,
  league,
  { onProgress, force = false, teamName = '' } = {},
) {
  const detail = await fetchLeague(org, league)
  const team = String(teamName ?? '').trim()
  const played = team ? scheduleForTeam(detail, team).played : detail.played
  const playedDone = (played || []).filter((g) => g.done)
  const ids = [...new Set(playedDone.filter((g) => g.reportId).map((g) => String(g.reportId)))]
  const signature = ids.join(',')

  if (!force) {
    const cached = readCache(org, league, team)
    if (cached && cached.signature === signature) return cached.v
  }

  const reports = []
  let failed = 0
  onProgress?.({ total: ids.length, loaded: 0, failed: 0 })

  for (let i = 0; i < ids.length; i += 1) {
    const cached = await getCachedReport(ids[i])
    if (cached) {
      reports.push(cached)
    } else {
      if (i > 0) await sleep(LEAGUE_STATS_GAP_MS)
      try {
        reports.push(await getReport(ids[i]))
      } catch {
        failed += 1
      }
    }
    onProgress?.({ total: ids.length, loaded: i + 1, failed })
  }

  const players = aggregatePlayers(reports)
  const scorers = filterPlayersByTeam(
    players.filter((p) => p.goals > 0).sort(byGoals),
    team,
    detail.teamNameMap,
  )
  const penalties = filterPlayersByTeam(
    players.filter((p) => p.total > 0).sort(byPenalties),
    team,
    detail.teamNameMap,
  )
  const result = {
    leagueId: String(league),
    totalGames: playedDone.length,
    withReport: ids.length,
    loadedReports: reports.length,
    failedReports: failed,
    complete: failed === 0,
    scorers,
    penalties,
  }

  if (failed === 0) writeCache(org, league, team, signature, result)
  return result
}
