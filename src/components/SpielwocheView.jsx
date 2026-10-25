import { useState } from 'react'
import StateMessage from './StateMessage.jsx'
import MatchCard from './MatchCard.jsx'
import { groupByDay, dayLabel, gamesInRange, weekOf, weekLabel } from '../utils/spieltag.js'
import { isFavoriteTeam } from '../utils/teams.js'

function parseIso(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function ChevronLeft() {
  return (
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
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

function ChevronDown({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function clubGamesOf(club, games) {
  const clubName = String(club?.clubName ?? '').trim()
  if (!clubName) return []
  const seen = new Set()
  return games
    .filter(
      (game) =>
        isFavoriteTeam(game.home, [clubName]) || isFavoriteTeam(game.away, [clubName]),
    )
    .filter((game) => {
      if (!game.id || seen.has(game.id)) return false
      seen.add(game.id)
      return true
    })
    .sort((a, b) => (a.dateObj ?? 0) - (b.dateObj ?? 0))
}

// Spielwoche: alle Spiele der favorisierten Vereine innerhalb einer Kalenderwoche
// (Mo–So), je Verein auf-/zuklappbar und nach Tag gruppiert.
export default function SpielwocheView({
  clubs = [],
  status,
  data,
  error,
  onRetry,
  weekStart,
  weeks = [],
  onSelectWeek,
  onPrevWeek,
  onNextWeek,
  onOpenClub,
  onOpenReport,
  onOpenLive,
  onOpenLeague,
}) {
  const [collapsed, setCollapsed] = useState({})

  if (!Array.isArray(clubs) || clubs.length === 0) {
    return (
      <StateMessage emptyText="Noch keine Vereine als Favoriten. Tippe bei einem Verein auf den Stern." />
    )
  }

  const start = parseIso(weekStart || new Date().toISOString().slice(0, 10))
  const range = weekOf(start.getTime())
  const currentIso =
    weekStart ||
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

  const weekOptions = (() => {
    const isoWeeks = new Set(
      (Array.isArray(weeks) ? weeks : []).filter((iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso)),
    )
    isoWeeks.add(currentIso)
    return [...isoWeeks]
      .sort()
      .map((iso) => ({ iso, label: weekLabel(weekOf(parseIso(iso).getTime())) }))
  })()

  const header = (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => onPrevWeek?.()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface2 hover:text-ink"
        aria-label="Vorherige Woche"
      >
        <ChevronLeft />
      </button>
      <select
        value={currentIso}
        onChange={(event) => onSelectWeek?.(event.target.value)}
        aria-label="Woche auswählen"
        className="mx-auto w-auto max-w-[12rem] shrink cursor-pointer truncate rounded-lg border border-line bg-surface px-2 py-1 text-center text-sm font-medium tabular-nums text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accentsoft"
      >
        {weekOptions.map((option) => (
          <option key={option.iso} value={option.iso}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onNextWeek?.()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface2 hover:text-ink"
        aria-label="Nächste Woche"
      >
        <ChevronRight />
      </button>
    </div>
  )

  if (status === 'error') {
    return (
      <div className="space-y-3">
        {header}
        <StateMessage status="error" error={error} onRetry={onRetry} />
      </div>
    )
  }

  if (status === 'loading' || !data) {
    return (
      <div className="space-y-3">
        {header}
        <StateMessage status="loading" />
      </div>
    )
  }

  const games = gamesInRange(data?.games ?? [], range)
  const groups = clubs
    .map((club) => ({
      clubId: String(club.clubId),
      clubName: club.clubName,
      games: clubGamesOf(club, games),
    }))
    .filter((group) => group.games.length > 0)

  if (groups.length === 0) {
    return (
      <div className="space-y-3">
        {header}
        <StateMessage emptyText="In dieser Woche sind keine Spiele deiner Vereine angesetzt." />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {header}

      {groups.map((group) => {
        const isOpen = !collapsed[group.clubId]
        return (
          <section
            key={group.clubId}
            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
          >
            <div className="flex items-center gap-1 pr-1">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [group.clubId]: isOpen }))
                }
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left transition hover:bg-surface2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-head text-sm font-bold text-ink">
                    {group.clubName}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {group.games.length} {group.games.length === 1 ? 'Spiel' : 'Spiele'}
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={() => onOpenClub?.({ clubId: group.clubId, clubName: group.clubName })}
                aria-label={`${group.clubName} öffnen`}
                title="Vereinsansicht öffnen"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-surface2 hover:text-ink"
              >
                <ChevronRight />
              </button>
            </div>

            {isOpen ? (
              <div className="space-y-2.5 border-t border-line px-2 py-2.5 sm:px-3">
                {groupByDay(group.games).map((day) => (
                  <div key={day.date.getTime()} className="space-y-2.5">
                    <h3 className="px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-accent">
                      {dayLabel(day.date)}
                    </h3>
                    {day.games.map((game) => (
                      <MatchCard
                        key={game.id}
                        game={game}
                        onOpenReport={onOpenReport}
                        onOpenLive={onOpenLive}
                        onOpenLeague={onOpenLeague}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
