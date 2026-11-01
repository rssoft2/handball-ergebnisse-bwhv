import { useMemo } from 'react'
import MatchList from './MatchList.jsx'
import StateMessage from './StateMessage.jsx'
import { scheduleForTeam } from '../utils/teamSchedule.js'

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
        <h2 className="font-head text-base font-bold text-ink">{title}</h2>
        {subtitle ? <span className="text-xs text-muted">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  )
}

export default function TeamScheduleScreen({
  data,
  teamName,
  favoriteTeams,
  onOpenReport,
  onOpenLive,
  onOpenScorers,
}) {
  const schedule = useMemo(() => scheduleForTeam(data, teamName), [data, teamName])
  const coming = [...schedule.live, ...schedule.upcoming]
  const total = coming.length + schedule.played.length

  if (!data) return null

  const scorersButton = onOpenScorers ? (
    <button
      type="button"
      onClick={onOpenScorers}
      className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition hover:bg-surface2 active:scale-[0.99]"
    >
      <span className="font-head text-sm font-semibold text-ink">Torschützenliste</span>
      <span className="text-xs text-muted">Team-Statistik ›</span>
    </button>
  ) : null

  if (total === 0) {
    return (
      <div className="space-y-8">
        {scorersButton}
        <StateMessage emptyText="Keine Spiele für dieses Team gefunden." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {scorersButton}

      <Section
        title="Kommende Spiele"
        subtitle={schedule.live.length > 0 ? `${schedule.live.length} live` : undefined}
      >
        <MatchList
          games={coming}
          favoriteTeams={favoriteTeams}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
          emptyText="Keine kommenden Spiele angesetzt."
          initialLimit={5}
        />
      </Section>

      <Section title="Ergebnisse">
        <MatchList
          games={schedule.played}
          favoriteTeams={favoriteTeams}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
          emptyText="Noch keine Ergebnisse."
        />
      </Section>

      {data.meta?.updated ? (
        <p className="text-center text-xs text-faint">{data.meta.updated}</p>
      ) : null}
    </div>
  )
}
