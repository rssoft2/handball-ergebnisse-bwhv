import { useEffect, useMemo, useState } from 'react'
import { ORG, REGION } from './config.js'
import { fetchBwhvLeagues, fetchLeague } from './api/h4a.js'
import { useAsync } from './hooks/useAsync.js'
import { useFavorites } from './hooks/useFavorites.js'
import { useReports } from './hooks/useReports.js'
import { useLiveGames } from './hooks/useLiveGames.js'
import { useClubSchedule } from './hooks/useClubSchedule.js'
import { useSpieltag } from './hooks/useSpieltag.js'
import { useLeagueScorers } from './hooks/useLeagueScorers.js'
import { startOfDaysAgo } from './utils/format.js'
import Header from './components/Header.jsx'
import LeagueList from './components/LeagueList.jsx'
import LeagueDetail from './components/LeagueDetail.jsx'
import ClubScreen from './components/ClubScreen.jsx'
import ReportStatsScreen from './components/ReportStatsScreen.jsx'
import ReportTimelineScreen from './components/ReportTimelineScreen.jsx'
import LiveScreen from './components/LiveScreen.jsx'
import LeagueScorersScreen from './components/LeagueScorersScreen.jsx'

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
  const [reportNav, setReportNav] = useState(null)
  const [liveNav, setLiveNav] = useState(null)
  const [clubNav, setClubNav] = useState(null)
  const [statsNav, setStatsNav] = useState(false)
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
  }, [selected, reportNav, liveNav, clubNav, statsNav])

  useEffect(() => {
    setReportNav(null)
    setLiveNav(null)
    setClubNav(null)
    setStatsNav(false)
  }, [selected])

  const leagues = useAsync(() => fetchBwhvLeagues(ORG, REGION), [ORG, REGION])
  const detail = useAsync(
    (force) => fetchLeague(ORG, selected, force),
    [selected],
    Boolean(selected),
  )
  // Nur laden/aktualisieren, solange der Live-Tab der Startseite sichtbar ist.
  const liveGames = useLiveGames(ORG, REGION, tab === 'live' && !selected && !liveNav)

  // Spieltagsübersicht: einzelner Verein (ClubScreen) bzw. alle Favoriten-Vereine
  // (Spieltag-Tab). Nur laden, wenn die jeweilige Ansicht sichtbar ist.
  const clubSchedule = useClubSchedule(ORG, clubNav, Boolean(clubNav))
  const spieltag = useSpieltag(
    ORG,
    favorites.favorites.clubs,
    tab === 'spieltag' && !selected && !clubNav && !reportNav && !liveNav,
  )

  // Liga-Statistik (Torschützenliste): alle Berichte der gewählten Liga laden.
  const scorers = useLeagueScorers(ORG, selected, Boolean(selected) && statsNav)

  // Die zuletzt gespielten Partien (wie im Liga-Detail sichtbar) im Hintergrund
  // als Berichte vorladen.
  const reportGames = useMemo(() => {
    if (!detail.data) return []
    const since = startOfDaysAgo(7).getTime()
    return [...detail.data.live, ...detail.data.played]
      .filter((g) => g.done && g.reportId && g.dateObj != null && g.dateObj >= since)
      .sort((a, b) => (b.dateObj ?? 0) - (a.dateObj ?? 0))
  }, [detail.data])

  const reports = useReports(reportGames, Boolean(selected))

  // Bericht beim Öffnen sicherstellen (deckt auch Spiele außerhalb der 7 Tage ab).
  useEffect(() => {
    if (reportNav?.game?.reportId) reports.ensure(reportNav.game.reportId)
  }, [reportNav, reports.ensure])

  const showingDetail = Boolean(selected)
  const inReport = Boolean(reportNav)
  const inLive = Boolean(liveNav)
  const inClub = Boolean(clubNav)
  const inScorers = Boolean(selected) && statsNav
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
          inLive
            ? {
                name: `${liveNav.home} – ${liveNav.away}`,
                subtitle: 'Live-Ticker',
              }
            : inReport
              ? {
                  name: `${reportNav.game.home} – ${reportNav.game.away}`,
                  subtitle: reportNav.kind === 'stats' ? 'Spielerstatistik' : 'Spielverlauf',
                }
              : inClub
                ? {
                    name: clubNav.clubName,
                    subtitle: 'Spieltag',
                  }
                : inScorers
                  ? {
                      name: data?.meta?.name || 'Torschützenliste',
                      subtitle: 'Torschützen',
                    }
                  : showingDetail
                    ? data?.meta
                    : {
                        name: 'Handball-Ergebnisse',
                        subtitle: 'Baden-Württemberg · Bezirk Schwarzwald Rhein',
                      }
        }
        onBack={
          inLive
            ? () => setLiveNav(null)
            : inReport
              ? () => setReportNav(null)
              : inClub
                ? () => setClubNav(null)
                : inScorers
                  ? () => setStatsNav(false)
                  : showingDetail
                    ? () => setSelected('')
                    : undefined
        }
        onRefresh={
          inLive || inReport
            ? undefined
            : inClub
              ? clubSchedule.reload
              : inScorers
                ? scorers.reload
                : showingDetail
                  ? detail.reload
                  : undefined
        }
        loading={
          detail.status === 'loading' ||
          (inClub && clubSchedule.status === 'loading') ||
          (inScorers && scorers.status === 'loading')
        }
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        starred={
          inClub
            ? favorites.isClubFavorite(clubNav.clubName)
            : !inReport && !inLive && showingDetail
              ? favorites.isLeagueFavorite(selected)
              : undefined
        }
        onToggleStar={
          inClub
            ? () => favorites.toggleClub(clubNav)
            : !inReport && !inLive && showingDetail
              ? () => favorites.toggleLeague(currentLeague)
              : undefined
        }
        starLabel={inClub ? clubNav.clubName : currentLeague?.name || data?.meta?.name}
      />

      <main className="mx-auto max-w-3xl px-4 py-4">
        {inLive ? (
          <LiveScreen game={liveNav} favoriteTeams={favorites.favoriteTeams} />
        ) : inReport ? (
          reportNav.kind === 'stats' ? (
            <ReportStatsScreen
              report={reports.get(reportNav.game.reportId)}
              game={reportNav.game}
              favoriteTeams={favorites.favoriteTeams}
            />
          ) : (
            <ReportTimelineScreen
              report={reports.get(reportNav.game.reportId)}
              game={reportNav.game}
              favoriteTeams={favorites.favoriteTeams}
            />
          )
        ) : inClub ? (
          <ClubScreen
            schedule={clubSchedule}
            onOpenReport={(game, kind) => setReportNav({ game, kind })}
            onOpenLive={(game) => setLiveNav(game)}
          />
        ) : inScorers ? (
          <LeagueScorersScreen
            status={scorers.status}
            data={scorers.data}
            progress={scorers.progress}
            error={scorers.error}
            onReload={scorers.reload}
            favoriteTeams={favorites.favoriteTeams}
          />
        ) : showingDetail ? (
          <LeagueDetail
            data={data}
            status={detail.status}
            error={detail.error}
            onReload={detail.reload}
            favoriteTeams={favorites.favoriteTeams}
            onOpenReport={(game, kind) => setReportNav({ game, kind })}
            onOpenLive={(game) => setLiveNav(game)}
            onOpenScorers={() => setStatsNav(true)}
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
            favoriteTeams={favorites.favoriteTeams}
            liveGames={liveGames.data}
            liveStatus={liveGames.status}
            liveError={liveGames.error}
            onRetryLive={liveGames.reload}
            onOpenLive={(game) => setLiveNav(game)}
            spieltagClubs={favorites.favorites.clubs}
            spieltagStatus={spieltag.status}
            spieltagData={spieltag.data}
            spieltagError={spieltag.error}
            onRetrySpieltag={spieltag.reload}
            onOpenClub={(club) => setClubNav(club)}
            onOpenReport={(game, kind) => setReportNav({ game, kind })}
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
        <br />© 2026 rssoft2 · v1.9
      </footer>
    </div>
  )
}
