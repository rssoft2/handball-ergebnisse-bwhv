import StateMessage from './StateMessage.jsx'
import MatchCard from './MatchCard.jsx'
import { pickWeekend, groupByDay, dayLabel, weekendLabel } from '../utils/spieltag.js'

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-faint"
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

// Spieltag-Tab: Wochenend-Spiele aller favorisierten Vereine, je Verein nach Tag
// gruppiert. Ein Tipp auf den Vereinsnamen öffnet die Einzel-Spieltagsübersicht.
export default function SpieltagView({
  clubs,
  status,
  data,
  error,
  onRetry,
  onOpenClub,
  onOpenReport,
  onOpenLive,
}) {
  if (!clubs.length) {
    return (
      <StateMessage emptyText="Noch keine Vereine als Favoriten. Tippe bei einem Verein auf den Stern." />
    )
  }

  if (status === 'loading' && !data) return <StateMessage status="loading" />
  if (status === 'error') return <StateMessage status="error" error={error} onRetry={onRetry} />

  const groups = (data?.clubs ?? [])
    .map((group) => ({ ...group, weekend: pickWeekend(group.games) }))
    .filter((group) => group.weekend.games.length > 0)

  if (groups.length === 0) {
    return <StateMessage emptyText="An diesem Wochenende sind keine Spiele deiner Vereine angesetzt." />
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.clubId} className="space-y-2.5">
          <button
            type="button"
            onClick={() => onOpenClub?.({ clubId: group.clubId, clubName: group.clubName })}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:bg-surface2 active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-head text-sm font-bold text-ink">{group.clubName}</div>
              <div className="truncate text-xs text-muted">
                {weekendLabel(group.weekend.range)} · {group.weekend.games.length}{' '}
                {group.weekend.games.length === 1 ? 'Spiel' : 'Spiele'}
              </div>
            </div>
            <ChevronRight />
          </button>

          {groupByDay(group.weekend.games).map((day) => (
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
                />
              ))}
            </div>
          ))}
        </section>
      ))}

      {data?.throttled ? (
        <p className="px-1 text-xs text-faint">
          Handball4all drosselt gerade – ggf. nicht alle Vereine geladen.
        </p>
      ) : null}
    </div>
  )
}
