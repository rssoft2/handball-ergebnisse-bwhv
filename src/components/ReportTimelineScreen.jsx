import StateMessage from './StateMessage.jsx'
import ReportHeader from './ReportHeader.jsx'
import { CardMark } from './ReportCards.jsx'

function OutcomeBadge({ event }) {
  if (event.type === 'timeout') {
    return <CardMark kind="timeout" />
  }
  if (event.type === 'card') {
    return <CardMark kind={event.card} />
  }
  if (event.missed) {
    return (
      <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-faint">
        7m daneben
      </span>
    )
  }
  if (event.seven) {
    return (
      <span className="rounded-full bg-accentsoft px-2 py-0.5 text-[10px] font-bold text-accent">
        7m
      </span>
    )
  }
  return null
}

export default function ReportTimelineScreen({ report, game, favoriteTeams }) {
  if (!report || report.status === 'loading') return <StateMessage status="loading" />
  if (report.status === 'error') return <StateMessage status="error" error={report.error} />

  const data = report.data
  if (!data) return null

  if (!data.hasData) {
    return (
      <div className="space-y-4">
        <ReportHeader data={data} game={game} favoriteTeams={favoriteTeams} />
        <StateMessage emptyText="Für dieses Spiel liegt kein Spielverlauf vor." />
      </div>
    )
  }

  const milestone = data.milestone
  // Neueste Aktion oben, Spielanfang unten.
  const orderedEvents = [...data.events].reverse()

  return (
    <div className="space-y-4">
      <ReportHeader data={data} game={game} favoriteTeams={favoriteTeams} />

      <ol className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {orderedEvents.map((event, index) => {
          const label =
            event.type === 'timeout'
              ? event.teamLabel
              : data.codeLabels[event.teamCode] || event.teamCode
          const isMilestone =
            milestone &&
            event.type === 'goal' &&
            !event.missed &&
            event.side === milestone.side &&
            event.teamGoalRank === milestone.rank
          return (
            <li
              key={`${event.clock}-${index}`}
              className={`flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 ${
                isMilestone ? 'bg-accentsoft' : ''
              }`}
            >
              <span className="w-11 shrink-0 text-xs tabular-nums text-faint">{event.playTime}</span>
              <span className="w-12 shrink-0 rounded-md bg-surface2 py-0.5 text-center text-sm font-bold tabular-nums text-ink">
                {event.score || '–'}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                {event.type === 'timeout' ? (
                  <>
                    <span className="text-muted">Auszeit </span>
                    <span className="font-medium text-ink">{label}</span>
                  </>
                ) : (
                  <>
                    <span className={`font-medium ${isMilestone ? 'text-accent' : 'text-ink'}`}>
                      {event.name}
                    </span>
                    {isMilestone ? (
                      <span className="ml-1 inline-block whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 align-middle text-[10px] font-bold text-accentink">
                        {milestone.rank}.&nbsp;Tor
                      </span>
                    ) : null}{' '}
                    <span className="text-faint">
                      ({event.nr}
                      {event.nr ? ', ' : ''}
                      {label})
                    </span>
                  </>
                )}
              </span>
              <OutcomeBadge event={event} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
