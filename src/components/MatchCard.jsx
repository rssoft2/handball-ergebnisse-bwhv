import { REPORT_BASE } from '../config.js'
import { formatDate, formatTime } from '../utils/format.js'
import { isFavoriteTeam } from '../utils/teams.js'

function TeamName({ name, favorite }) {
  return (
    <span
      className={`block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${
        favorite ? 'font-bold text-favink' : 'font-medium text-ink'
      }`}
      title={name}
    >
      {name}
    </span>
  )
}

export default function MatchCard({ game, favoriteTeams, onOpenReport, onOpenLive, onOpenLeague }) {
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
      className={`w-full min-w-0 overflow-hidden rounded-2xl border p-1.5 shadow-sm transition sm:p-3 ${
        isFav ? 'border-favline bg-favbg' : 'border-line bg-surface'
      }`}
    >
      {game.leagueName ? (
        <div className="mb-1.5 truncate text-center text-[11px] font-medium text-muted">
          {game.leagueName}
        </div>
      ) : null}
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="font-medium">
          {game.weekday ? `${game.weekday}, ` : ''}
          {formatDate(game.date)}
          {game.time && !game.live ? ` · ${formatTime(game.time)}` : ''}
        </span>
        {game.live ? (
          <span className="shrink-0 text-[11px] font-semibold text-muted">
            Live seit {formatTime(game.time)}
          </span>
        ) : null}
      </div>

      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-center gap-1 sm:gap-2">
        <div className="min-w-0 w-full overflow-hidden text-right">
          <TeamName name={game.home} favorite={homeFav} />
        </div>
        <div className="w-[44px] justify-self-center text-center sm:w-[64px]">
          <div className="rounded-lg bg-surface2 px-0 py-0.5 text-xs font-bold tabular-nums text-ink sm:px-1.5 sm:py-1 sm:text-base">
            {result}
          </div>
          {halftime ? (
            <div className="mt-0.5 text-[8px] tabular-nums text-faint sm:text-[10px]">({halftime})</div>
          ) : null}
        </div>
        <div className="min-w-0 w-full overflow-hidden text-left">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-live px-3 py-1 text-xs font-bold text-liveink transition hover:bg-livestrong active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Live-Ticker
          </button>
        </div>
      ) : null}

      {(game.done && game.reportId) || game.cl || game.leagueId ? (
        <div className="mt-2 relative flex items-center justify-center gap-2 overflow-x-auto px-1">
          <div className="flex items-center gap-2">
            {game.done && game.reportId ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenReport?.(game, 'stats')}
                  className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
                >
                  Statistik
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReport?.(game, 'timeline')}
                  className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
                >
                  Verlauf
                </button>
              </>
            ) : null}
            {(game.cl || game.leagueId) ? (
              <button
                type="button"
                onClick={() => onOpenLeague?.(game.cl || game.leagueId)}
                className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
              >
                Tabelle
              </button>
            ) : null}
          </div>
          {game.done && game.reportId ? (
            <a
              href={`${REPORT_BASE}${game.reportId}`}
              target="_blank"
              rel="noreferrer"
              className="absolute right-1 shrink-0 px-1 text-xs font-medium text-faint transition hover:text-accent hover:underline"
            >
              PDF
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
