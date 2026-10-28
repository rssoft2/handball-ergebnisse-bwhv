import { useEffect, useMemo, useState } from 'react'
import { searchTeams } from '../api/h4a.js'
import { ORG } from '../config.js'
import FavoriteStar from './FavoriteStar.jsx'
import FavoritesView from './FavoritesView.jsx'
import LiveGamesView from './LiveGamesView.jsx'
import SpielwocheView from './SpielwocheView.jsx'
import StateMessage from './StateMessage.jsx'

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function LeagueRow({ league, onSelect, starred, onToggleStar }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-1 transition hover:bg-surface2">
      <button
        type="button"
        onClick={() => onSelect(league.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">
            {league.name || league.sname}
          </div>
          {league.level ? (
            <div className="truncate text-xs text-muted">{league.level}</div>
          ) : null}
        </div>
        <ChevronRight />
      </button>
      <FavoriteStar
        active={starred}
        label={league.name || league.sname || 'Liga'}
        onToggle={() => onToggleStar(league)}
      />
    </div>
  )
}

function ClubRow({ club, onSelect, starred, onToggleStar }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-1 transition hover:bg-surface2">
      <button
        type="button"
        onClick={() => onSelect?.(club)}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {club.clubName}
        </div>
        <ChevronRight />
      </button>
      <FavoriteStar active={starred} label={club.clubName} onToggle={() => onToggleStar(club)} />
    </div>
  )
}

function TeamRow({ team, onSelect, starred, onToggleStar }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-1 transition hover:bg-surface2">
      <button
        type="button"
        onClick={() => onSelect(team.leagueId)}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{team.teamName}</div>
          <div className="truncate text-xs text-muted">{team.leagueName}</div>
        </div>
        <ChevronRight />
      </button>
      <FavoriteStar
        active={starred}
        label={team.teamName}
        onToggle={() => onToggleStar(team)}
      />
    </div>
  )
}

function GroupHeading({ children }) {
  return (
    <h2 className="mb-2 px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-muted">
      {children}
    </h2>
  )
}

function Card({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-sm">
      {children}
    </div>
  )
}

