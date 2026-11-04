import { useMemo, useState } from 'react'
import { fetchClubTeams, isThrottled } from '../api/h4a.js'
import { ORG } from '../config.js'
import ClubLogo from './ClubLogo.jsx'
import FavoriteStar from './FavoriteStar.jsx'
import StateMessage from './StateMessage.jsx'

function Chevron({ open }) {
  return (
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
  )
}

function Group({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-sm">
        {children}
      </div>
    </section>
  )
}

function LeagueRow({ league, onSelect, onToggle }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-1 transition hover:bg-surface2">
      <button
        type="button"
        onClick={() => onSelect(league.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">
            {league.name || 'Liga'}
          </div>
          {league.level ? <div className="truncate text-xs text-muted">{league.level}</div> : null}
        </div>
      </button>
      <FavoriteStar active label={league.name || 'Liga'} onToggle={() => onToggle(league)} />
    </div>
  )
}

function TeamRow({ team, onSelect, onToggle }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-1 transition hover:bg-surface2">
      <button
        type="button"
        onClick={() => onSelect(team.leagueId)}
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left active:scale-[0.99]"
      >
        <ClubLogo name={team.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{team.name}</div>
          {team.leagueName ? (
            <div className="truncate text-xs text-muted">{team.leagueName}</div>
          ) : null}
        </div>
      </button>
      <FavoriteStar active label={team.name} onToggle={() => onToggle(team)} />
    </div>
  )
}

function ClubRow({ club, onSelect, onToggle, orderByLeague, sortMode = false, onMoveClub, index = 0, total = 0 }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ status: 'idle', teams: [] })

  function expand() {
    const next = !open
    setOpen(next)
    if (next && state.status === 'idle') {
      setState({ status: 'loading', teams: [] })
      fetchClubTeams(ORG, club)
        .then((teams) => setState({ status: 'ready', teams }))
        .catch((error) =>
          setState({ status: isThrottled(error) ? 'throttled' : 'error', teams: [] }),
        )
    }
  }

  // Mannschaften in der Reihenfolge der Auswahlliste (Liga-Sortierung), innerhalb
  // einer Liga nach Namen.
  const teams = useMemo(() => {
    const rank = (team) => {
      const index = orderByLeague.get(String(team.leagueId))
      return index === undefined ? Number.MAX_SAFE_INTEGER : index
    }
    return [...state.teams].sort((a, b) => {
      const diff = rank(a) - rank(b)
      if (diff !== 0) return diff
      return a.teamName.localeCompare(b.teamName, 'de')
    })
  }, [state.teams, orderByLeague])

  if (sortMode) {
    const canMoveUp = Boolean(onMoveClub) && index > 0
    const canMoveDown = Boolean(onMoveClub) && index < total - 1
    return (
      <div
        key={club.clubId}
        className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-surface2"
      >
        <ClubLogo name={club.clubName} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {club.clubName}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`${club.clubName} nach oben verschieben`}
            onClick={() => onMoveClub?.(club.clubId, -1)}
            disabled={!canMoveUp}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:bg-surface2 hover:text-ink active:scale-95 disabled:opacity-35 disabled:hover:bg-surface"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`${club.clubName} nach unten verschieben`}
            onClick={() => onMoveClub?.(club.clubId, 1)}
            disabled={!canMoveDown}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:bg-surface2 hover:text-ink active:scale-95 disabled:opacity-35 disabled:hover:bg-surface"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg transition hover:bg-surface2">
      <div className="flex items-center gap-1 px-1">
        <button
          type="button"
          onClick={expand}
          className="flex min-w-0 flex-1 items-center gap-2 px-1 py-2.5 text-left active:scale-[0.99]"
        >
          <Chevron open={open} />
          <ClubLogo name={club.clubName} />
          <span className="truncate text-sm font-medium text-ink">{club.clubName}</span>
        </button>
        <FavoriteStar active label={club.clubName} onToggle={() => onToggle(club)} />
      </div>

      {open ? (
        <div className="border-t border-line px-1 py-1">
          {state.status === 'loading' ? (
            <p className="px-3 py-2 text-xs text-muted">Mannschaften werden geladen …</p>
          ) : state.status === 'throttled' ? (
            <p className="px-3 py-2 text-xs text-muted">
              Handball4all drosselt gerade. Später erneut öffnen.
            </p>
          ) : state.status === 'error' ? (
            <p className="px-3 py-2 text-xs text-muted">Mannschaften konnten nicht geladen werden.</p>
          ) : state.teams.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">Keine Mannschaften gefunden.</p>
          ) : (
            teams.map((team) => (
              <button
                key={`${team.leagueId}:${team.teamName}`}
                type="button"
                onClick={() => onSelect(team.leagueId)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-surface2 active:scale-[0.99]"
              >
                <ClubLogo name={team.teamName} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{team.teamName}</div>
                  <div className="truncate text-xs text-muted">{team.leagueName}</div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function FavoritesView({ favorites, leagues = [], onSelect, onToggleLeague, onToggleClub, onToggleTeam, onMoveClub }) {
  const { leagues: favLeagues, clubs, teams } = favorites
  const empty = favLeagues.length === 0 && clubs.length === 0 && teams.length === 0

  const [sortMode, setSortMode] = useState(false)

  // Reihenfolge der Ligen wie in der Auswahlliste (Index der bereits sortierten Liste).
  const orderByLeague = useMemo(
    () => new Map(leagues.map((league, index) => [String(league.id), index])),
    [leagues],
  )

  if (empty) {
    return (
      <StateMessage emptyText="Noch keine Favoriten. Tippe auf den Stern bei Ligen, Vereinen oder Mannschaften." />
    )
  }

  return (
    <div className="space-y-4">
      {favLeagues.length > 0 ? (
        <Group title="Ligen">
          {favLeagues.map((league) => (
            <LeagueRow
              key={league.id}
              league={league}
              onSelect={onSelect}
              onToggle={onToggleLeague}
            />
          ))}
        </Group>
      ) : null}

      {clubs.length > 0 ? (
        <Group title="Vereine">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="min-w-0 truncate text-xs text-muted">
              Reihenfolge für die Spielwoche
            </span>
            <button
              type="button"
              onClick={() => setSortMode((value) => !value)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold text-muted transition hover:bg-surface2 hover:text-ink active:scale-95"
              aria-label={sortMode ? 'Sortier-Modus beenden' : 'Sortier-Modus starten'}
            >
              <span className="text-xs">{sortMode ? 'Fertig' : 'Sortieren'}</span>
            </button>
          </div>
          {clubs.map((club, index) => (
            <ClubRow
              key={club.clubId}
              club={club}
              index={index}
              total={clubs.length}
              sortMode={sortMode}
              onMoveClub={onMoveClub}
              onSelect={onSelect}
              onToggle={onToggleClub}
              orderByLeague={orderByLeague}
            />
          ))}
        </Group>
      ) : null}

      {teams.length > 0 ? (
        <Group title="Mannschaften">
          {teams.map((team) => (
            <TeamRow
              key={`${team.leagueId}:${team.name}`}
              team={team}
              onSelect={onSelect}
              onToggle={onToggleTeam}
            />
          ))}
        </Group>
      ) : null}
    </div>
  )
}
