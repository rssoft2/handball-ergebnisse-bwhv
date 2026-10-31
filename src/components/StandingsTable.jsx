import { isFavoriteTeam } from '../utils/teams.js'

function formDotClass(value) {
  if (value === 'S') return 'bg-emerald-500 text-white'
  if (value === 'N') return 'bg-red-500 text-white'
  return 'bg-slate-400 text-white'
}

function FormCell({ form }) {
  if (!form || form.length === 0) {
    return <span className="text-faint">–</span>
  }
  return (
    <div className="flex items-center justify-center gap-0.5">
      {form.map((result, index) => (
        <span
          key={index}
          title={result === 'S' ? 'Sieg' : result === 'N' ? 'Niederlage' : 'Unentschieden'}
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${formDotClass(result)}`}
        >
          {result}
        </span>
      ))}
    </div>
  )
}

export default function StandingsTable({ rows, favoriteTeams, formByTeam = {}, onSelectTeam }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface2 text-xs uppercase tracking-wide text-muted">
            <th className="px-2 py-2.5 text-left font-semibold">#</th>
            <th className="px-2 py-2.5 text-left font-semibold">Mannschaft</th>
            <th className="px-2 py-2.5 text-center font-semibold">Sp</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">S</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">U</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">N</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">Tore</th>
            <th className="px-2 py-2.5 text-center font-semibold">Diff</th>
            <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">Form</th>
            <th className="px-2 py-2.5 text-center font-semibold">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const fav = isFavoriteTeam(row.name, favoriteTeams)
            const teamClass = `max-w-[10rem] truncate text-left sm:max-w-none ${
              fav ? 'font-bold text-favink' : 'font-medium text-ink'
            }`
            return (
              <tr
                key={row.teamId}
                className={`border-b border-line last:border-0 ${
                  fav ? 'bg-favbg' : 'transition hover:bg-surface2'
                }`}
              >
                <td className="px-2 py-2.5 text-left font-semibold tabular-nums text-muted">
                  {row.rank}
                </td>
                <td className="p-0">
                  {onSelectTeam ? (
                    <button
                      type="button"
                      onClick={() => onSelectTeam(row.name)}
                      className={`block w-full cursor-pointer px-2 py-2.5 transition hover:text-accent focus-visible:text-accent focus-visible:underline ${teamClass}`}
                      title={row.name}
                    >
                      {row.name}
                    </button>
                  ) : (
                    <div className={`px-2 py-2.5 ${teamClass}`} title={row.name}>
                      {row.name}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">{row.played}</td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-emerald-600 sm:table-cell">
                  {row.won}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted sm:table-cell">
                  {row.draw}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted sm:table-cell">
                  {row.lost}
                </td>
                <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted sm:table-cell">
                  {row.goalsFor}:{row.goalsAgainst}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-muted">
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </td>
                <td className="hidden px-2 py-2.5 text-center sm:table-cell">
                  <FormCell form={formByTeam[row.name]} />
                </td>
                <td className="px-2 py-2.5 text-center text-base font-bold tabular-nums text-ink">
                  {row.pointsPlus}:{row.pointsMinus}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
