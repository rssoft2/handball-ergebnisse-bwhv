import StateMessage from './StateMessage.jsx'
import ReportHeader from './ReportHeader.jsx'
import { TeamStats } from './PlayerStats.jsx'

export default function ReportStatsScreen({ report, game, favoriteTeams }) {
  if (!report || report.status === 'loading') return <StateMessage status="loading" />
  if (report.status === 'error') return <StateMessage status="error" error={report.error} />

  const data = report.data
  if (!data) return null

  return (
    <div className="space-y-4">
      <ReportHeader data={data} game={game} favoriteTeams={favoriteTeams} />

      {!data.hasRoster ? (
        <StateMessage emptyText="Für dieses Spiel liegt keine auswertbare Spielerstatistik vor." />
      ) : (
        data.teams.map((team) => (
          <TeamStats key={team.side} team={team} milestone={data.milestone} />
        ))
      )}
    </div>
  )
}
