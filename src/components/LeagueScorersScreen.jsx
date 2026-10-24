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

          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[320px] text-xs sm:text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-faint sm:text-[11px]">
                  <th className="py-1 pr-1 text-right font-semibold sm:pr-2">#</th>
                  <th className="py-1 pr-3 text-right font-semibold sm:pr-4">Nr.</th>
                  <th className="py-1 text-left font-semibold">Spieler</th>
                  <th className="hidden py-1 pl-1 text-left font-semibold sm:table-cell sm:pl-2">Team</th>
                  <th className="py-1 pl-1 text-right font-semibold sm:pl-2" title="Spiele">
                    Sp
                  </th>
                  <th className="py-1 pl-1 text-right font-semibold sm:pl-2">Tore</th>
                  <th className="py-1 pl-1 text-right font-semibold sm:pl-2" title="Feldtore (ohne 7m)">
                    Feld
                  </th>
                  <th className="py-1 pl-1 pr-0.5 text-right font-semibold sm:pl-2 sm:pr-0">
                    7m
                  </th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((p, i) => {
                  const fav = isFavoriteTeam(p.team, favoriteTeams)
                  return (
                    <tr key={`${p.team}|${p.nr}|${p.name}`} className="border-t border-line">
                      <td className="py-1 pr-1 text-right tabular-nums text-faint sm:pr-2">{i + 1}</td>
                      <td className="py-1 pr-3 text-right tabular-nums text-muted sm:pr-4">{p.nr}</td>
                      <td className="py-1 font-medium text-ink">
                        <span className="block max-w-[9rem] truncate sm:max-w-none">{p.name}</span>
                        <span
                          className={`block text-[10px] sm:hidden ${
                            fav ? 'font-medium text-favink' : 'text-muted'
                          }`}
                        >
                          {p.team}
                        </span>
                      </td>
                      <td
                        className={`hidden py-1 pl-1 text-xs sm:table-cell sm:pl-2 ${
                          fav ? 'font-semibold text-favink' : 'text-muted'
                        }`}
                      >
                        {p.team}
                      </td>
                      <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">
                        {p.games}
                      </td>
                      <td className="py-1 pl-1 text-right font-bold tabular-nums text-ink sm:pl-2">
                        {p.goals}
                      </td>
                      <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">
                        {p.goals - p.seven || ''}
                      </td>
                      <td className="py-1 pl-1 pr-0.5 text-right tabular-nums text-muted sm:pl-2 sm:pr-0">
                        {p.seven || ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 px-1 text-center text-[11px] text-faint">{basis}</p>
        </section>
      )}
    </div>
  )
}
