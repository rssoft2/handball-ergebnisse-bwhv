import { isFavoriteTeam } from '../utils/teams.js'

function formCellClass(value) {
  return value > 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-slate-700 dark:text-slate-300'
}

export default function StandingsTable({ rows, favoriteTeams }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
            <th className="px-2 py-2.5 text-left font-semibold">#</th>
            <th className="px-2 py-2.5 text-left font-semibold">Mannschaft</th>
            <th className="px-2 py-2.5 text-center font-semibold">Sp</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">S</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">U</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">N</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">Tore</th>
            <th className="px-2 py-2.5 text-center font-semibold">Diff</th>
            <th className="px-2 py-2.5 text-center font-semibold">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const fav = isFavoriteTeam(row.name, favoriteTeams)
            return (
              <tr
                key={row.teamId}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800/60 ${
                  fav
                    ? 'bg-amber-100/70 dark:bg-amber-500/15'
                    : 'odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-950/40'
                }`}
              >
                <td className="px-2 py-2.5 text-left font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  {row.rank}
                </td>
                <td
                  className={`max-w-[10rem] truncate px-2 py-2.5 text-left sm:max-w-none ${
                    fav
                      ? 'font-bold text-amber-900 dark:text-amber-200'
                      : 'font-medium text-slate-800 dark:text-slate-100'
                  }`}
                  title={row.name}
                >
                  {row.name}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-slate-700 dark:text-slate-300">
                  {row.played}
                </td>
                <td
                  className={`hidden px-2 py-2.5 text-center tabular-nums sm:table-cell ${formCellClass(row.won)}`}
                >
                  {row.won}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-slate-700 sm:table-cell dark:text-slate-300">
                  {row.draw}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-slate-700 sm:table-cell dark:text-slate-300">
                  {row.lost}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-slate-700 sm:table-cell dark:text-slate-300">
                  {row.goalsFor}:{row.goalsAgainst}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-slate-700 dark:text-slate-300">
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </td>
                <td className="px-2 py-2.5 text-center text-base font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {row.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
