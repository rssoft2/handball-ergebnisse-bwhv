import StateMessage from './StateMessage.jsx'
import StandingsTable from './StandingsTable.jsx'
import MatchList from './MatchList.jsx'
import { startOfDaysAgo } from '../utils/format.js'

const byDateDesc = (a, b) => (b.dateObj ?? 0) - (a.dateObj ?? 0)

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

export default function LeagueDetail({
  data,
  status,
  error,
  onReload,
  favoriteTeams,
  onOpenReport,
  onOpenLive,
  onOpenScorers,
  onOpenTeam,
}) {
  if (status === 'loading' && !data) {
    return <StateMessage status="loading" />
  }

  if (status === 'error') {
    return <StateMessage status="error" error={error} onRetry={onReload} />
  }

  if (!data) return null

  // Neueste Spiele oben, älteste unten.
  const current = [...data.live, ...data.played].sort(byDateDesc)
  const since = startOfDaysAgo(7).getTime()
  const recent = current.filter((game) => game.dateObj != null && game.dateObj >= since)

  return (
    <div className="space-y-8">
      {onOpenScorers ? (
        <button
          type="button"
          onClick={onOpenScorers}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition hover:bg-surface2 active:scale-[0.99]"
        >
          <span className="font-head text-sm font-semibold text-ink">Torschützenliste</span>
          <span className="text-xs text-muted">Liga-Statistik ›</span>
        </button>
      ) : null}

      <Section
        title="Letzte Spiele"
        subtitle={data.live.length > 0 ? `${data.live.length} live` : undefined}
      >
        <MatchList
          games={current}
          initialGames={recent}
          favoriteTeams={favoriteTeams}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
          emptyText="Noch keine Spiele gespielt."
        />
      </Section>

      <Section title="Tabelle">
        {data.standings.length > 0 ? (
          <StandingsTable
            rows={data.standings}
            favoriteTeams={favoriteTeams}
            formByTeam={data.formByTeam}
            onSelectTeam={onOpenTeam}
          />
        ) : (
          <StateMessage emptyText="Keine Tabelle verfügbar." />
        )}
      </Section>

      <Section title="Kommende Spiele">
        <MatchList
          games={data.upcoming}
          favoriteTeams={favoriteTeams}
          emptyText="Keine kommenden Spiele angesetzt."
          initialLimit={5}
        />
      </Section>

      {data.meta.updated ? (
        <p className="text-center text-xs text-faint">{data.meta.updated}</p>
      ) : null}
    </div>
  )
}
