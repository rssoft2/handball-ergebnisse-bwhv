import { useMemo } from 'react'
import MatchList from './MatchList.jsx'
import StateMessage from './StateMessage.jsx'
import { scheduleForTeam } from '../utils/teamSchedule.js'
import { buildTeamCalendarIcs, teamCalendarFilename } from '../utils/ics.js'
import { downloadFile } from '../utils/download.js'

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

function CalendarButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kalender exportieren"
      title="Kalender exportieren (ICS)"
      className="ml-auto flex w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-muted shadow-sm transition hover:bg-surface2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
        <path d="M12 14v5M9.5 16.5 12 19l2.5-2.5" />
      </svg>
    </button>
  )
}

function ActionButton({ title, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition hover:bg-surface2 active:scale-[0.99]"
    >
      <span className="font-head text-sm font-semibold text-ink">{title}</span>
      <span className="shrink-0 text-xs text-muted">{hint}</span>
    </button>
  )
}

export default function TeamScheduleScreen({
  data,
  teamName,
  favoriteTeams,
  onOpenReport,
  onOpenLive,
  onOpenStats,
  onOpenGym,
}) {
  const schedule = useMemo(() => scheduleForTeam(data, teamName), [data, teamName])
  const coming = [...schedule.live, ...schedule.upcoming]
  const total = coming.length + schedule.played.length

  if (!data) return null

  const statsButton = onOpenStats ? (
    <ActionButton title="Team-Statistik" hint="Tore & Strafen ›" onClick={onOpenStats} />
  ) : null

  const exportCalendar = () => {
    const games = [...schedule.live, ...schedule.upcoming, ...schedule.played]
    downloadFile(teamCalendarFilename(teamName), buildTeamCalendarIcs({ teamName, games }))
  }

  if (total === 0) {
    return (
      <div className="space-y-8">
        {statsButton}
        <StateMessage emptyText="Keine Spiele für dieses Team gefunden." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-stretch gap-2">
          {statsButton ? <div className="min-w-0 flex-1">{statsButton}</div> : null}
          <CalendarButton onClick={exportCalendar} />
        </div>
      </div>

      <Section
        title="Kommende Spiele"
        subtitle={schedule.live.length > 0 ? `${schedule.live.length} live` : undefined}
      >
        <MatchList
          games={coming}
          favoriteTeams={favoriteTeams}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
          onOpenGym={onOpenGym}
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
          onOpenGym={onOpenGym}
          emptyText="Noch keine Ergebnisse."
        />
      </Section>

      {data.meta?.updated ? (
        <p className="text-center text-xs text-faint">{data.meta.updated}</p>
      ) : null}
    </div>
  )
}
