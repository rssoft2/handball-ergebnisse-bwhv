import { useEffect, useMemo, useState } from 'react'
import { searchTeams } from '../api/h4a.js'
import { ORG } from '../config.js'
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

function LeagueRow({ league, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(league.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface2 active:scale-[0.99]"
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
  )
}

function TeamRow({ team, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(team.leagueId)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface2 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{team.teamName}</div>
        <div className="truncate text-xs text-muted">{team.leagueName}</div>
      </div>
      <ChevronRight />
    </button>
  )
}

export default function LeagueList({ leagues, status, error, onSelect, onRetry }) {
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
  const [teamState, setTeamState] = useState({ status: 'idle', teams: [] })

  useEffect(() => {
    if (q.length < 2) {
      setTeamState({ status: 'idle', teams: [] })
      return
    }
    let active = true
    setTeamState({ status: 'loading', teams: [] })
    const timer = setTimeout(() => {
      searchTeams(ORG, q)
        .then(({ teams }) => {
          if (active) setTeamState({ status: 'ready', teams: teams.slice(0, 80) })
        })
        .catch(() => {
          if (active) setTeamState({ status: 'error', teams: [] })
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
          placeholder="Liga oder Mannschaft suchen (z. B. Ettlingen, Bezirksliga)"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accentsoft"
        />
      </div>

      {status === 'loading' && leagues.length === 0 ? (
        <StateMessage status="loading" />
      ) : status === 'error' ? (
        <StateMessage status="error" error={error} onRetry={onRetry} />
      ) : leagueResults ? (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              Ligen
            </h2>
            {leagueResults.length === 0 ? (
              <p className="px-1 text-sm text-muted">Keine passende Liga.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-sm">
                {leagueResults.map((league) => (
                  <LeagueRow key={league.id} league={league} onSelect={onSelect} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              Mannschaften
            </h2>
            {teamState.status === 'error' ? (
              <p className="px-1 text-sm text-muted">
                Mannschaften konnten nicht geladen werden.
              </p>
            ) : teamState.teams.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-sm">
                {teamState.teams.map((team) => (
                  <TeamRow
                    key={`${team.leagueId}:${team.teamName}`}
                    team={team}
                    onSelect={onSelect}
                  />
                ))}
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
                      <LeagueRow key={league.id} league={league} onSelect={onSelect} />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
