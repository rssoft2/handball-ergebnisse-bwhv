import { useEffect, useState } from 'react'
import { FAVORITE_TEAMS, ORG, REGION } from './config.js'
import { fetchBwhvLeagues, fetchLeague } from './api/h4a.js'
import { useAsync } from './hooks/useAsync.js'
import Header from './components/Header.jsx'
import LeagueList from './components/LeagueList.jsx'
import LeagueDetail from './components/LeagueDetail.jsx'

function readLeagueFromUrl() {
  return new URLSearchParams(window.location.search).get('cl') || ''
}

export default function App() {
  const [selected, setSelected] = useState(readLeagueFromUrl)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (selected) params.set('cl', selected)
    else params.delete('cl')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [selected])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [selected])

  const leagues = useAsync(() => fetchBwhvLeagues(ORG, REGION), [ORG, REGION])
  const detail = useAsync(
    (force) => fetchLeague(ORG, selected, force),
    [selected],
    Boolean(selected),
  )

  const showingDetail = Boolean(selected)
  const data = detail.data

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        meta={
          showingDetail
            ? data?.meta
            : { name: 'Handball-Ergebnisse', subtitle: 'Baden-Württemberg · Bezirksligen' }
        }
        onBack={showingDetail ? () => setSelected('') : undefined}
        onRefresh={showingDetail ? detail.reload : undefined}
        loading={detail.status === 'loading'}
      />

      <main className="mx-auto max-w-3xl px-4 py-4">
        {showingDetail ? (
          <LeagueDetail
            data={data}
            status={detail.status}
            error={detail.error}
            onReload={detail.reload}
            favoriteTeams={FAVORITE_TEAMS}
          />
        ) : (
          <LeagueList
            leagues={leagues.data ?? []}
            status={leagues.status}
            error={leagues.error}
            onSelect={setSelected}
            onRetry={leagues.reload}
          />
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        Daten: handball4all.de · inoffizielle Ansicht
      </footer>
    </div>
  )
}
