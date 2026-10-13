import { useEffect, useState } from 'react'
import { ORG, REGION } from './config.js'
import { fetchBwhvLeagues, fetchLeague } from './api/h4a.js'
import { useAsync } from './hooks/useAsync.js'
import { useFavorites } from './hooks/useFavorites.js'
import Header from './components/Header.jsx'
import LeagueList from './components/LeagueList.jsx'
import LeagueDetail from './components/LeagueDetail.jsx'

function readLeagueFromUrl() {
  return new URLSearchParams(window.location.search).get('cl') || ''
}

function readTheme() {
  const t = document.documentElement.dataset.theme
  if (t === 'light' || t === 'dark') return t
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [selected, setSelected] = useState(readLeagueFromUrl)
  const [theme, setTheme] = useState(readTheme)
  const [tab, setTab] = useState('browse')
  const favorites = useFavorites()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (bar) bar.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
    try {
      window.localStorage.setItem('h4a:theme', theme)
    } catch {
      /* localStorage nicht verfügbar */
    }
  }, [theme])

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

  const currentLeague = selected
    ? {
        id: String(selected),
        name: data?.meta?.name || leagues.data?.find((l) => l.id === selected)?.name || '',
        level: leagues.data?.find((l) => l.id === selected)?.level || '',
      }
    : null

  // Nur im Dev-Server: ?crash=1 erzwingt einen Renderfehler zum Testen der Error Boundary.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('crash')) {
    throw new Error('Testfehler (Error Boundary)')
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header
        meta={
          showingDetail
            ? data?.meta
            : { name: 'Handball-Ergebnisse', subtitle: 'Baden-Württemberg · Bezirk Schwarzwald Rhein' }
        }
        onBack={showingDetail ? () => setSelected('') : undefined}
        onRefresh={showingDetail ? detail.reload : undefined}
        loading={detail.status === 'loading'}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        starred={showingDetail ? favorites.isLeagueFavorite(selected) : undefined}
        onToggleStar={showingDetail ? () => favorites.toggleLeague(currentLeague) : undefined}
        starLabel={currentLeague?.name || data?.meta?.name}
      />

      <main className="mx-auto max-w-3xl px-4 py-4">
        {showingDetail ? (
          <LeagueDetail
            data={data}
            status={detail.status}
            error={detail.error}
            onReload={detail.reload}
            favoriteTeams={favorites.favoriteTeams}
          />
        ) : (
          <LeagueList
            leagues={leagues.data ?? []}
            status={leagues.status}
            error={leagues.error}
            onSelect={setSelected}
            onRetry={leagues.reload}
            tab={tab}
            onTabChange={setTab}
            favorites={favorites.favorites}
            isLeagueFavorite={favorites.isLeagueFavorite}
            isClubFavorite={favorites.isClubFavorite}
            isTeamFavorite={favorites.isTeamFavorite}
            toggleLeague={favorites.toggleLeague}
            toggleClub={favorites.toggleClub}
            toggleTeam={favorites.toggleTeam}
          />
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-faint">
        Daten: handball4all.de · inoffizielle Ansicht
        <br />© 2026 rssoft2
      </footer>
    </div>
  )
}
