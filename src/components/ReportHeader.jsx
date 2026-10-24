import { formatDate } from '../utils/format.js'
import { isFavoriteTeam } from '../utils/teams.js'

// Kopf des Berichts: Heim/Gast, Endstand, Halbzeit und Eckdaten.
export default function ReportHeader({ data, game, favoriteTeams }) {
  const meta = data?.meta || {}
  const home = meta.homeFull || game?.home || ''
  const away = meta.awayFull || game?.away || ''

  const score =
    meta.homeGoals != null && meta.awayGoals != null
      ? `${meta.homeGoals}:${meta.awayGoals}`
      : game?.done
        ? `${game.homeGoals}:${game.awayGoals}`
        : '–:–'
  const half =
    meta.homeHalf != null && meta.awayHalf != null ? `${meta.homeHalf}:${meta.awayHalf}` : null

  const homeFav = isFavoriteTeam(home, favoriteTeams)
  const awayFav = isFavoriteTeam(away, favoriteTeams)

  const when = [meta.date ? formatDate(meta.date) : game?.date ? formatDate(game.date) : '', meta.time || game?.time]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-sm sm:p-4">
      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-3">
        <div className="min-w-0 w-full overflow-hidden text-right">
          <span
            className={`block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
              homeFav ? 'font-bold text-favink' : 'font-medium text-ink'
            }`}
            title={home}
          >
            {home}
          </span>
        </div>
        <div className="shrink-0 text-center">
          <div className="rounded-lg bg-surface2 px-1.5 py-0.5 text-lg font-bold tabular-nums text-ink sm:px-3 sm:py-1 sm:text-2xl">
            {score}
          </div>
          {half ? (
            <div className="mt-0.5 text-[10px] tabular-nums text-faint sm:text-[11px]">
              HZ {half}
            </div>
          ) : null}
        </div>
        <div className="min-w-0 w-full overflow-hidden text-left">
          <span
            className={`block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
              awayFav ? 'font-bold text-favink' : 'font-medium text-ink'
            }`}
            title={away}
          >
            {away}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-0.5 text-center text-xs text-muted">
        {meta.league ? <div>{meta.league}</div> : null}
        {when ? <div className="tabular-nums">{when}</div> : null}
        {meta.venue ? <div className="text-faint">{meta.venue}</div> : null}
      </div>
    </div>
  )
}
