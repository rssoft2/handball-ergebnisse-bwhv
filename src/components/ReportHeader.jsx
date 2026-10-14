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
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-right">
          <span className={homeFav ? 'font-bold text-favink' : 'font-medium text-ink'}>{home}</span>
        </div>
        <div className="shrink-0 text-center">
          <div className="rounded-lg bg-surface2 px-3 py-1 text-2xl font-bold tabular-nums text-ink">
            {score}
          </div>
          {half ? (
            <div className="mt-0.5 text-[11px] tabular-nums text-faint">HZ {half}</div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span className={awayFav ? 'font-bold text-favink' : 'font-medium text-ink'}>{away}</span>
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
