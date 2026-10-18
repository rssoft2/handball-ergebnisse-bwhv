import StateMessage from './StateMessage.jsx'
import { isFavoriteTeam } from '../utils/teams.js'

function ProgressBar({ progress }) {
  if (!progress || !progress.total) return null
  const pct = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>Spielberichte werden geladen …</span>
        <span className="tabular-nums">
          {progress.loaded}/{progress.total}
          {progress.failed ? ` · ${progress.failed} fehlgeschlagen` : ''}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function LeagueScorersScreen({
  status,
  data,
  progress,
  error,
  onReload,
  favoriteTeams,
}) {
  if (status === 'loading' && !data) {
    return (
      <div className="space-y-4">
        <ProgressBar progress={progress} />
        {!progress ? <StateMessage status="loading" /> : null}
      </div>
    )
  }

  if (status === 'error') {
    return <StateMessage status="error" error={error} onRetry={onReload} />
  }

  if (!data) return null

  const scorers = data.scorers ?? []
  const basis =
    data.withReport < data.totalGames
      ? `Basis: ${data.loadedReports} von ${data.totalGames} Spielen mit Bericht.`
      : null

  return (
    <div className="space-y-4">
      <ProgressBar progress={progress} />

      {data.withReport === 0 ? (
        <StateMessage emptyText="Für diese Liga liegen noch keine auswertbaren Spielberichte vor." />
      ) : scorers.length === 0 ? (
        <StateMessage
          emptyText={
            status === 'loading'
              ? 'Spielerstatistiken werden ausgewertet …'
              : 'Keine Torschützen gefunden.'
          }
        />
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
            <h2 className="font-head text-base font-bold text-ink">Torschützen</h2>
            <span className="text-xs text-muted tabular-nums">
              {scorers.length} Spieler · {data.loadedReports} Berichte
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-faint">
                <th className="py-1 pr-2 text-right font-semibold">#</th>
                <th className="py-1 pr-2 text-right font-semibold">Nr.</th>
                <th className="py-1 text-left font-semibold">Spieler</th>
                <th className="hidden py-1 pl-2 text-left font-semibold sm:table-cell">Team</th>
                <th className="py-1 pl-2 text-right font-semibold" title="Spiele">
                  Sp
                </th>
                <th className="py-1 pl-2 text-right font-semibold">Tore</th>
                <th className="py-1 pl-2 text-right font-semibold" title="Feldtore (ohne 7m)">
                  Feld
                </th>
                <th className="py-1 pl-2 text-right font-semibold" title="7m-Tore">7m</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((p, i) => {
                const fav = isFavoriteTeam(p.team, favoriteTeams)
                return (
                  <tr key={`${p.team}|${p.nr}|${p.name}`} className="border-t border-line">
                    <td className="py-1.5 pr-2 text-right tabular-nums text-faint">{i + 1}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-muted">{p.nr}</td>
                    <td className="py-1.5 font-medium text-ink">
                      {p.name}
                      <span className="block text-[11px] text-muted sm:hidden">{p.team}</span>
                    </td>
                    <td
                      className={`hidden py-1.5 pl-2 text-xs sm:table-cell ${
                        fav ? 'font-semibold text-favink' : 'text-muted'
                      }`}
                    >
                      {p.team}
                    </td>
                    <td className="py-1.5 pl-2 text-right tabular-nums text-muted">
                      {p.games}
                    </td>
                    <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-ink">
                      {p.goals}
                    </td>
                    <td className="py-1.5 pl-2 text-right tabular-nums text-muted">
                      {p.goals - p.seven || ''}
                    </td>
                    <td className="py-1.5 pl-2 text-right tabular-nums text-muted">
                      {p.seven || ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p className="mt-2 px-1 text-center text-[11px] text-faint">{basis}</p>
        </section>
      )}
    </div>
  )
}
