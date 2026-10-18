import { LEAGUE_STATS_TTL_MS, LEAGUE_STATS_GAP_MS } from '../config.js'
import { fetchLeague } from './h4a.js'
import { getReport } from './reports.js'

// Liga-Statistik: alle beendeten Spiele einer Liga auswerten und daraus eine
// Torschützenliste aggregieren. Die Spielberichte sind unveränderlich und werden
// von `getReport` dauerhaft gecacht; das aggregierte Ergebnis wird zusätzlich
// signaturbasiert (Liste der Berichts-IDs) zwischengespeichert.
const CACHE_PREFIX = 'h4a:leaguestats:v2'

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

function readCache(org, league) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}:${org}:${league}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() - entry.t > LEAGUE_STATS_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(org, league, signature, value) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}:${org}:${league}`,
      JSON.stringify({ t: Date.now(), signature, v: value }),
    )
  } catch {
    /* localStorage nicht verfügbar / voll – ignorieren */
  }
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

// Aus den geparsten Berichten eine Torschützenliste bauen. Spieler werden über
// Team + Name identifiziert (Rückennummern wechseln zwischen Spielen); angezeigt
// wird die häufigste Nummer. Nur Spieler mit mindestens einem Tor.
export function aggregateScorers(reports) {
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
          if (agg[card.kind] != null) agg[card.kind] += 1
        }
      }
    }
  }

  return [...byPlayer.values()]
    .map((p) => {
      const nrs = Object.entries(p.nrs).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
      const { nrs: _drop, ...rest } = p
      return { ...rest, nr: nrs.length ? nrs[0][0] : '' }
    })
    .filter((p) => p.goals > 0)
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.goals - b.seven - (a.goals - a.seven) ||
        a.name.localeCompare(b.name, 'de'),
    )
}

/* ------------------------------------------------------------------ */
/* Laden                                                               */
/* ------------------------------------------------------------------ */

// Torschützenliste einer Liga. Lädt nacheinander alle noch nicht gecachten
// Berichte (der Textdienst drosselt) und meldet den Fortschritt über onProgress.
// Nur ein vollständiger Durchlauf (keine fehlgeschlagenen Berichte) wird gecacht.
export async function fetchLeagueScorers(org, league, { onProgress, force = false } = {}) {
  const detail = await fetchLeague(org, league)
  const playedDone = (detail.played || []).filter((g) => g.done)
  const ids = [...new Set(detail.played.filter((g) => g.done && g.reportId).map((g) => String(g.reportId)))]
  const signature = ids.join(',')

  if (!force) {
    const cached = readCache(org, league)
    if (cached && cached.signature === signature) return cached.v
  }

  const reports = []
  let failed = 0
  onProgress?.({ total: ids.length, loaded: 0, failed: 0 })

  for (let i = 0; i < ids.length; i += 1) {
    if (i > 0) await sleep(LEAGUE_STATS_GAP_MS)
    try {
      reports.push(await getReport(ids[i]))
    } catch {
      failed += 1
    }
    onProgress?.({ total: ids.length, loaded: i + 1, failed })
  }

  const result = {
    leagueId: String(league),
    totalGames: detail.played.filter((g) => g.done).length,
    withReport: ids.length,
    loadedReports: reports.length,
    failedReports: failed,
    complete: failed === 0,
    scorers: aggregateScorers(reports),
  }

  if (failed === 0) writeCache(org, league, ids.join(','), result)
  return result
}
