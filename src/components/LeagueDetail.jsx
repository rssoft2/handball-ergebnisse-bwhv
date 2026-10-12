import StateMessage from './StateMessage.jsx'
import StandingsTable from './StandingsTable.jsx'
import MatchList from './MatchList.jsx'
import { startOfDaysAgo } from '../utils/format.js'
import { buildFormByTeam } from '../utils/teams.js'

const byDateAsc = (a, b) => (a.dateObj?.getTime() ?? 0) - (b.dateObj?.getTime() ?? 0)

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

export default function LeagueDetail({ data, status, error, onReload, favoriteTeams }) {
  if (status === 'loading' && !data) {
    return <StateMessage status="loading" />
  }

  if (status === 'error') {
    return <StateMessage status="error" error={error} onRetry={onReload} />
  }

  if (!data) return null

  const current = [...data.live, ...data.played].sort(byDateAsc)
  const since = startOfDaysAgo(7)
  const recent = current.filter((game) => game.dateObj && game.dateObj >= since)
  const formByTeam = buildFormByTeam(data.played)

  return (
    <div className="space-y-8">
      <Section
        title="Aktuelle Spiele"
        subtitle={data.live.length > 0 ? `${data.live.length} live` : undefined}
      >
        <MatchList
          games={current}
          initialGames={recent}
          favoriteTeams={favoriteTeams}
          emptyText="Noch keine Spiele gespielt."
        />
      </Section>

      <Section title="Tabelle">
        {data.standings.length > 0 ? (
          <StandingsTable
            rows={data.standings}
            favoriteTeams={favoriteTeams}
            formByTeam={formByTeam}
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
