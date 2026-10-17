import { useState } from 'react'
import MatchCard from './MatchCard.jsx'

export default function MatchList({
  games,
  favoriteTeams,
  emptyText,
  initialLimit = 10,
  initialGames,
  onOpenReport,
  onOpenLive,
}) {
  const [expanded, setExpanded] = useState(false)
  const base = initialGames ?? games.slice(0, initialLimit)
  const hasMore = games.length > base.length
  const visible = expanded ? games : base

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {visible.map((game) => (
        <MatchCard
          key={game.id}
          game={game}
          favoriteTeams={favoriteTeams}
          onOpenReport={onOpenReport}
          onOpenLive={onOpenLive}
        />
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full rounded-2xl border border-line bg-surface py-2.5 text-sm font-semibold text-accent transition hover:bg-surface2 active:scale-[0.99]"
        >
          {expanded ? 'Weniger anzeigen' : `Alle ${games.length} anzeigen`}
        </button>
      ) : null}
    </div>
  )
}
