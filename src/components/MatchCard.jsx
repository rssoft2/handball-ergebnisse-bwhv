import { REPORT_BASE } from '../config.js'
import { formatDate, formatTime } from '../utils/format.js'
import { isFavoriteTeam } from '../utils/teams.js'

function TeamName({ name, favorite }) {
  return (
    <span className={favorite ? 'font-bold text-favink' : 'font-medium text-ink'}>
      {name}
    </span>
  )
}

export default function MatchCard({ game, favoriteTeams, onOpenReport, onOpenLive }) {
  const homeFav = isFavoriteTeam(game.home, favoriteTeams)
  const awayFav = isFavoriteTeam(game.away, favoriteTeams)
  const isFav = homeFav || awayFav

  const result = game.done ? `${game.homeGoals}:${game.awayGoals}` : '–:–'
  const halftime =
    game.done && game.homeHalftime !== null && game.awayHalftime !== null
      ? `${game.homeHalftime}:${game.awayHalftime}`
      : null

  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm transition ${
        isFav ? 'border-favline bg-favbg' : 'border-line bg-surface'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="font-medium">
          {game.weekday ? `${game.weekday}, ` : ''}
          {formatDate(game.date)}
          {game.time ? ` · ${formatTime(game.time)}` : ''}
        </span>
        {game.live ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 text-right">
          <TeamName name={game.home} favorite={homeFav} />
        </div>
        <div className="shrink-0 text-center">
          <div className="rounded-lg bg-surface2 px-2.5 py-1 text-base font-bold tabular-nums text-ink">
            {result}
          </div>
          {halftime ? (
            <div className="mt-0.5 text-[10px] tabular-nums text-faint">({halftime})</div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <TeamName name={game.away} favorite={awayFav} />
        </div>
      </div>

      {(game.venue || game.town) && (
        <div className="mt-2 truncate text-center text-xs text-faint">
          {[game.venue, game.town].filter(Boolean).join(', ')}
        </div>
      )}

      {game.live && game.token ? (
        <div className="mt-2 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onOpenLive?.(game)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Live-Ticker
          </button>
        </div>
      ) : null}

      {game.done && game.reportId ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenReport?.(game, 'stats')}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
          >
            Statistik
          </button>
          <button
            type="button"
            onClick={() => onOpenReport?.(game, 'timeline')}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
          >
            Verlauf
          </button>
          <a
            href={`${REPORT_BASE}${game.reportId}`}
            target="_blank"
            rel="noreferrer"
            className="px-1 text-xs font-medium text-faint transition hover:text-accent hover:underline"
          >
            PDF
          </a>
        </div>
      ) : null}
    </div>
  )
}
