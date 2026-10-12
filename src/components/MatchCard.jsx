import { REPORT_BASE } from '../config.js'
import { formatDate, formatTime } from '../utils/format.js'
import { isFavoriteTeam } from '../utils/teams.js'

function TeamName({ name, favorite }) {
  return (
    <span
      className={
        favorite
          ? 'font-bold text-amber-700 dark:text-amber-300'
          : 'font-medium text-slate-800 dark:text-slate-100'
      }
    >
      {name}
    </span>
  )
}

export default function MatchCard({ game, favoriteTeams }) {
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
      className={`rounded-xl border p-3 shadow-sm transition ${
        isFav
          ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
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
          <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-base font-bold tabular-nums text-slate-900 dark:bg-slate-800 dark:text-slate-50">
            {result}
          </div>
          {halftime ? (
            <div className="mt-0.5 text-[10px] tabular-nums text-slate-400">
              ({halftime})
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <TeamName name={game.away} favorite={awayFav} />
        </div>
      </div>

      {(game.venue || game.town) && (
        <div className="mt-2 truncate text-center text-xs text-slate-400 dark:text-slate-500">
          {[game.venue, game.town].filter(Boolean).join(', ')}
        </div>
      )}

      {game.done && game.reportId ? (
        <div className="mt-2 text-center">
          <a
            href={`${REPORT_BASE}${game.reportId}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Spielbericht öffnen
          </a>
        </div>
      ) : null}
    </div>
  )
}
