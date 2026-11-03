import { useMemo } from 'react'
import StateMessage from './StateMessage.jsx'
import MatchCard from './MatchCard.jsx'
import { useGymSchedule } from '../hooks/useGymSchedule.js'
import { ORG } from '../config.js'
import { groupByDay, dayLabel, parseIsoDate, weekOf, weekLabel } from '../utils/spieltag.js'

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

function ChevronRight() {
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function WeekHeader({ weekStart, weeks = [], onSelectWeek, onPrevWeek, onNextWeek }) {
  const currentIso = weekStart
  const weekOptions = (() => {
    const isoWeeks = new Set(
      (Array.isArray(weeks) ? weeks : []).filter((iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso)),
    )
    if (currentIso) isoWeeks.add(currentIso)
    return [...isoWeeks]
      .sort()
      .map((iso) => ({ iso, label: weekLabel(weekOf(parseIsoDate(iso).getTime())) }))
  })()

  return (
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
        className="mx-auto w-auto max-w-48 shrink cursor-pointer truncate rounded-lg border border-line bg-surface px-2 py-1 text-center text-sm font-medium tabular-nums text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accentsoft"
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
}

// Hallen-Spielplan: alle Spiele einer Halle innerhalb einer Kalenderwoche,
// gruppiert nach Tag. Inhalt der Ansicht, wenn eine Halle gewählt wurde.
export default function GymScheduleScreen({
  gymId,
  gymName,
  initialWeekStart,
  leagues = [],
  favoriteTeams,
  onOpenReport,
  onOpenLive,
  onOpenLeague,
  onOpenGym,
}) {
  const schedule = useGymSchedule(ORG, gymId, initialWeekStart)
  const { status, data, error, weekStart, weeks } = schedule

  // `pgy` liefert nur Liga-Kurznamen. Der Langname kommt aus der bereits
  // geladenen Liga-Liste (kein zusätzlicher API-Aufruf).
  const leagueNames = useMemo(
    () =>
      new Map(
        (Array.isArray(leagues) ? leagues : [])
          .filter((league) => league?.id && league?.name)
          .map((league) => [String(league.id), league.name]),
      ),
    [leagues],
  )

  const games = useMemo(() => {
    const list = data?.games ?? []
    if (!leagueNames.size) return list
    return list.map((game) => {
      const name = leagueNames.get(String(game.leagueId))
      return name && name !== game.leagueName ? { ...game, leagueName: name } : game
    })
  }, [data, leagueNames])

  const header = (
    <WeekHeader
      weekStart={weekStart}
      weeks={weeks}
      onSelectWeek={schedule.setWeek}
      onPrevWeek={schedule.prevWeek}
      onNextWeek={schedule.nextWeek}
    />
  )

  const openReport = (game, kind) => onOpenReport?.(game, kind, weekStart)
  const openLive = (game) => onOpenLive?.(game, weekStart)

  if (status === 'error') {
    return (
      <div className="space-y-3">
        {header}
        <StateMessage status="error" error={error} onRetry={schedule.reload} />
      </div>
    )
  }

  if (!data && (status === 'loading' || status === 'idle')) {
    return (
      <div className="space-y-3">
        {header}
        <StateMessage status="loading" />
      </div>
    )
  }

  const name = data?.gym?.name || gymName || 'Halle'
  const first = games[0]
  const address = first
    ? [first.street, [first.postal, first.town].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
    : ''

  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="font-head text-base font-bold text-ink">{name}</h2>
        {address ? <p className="text-xs text-muted">{address}</p> : null}
      </div>

      {header}

      {games.length === 0 ? (
        <StateMessage emptyText="In dieser Woche sind in dieser Halle keine Spiele angesetzt." />
      ) : (
        groupByDay(games).map((day) => (
          <section key={day.date.getTime()} className="space-y-2.5">
            <h3 className="px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-accent">
              {dayLabel(day.date)}
            </h3>
            {day.games.map((game) => (
              <MatchCard
                key={game.id}
                game={game}
                favoriteTeams={favoriteTeams}
                onOpenReport={openReport}
                onOpenLive={openLive}
                onOpenLeague={onOpenLeague}
                onOpenGym={onOpenGym}
              />
            ))}
          </section>
        ))
      )}
    </div>
  )
}
