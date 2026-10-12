import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LEAGUE,
  DEFAULT_ORG,
  DEFAULT_REGION,
  FAVORITE_TEAMS,
} from './config.js'
import { fetchLeague, fetchLeagues, fetchRegions } from './api/h4a.js'
import { useAsync } from './hooks/useAsync.js'
import Header from './components/Header.jsx'
import LeagueSelector from './components/LeagueSelector.jsx'
import TabSwitcher from './components/TabSwitcher.jsx'
import StandingsTable from './components/StandingsTable.jsx'
import MatchList from './components/MatchList.jsx'
import StateMessage from './components/StateMessage.jsx'

const STORAGE_KEY = 'h4a:selection:v1'

function readInitialSelection() {
  const params = new URLSearchParams(window.location.search)
  let stored = {}
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    stored = {}
  }
  return {
    org: params.get('og') || stored.org || DEFAULT_ORG,
    region: params.get('o') ?? stored.region ?? DEFAULT_REGION,
    league: params.get('cl') || stored.league || DEFAULT_LEAGUE,
    tab: params.get('tab') || stored.tab || 'table',
  }
}

export default function App() {
  const initial = useMemo(readInitialSelection, [])
  const [org] = useState(initial.org)
  const [region, setRegion] = useState(initial.region)
  const [league, setLeague] = useState(initial.league)
  const [tab, setTab] = useState(initial.tab)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('og', org)
    if (region) params.set('o', region)
    params.set('cl', league)
    if (tab !== 'table') params.set('tab', tab)
    window.history.replaceState(null, '', `?${params.toString()}`)
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ org, region, league, tab }),
      )
    } catch {
      /* localStorage nicht verfügbar */
    }
  }, [org, region, league, tab])

  const regions = useAsync(() => fetchRegions(org), [org])
  const leagues = useAsync(() => fetchLeagues(org, region), [org, region])
  const leagueData = useAsync(
    (force) => fetchLeague(org, league, force),
    [org, league],
    Boolean(league),
  )

  const data = leagueData.data
  const counts = data
    ? {
        table: data.standings.length,
        results: data.played.length,
        fixtures: data.upcoming.length,
      }
    : {}

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        meta={data?.meta}
        onRefresh={leagueData.reload}
        loading={leagueData.status === 'loading'}
      />

      <LeagueSelector
        org={org}
        region={region}
        regions={regions.data ?? []}
        league={league}
        leagueLabel={data?.meta?.name}
        leagues={leagues.data ?? []}
        onRegionChange={setRegion}
        onLeagueChange={setLeague}
      />

      <TabSwitcher tab={tab} onChange={setTab} counts={counts} />

      <main className="mx-auto max-w-3xl px-4 py-4">
        {leagueData.status === 'loading' && !data ? (
          <StateMessage status="loading" />
        ) : leagueData.status === 'error' ? (
          <StateMessage
            status="error"
            error={leagueData.error}
            onRetry={leagueData.reload}
          />
        ) : data ? (
          <>
            {tab === 'table' ? (
              <StandingsTable rows={data.standings} favoriteTeams={FAVORITE_TEAMS} />
            ) : null}
            {tab === 'results' ? (
              <MatchList
                games={data.played}
                favoriteTeams={FAVORITE_TEAMS}
                emptyText="Noch keine gespielten Partien."
              />
            ) : null}
            {tab === 'fixtures' ? (
              <MatchList
                games={data.upcoming}
                favoriteTeams={FAVORITE_TEAMS}
                emptyText="Keine kommenden Spiele angesetzt."
              />
            ) : null}
            {data.meta.updated ? (
              <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
                {data.meta.updated}
              </p>
            ) : null}
          </>
        ) : null}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        Daten: handball4all.de · inoffizielle Ansicht
      </footer>
    </div>
  )
}