function Tabs({ tab, onChange, liveCount }) {
  const items = [
    { id: 'browse', label: 'Auswahl' },
    { id: 'live', label: 'Live', count: liveCount },
    { id: 'spielwoche', label: 'Spielwoche' },
    { id: 'favorites', label: 'Favoriten' },
  ]
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-surface p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[13px] font-semibold transition ${
            tab === item.id
              ? 'bg-accentsoft text-accent'
              : 'text-muted hover:bg-surface2 hover:text-ink'
          }`}
        >
          {item.id === 'live' ? (
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                item.count ? 'bg-live' : 'bg-faint'
              }`}
            />
          ) : null}
          {item.label}
          {item.id === 'live' && item.count ? (
            <span className="rounded-full bg-live px-1.5 text-[10px] font-bold tabular-nums text-liveink">
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export default function LeagueList({
  leagues,
  status,
  error,
  onSelect,
  onRetry,
  tab,
  onTabChange,
  favorites,
  favoriteTeams,
  liveGames,
  liveStatus,
  liveError,
  onRetryLive,
  onOpenLive,
  weekStatus,
  weekData,
  weekError,
  onRetryWeek,
  weekStart,
  weeks,
  onSelectWeek,
  onPrevWeek,
  onNextWeek,
  onOpenClub,
  onOpenReport,
  onOpenLeague,
  isLeagueFavorite,
  isClubFavorite,
  isTeamFavorite,
  toggleLeague,
  toggleClub,
  toggleTeam,
}) {
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState(() => new Set())

  const groups = useMemo(() => {
    const map = new Map()
    for (const league of leagues) {
      if (!map.has(league.section)) map.set(league.section, [])
      map.get(league.section).push(league)
    }
    return [...map.entries()]
  }, [leagues])

  const q = query.trim().toLowerCase()
  const leagueResults = useMemo(() => {
    if (!q) return null
    return leagues.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.sname.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q) ||
        l.ageGroup.toLowerCase().includes(q) ||
        l.section.toLowerCase().includes(q),
    )
  }, [leagues, q])

  // Mannschaften über Vereine suchen: Suchbegriff → Vereine (`cs`) → deren
  // Mannschaften samt Liga (`pcu`). Kurz entprellt, Ergebnisse nach dem Laden.
  const [teamState, setTeamState] = useState({
    status: 'idle',
    clubs: [],
    teams: [],
    throttled: false,
  })

  useEffect(() => {
    if (q.length < 2) {
      setTeamState({ status: 'idle', clubs: [], teams: [], throttled: false })
      return
    }
    let active = true
    setTeamState({ status: 'loading', clubs: [], teams: [], throttled: false })
    const timer = setTimeout(() => {
      searchTeams(ORG, q)
        .then(({ clubs, teams, throttled }) => {
          if (active) {
            setTeamState({ status: 'ready', clubs: clubs.slice(0, 12), teams: teams.slice(0, 80), throttled })
          }
        })
        .catch(() => {
          if (active) setTeamState({ status: 'error', clubs: [], teams: [], throttled: false })
        })
    }, 350)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [q])

  function toggle(group) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <Tabs tab={tab} onChange={onTabChange} liveCount={liveGames?.length ?? 0} />

      {tab === 'favorites' ? (
        <FavoritesView
          favorites={favorites}
          leagues={leagues}
          onSelect={onSelect}
          onToggleLeague={toggleLeague}
          onToggleClub={toggleClub}
          onToggleTeam={toggleTeam}
          onOpenClub={onOpenClub}
        />
      ) : tab === 'live' ? (
        <LiveGamesView
          games={liveGames}
          status={liveStatus}
          error={liveError}
          onRetry={onRetryLive}
          favoriteTeams={favoriteTeams}
          onOpenLive={onOpenLive}
          onOpenLeague={onOpenLeague}
        />
      ) : tab === 'spielwoche' ? (
        <SpielwocheView
          clubs={favorites.clubs}
          teams={favorites.teams}
          status={weekStatus}
          data={weekData}
          error={weekError}
          onRetry={onRetryWeek}
          weekStart={weekStart}
          weeks={weeks}
          onSelectWeek={onSelectWeek}
          onPrevWeek={onPrevWeek}
          onNextWeek={onNextWeek}
          onOpenClub={onOpenClub}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
          onOpenLeague={onOpenLeague}
        />
      ) : (
        <>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Liga, Verein oder Mannschaft suchen (z. B. Ettlingen, Bezirksliga)"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-10 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accentsoft"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Suche löschen"
                title="Löschen"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-faint transition hover:bg-surface2 hover:text-ink active:scale-90"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>

          {status === 'loading' && leagues.length === 0 ? (
            <StateMessage status="loading" />
          ) : status === 'error' ? (
            <StateMessage status="error" error={error} onRetry={onRetry} />
          ) : leagueResults ? (
            <div className="space-y-4">
              <div>
                <GroupHeading>Ligen</GroupHeading>
                {leagueResults.length === 0 ? (
                  <p className="px-1 text-sm text-muted">Keine passende Liga.</p>
                ) : (
                  <Card>
                    {leagueResults.map((league) => (
                      <LeagueRow
                        key={league.id}
                        league={league}
                        onSelect={onSelect}
                        starred={isLeagueFavorite(league.id)}
                        onToggleStar={toggleLeague}
                      />
                    ))}
                  </Card>
                )}
              </div>

              <div>
                <GroupHeading>Vereine</GroupHeading>
                {teamState.status === 'error' ||
                (teamState.throttled && teamState.clubs.length === 0) ? (
                  <p className="px-1 text-sm text-muted">
                    Handball4all drosselt gerade die Anfragen. Bitte einen Moment warten und
                    erneut suchen.
                  </p>
                ) : teamState.clubs.length > 0 ? (
                  <Card>
                    {teamState.clubs.map((club) => (
                      <ClubRow
                        key={club.clubId}
                        club={club}
                        onSelect={onOpenClub}
                        starred={isClubFavorite(club.clubName)}
                        onToggleStar={toggleClub}
                      />
                    ))}
                  </Card>
                ) : teamState.status === 'loading' ? (
                  <StateMessage status="loading" />
                ) : (
                  <p className="px-1 text-sm text-muted">Kein passender Verein.</p>
                )}
              </div>

              <div>
                <GroupHeading>Mannschaften</GroupHeading>
                {teamState.status === 'error' ||
                (teamState.throttled && teamState.teams.length === 0) ? (
                  <p className="px-1 text-sm text-muted">
                    Handball4all drosselt gerade die Anfragen. Bitte einen Moment warten und
                    erneut suchen.
                  </p>
                ) : teamState.teams.length > 0 ? (
                  <div className="space-y-2">
                    <Card>
                      {teamState.teams.map((team) => (
                        <TeamRow
                          key={`${team.leagueId}:${team.teamName}`}
                          team={team}
                          onSelect={onSelect}
                          starred={isTeamFavorite(team.teamName, team.leagueId)}
                          onToggleStar={toggleTeam}
                        />
                      ))}
                    </Card>
                    {teamState.throttled ? (
                      <p className="px-1 text-xs text-faint">
                        Es konnten evtl. nicht alle Mannschaften geladen werden.
                      </p>
                    ) : null}
                  </div>
                ) : teamState.status === 'loading' ? (
                  <StateMessage status="loading" />
                ) : (
                  <p className="px-1 text-sm text-muted">Keine passende Mannschaft.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(([group, items]) => {
                const open = openGroups.has(group)
                return (
                  <div
                    key={group}
                    className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(group)}
                      className="flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-surface2"
                    >
                      <svg
                        className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? 'rotate-90' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                      <span className="flex-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-accent">
                        {group}
                      </span>
                      <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
                        {items.length}
                      </span>
                    </button>

                    {open ? (
                      <div className="border-t border-line p-1">
                        {items.map((league) => (
                          <LeagueRow
                            key={league.id}
                            league={league}
                            onSelect={onSelect}
                            starred={isLeagueFavorite(league.id)}
                            onToggleStar={toggleLeague}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
