import StateMessage from './StateMessage.jsx'
import MatchCard from './MatchCard.jsx'
import { pickWeekend, groupByDay, dayLabel, weekendLabel } from '../utils/spieltag.js'

// Spieltagsübersicht eines Vereins: alle Spiele seiner Mannschaften am aktuellen
// (sonst nächsten) Wochenende, nach Tag gruppiert.
export default function ClubScreen({ schedule, onOpenReport, onOpenLive }) {
  const { status, data, error, reload } = schedule

  if (status === 'loading' && !data) return <StateMessage status="loading" />
  if (status === 'error') return <StateMessage status="error" error={error} onRetry={reload} />

  const { range, games } = pickWeekend(data ?? [])
  const days = groupByDay(games)

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="font-head text-base font-bold text-ink">Spieltag</h2>
        <p className="text-xs text-muted">
          {weekendLabel(range)} · {games.length} {games.length === 1 ? 'Spiel' : 'Spiele'}
        </p>
      </div>

      {days.length === 0 ? (
        <StateMessage emptyText="Keine Spiele an diesem Wochenende angesetzt." />
      ) : (
        days.map((day) => (
          <section key={day.date.getTime()} className="space-y-2.5">
            <h3 className="px-1 font-head text-xs font-semibold uppercase tracking-[0.06em] text-accent">
              {dayLabel(day.date)}
            </h3>
            {day.games.map((game) => (
              <MatchCard
                key={game.id}
                game={game}
                onOpenReport={onOpenReport}
                onOpenLive={onOpenLive}
              />
            ))}
          </section>
        ))
      )}
    </div>
  )
}
