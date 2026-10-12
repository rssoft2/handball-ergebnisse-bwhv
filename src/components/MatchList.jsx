import { useState } from 'react'
import MatchCard from './MatchCard.jsx'

export default function MatchList({ games, favoriteTeams, emptyText, initialLimit = 10 }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = games.length > initialLimit
  const visible = expanded ? games : games.slice(0, initialLimit)

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {visible.map((game) => (
        <MatchCard key={game.id} game={game} favoriteTeams={favoriteTeams} />
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {expanded
            ? 'Weniger anzeigen'
            : `Alle ${games.length} anzeigen`}
        </button>
      ) : null}
    </div>
  )
}
