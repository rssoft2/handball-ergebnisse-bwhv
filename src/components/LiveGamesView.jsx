import StateMessage from './StateMessage.jsx'
import MatchCard from './MatchCard.jsx'

// Übersicht aller derzeit laufenden Spiele (Startseiten-Tab "Live").
export default function LiveGamesView({ games, status, error, onRetry, favoriteTeams, onOpenLive }) {
  if (status === 'loading' && !games) return <StateMessage status="loading" />
  if (status === 'error') return <StateMessage status="error" error={error} onRetry={onRetry} />

  if (!games || games.length === 0) {
    return <StateMessage emptyText="Derzeit ist kein Spiel live." />
  }

  return (
    <div className="space-y-2.5">
      <p className="px-1 text-xs text-muted">
        {games.length === 1 ? 'Derzeit ist 1 Spiel live.' : `Derzeit sind ${games.length} Spiele live.`}
      </p>
      {games.map((game) => (
        <MatchCard
          key={game.id}
          game={game}
          favoriteTeams={favoriteTeams}
          onOpenLive={onOpenLive}
        />
      ))}
    </div>
  )
}
