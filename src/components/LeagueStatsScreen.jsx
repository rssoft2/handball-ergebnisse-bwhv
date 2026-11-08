import { useState } from 'react'
import StateMessage from './StateMessage.jsx'
import { CardMark } from './ReportCards.jsx'
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

function StatsTabs({ tab, onChange }) {
  const items = [
    { id: 'scorers', label: 'Tore' },
    { id: 'penalties', label: 'Strafen' },
  ]

  return (
    <div
      role="tablist"
      aria-label="Statistik"
      className="flex gap-1 rounded-2xl border border-line bg-surface p-1 shadow-sm"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => onChange(item.id)}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            tab === item.id
              ? 'bg-accentsoft text-accent'
              : 'text-muted hover:bg-surface2 hover:text-ink'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function ScorersTable({ scorers, teamView, favoriteTeams }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table
        className={`w-full ${teamView ? 'min-w-[280px]' : 'min-w-[320px]'} text-xs sm:text-sm`}
      >
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-faint sm:text-[11px]">
            <th className="py-1 pr-1 text-right font-semibold sm:pr-2">#</th>
            <th className="py-1 pr-3 text-right font-semibold sm:pr-4">Nr.</th>
            <th className="py-1 text-left font-semibold">Spieler</th>
            {teamView ? null : (
              <th className="hidden py-1 pl-1 text-left font-semibold sm:table-cell sm:pl-2">
                Team
              </th>
            )}
            <th className="py-1 pl-1 text-right font-semibold sm:pl-2" title="Spiele">
              Sp
            </th>
            <th className="py-1 pl-1 text-right font-semibold sm:pl-2">Tore</th>
            <th className="py-1 pl-1 text-right font-semibold sm:pl-2" title="Feldtore (ohne 7m)">
              Feld
            </th>
            <th className="py-1 pl-1 pr-0.5 text-right font-semibold sm:pl-2 sm:pr-0">7m</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((p, i) => {
            const fav = !teamView && isFavoriteTeam(p.team, favoriteTeams)
            return (
              <tr key={`${p.team}|${p.nr}|${p.name}`} className="border-t border-line">
                <td className="py-1 pr-1 text-right tabular-nums text-faint sm:pr-2">{i + 1}</td>
                <td className="py-1 pr-3 text-right tabular-nums text-muted sm:pr-4">{p.nr}</td>
                <td className="py-1 font-medium text-ink">
                  <span className="block max-w-[9rem] truncate sm:max-w-none">{p.name}</span>
                  {teamView ? null : (
                    <span
                      className={`block text-[10px] sm:hidden ${
                        fav ? 'font-medium text-favink' : 'text-muted'
                      }`}
                    >
                      {p.team}
                    </span>
                  )}
                </td>
                {teamView ? null : (
                  <td
                    className={`hidden py-1 pl-1 text-xs sm:table-cell sm:pl-2 ${
                      fav ? 'font-semibold text-favink' : 'text-muted'
                    }`}
                  >
                    {p.team}
                  </td>
                )}
                <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">{p.games}</td>
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
  )
}

function PenaltyCardHeader({ kind, label, last = false }) {
  return (
    <th
      className={`py-1 pl-1 text-right font-semibold sm:pl-2 ${
        last ? 'pr-0.5 sm:pr-0' : ''
      }`}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="inline-flex h-4 items-center justify-center align-middle"
      >
        <CardMark kind={kind} />
      </span>
    </th>
  )
}

function PenaltiesTable({ penalties, teamView, favoriteTeams }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table
        className={`w-full ${teamView ? 'min-w-[320px]' : 'min-w-[380px]'} text-xs sm:text-sm`}
      >
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-faint sm:text-[11px]">
            <th className="py-1 pr-1 text-right font-semibold sm:pr-2">#</th>
            <th className="py-1 pr-3 text-right font-semibold sm:pr-4">Nr.</th>
            <th className="py-1 text-left font-semibold">Spieler</th>
            {teamView ? null : (
              <th className="hidden py-1 pl-1 text-left font-semibold sm:table-cell sm:pl-2">
                Team
              </th>
            )}
            <th className="py-1 pl-1 text-right font-semibold sm:pl-2" title="Spiele">
              Sp
            </th>
            <th className="py-1 pl-1 text-right font-semibold sm:pl-2">Ges.</th>
            <PenaltyCardHeader kind="two" label="2-Minuten-Strafen" />
            <PenaltyCardHeader kind="red" label="Rote Karten" />
            <PenaltyCardHeader kind="yellow" label="Gelbe Karten" />
            <PenaltyCardHeader kind="blue" label="Blaue Karten" last />
          </tr>
        </thead>
        <tbody>
          {penalties.map((p, i) => {
            const fav = !teamView && isFavoriteTeam(p.team, favoriteTeams)
            return (
              <tr key={`${p.team}|${p.nr}|${p.name}`} className="border-t border-line">
                <td className="py-1 pr-1 text-right tabular-nums text-faint sm:pr-2">{i + 1}</td>
                <td className="py-1 pr-3 text-right tabular-nums text-muted sm:pr-4">{p.nr}</td>
                <td className="py-1 font-medium text-ink">
                  <span className="block max-w-[9rem] truncate sm:max-w-none">{p.name}</span>
                  {teamView ? null : (
                    <span
                      className={`block text-[10px] sm:hidden ${
                        fav ? 'font-medium text-favink' : 'text-muted'
                      }`}
                    >
                      {p.team}
                    </span>
                  )}
                </td>
                {teamView ? null : (
                  <td
                    className={`hidden py-1 pl-1 text-xs sm:table-cell sm:pl-2 ${
                      fav ? 'font-semibold text-favink' : 'text-muted'
                    }`}
                  >
                    {p.team}
                  </td>
                )}
                <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">{p.games}</td>
                <td className="py-1 pl-1 text-right font-bold tabular-nums text-ink sm:pl-2">
                  {p.total}
                </td>
                <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">
                  {p.two || ''}
                </td>
                <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">
                  {p.red || ''}
                </td>
                <td className="py-1 pl-1 text-right tabular-nums text-muted sm:pl-2">
                  {p.yellow || ''}
                </td>
                <td className="py-1 pl-1 pr-0.5 text-right tabular-nums text-muted sm:pl-2 sm:pr-0">
                  {p.blue || ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function LeagueStatsScreen({
  status,
  data,
  progress,
  error,
  onReload,
  favoriteTeams,
  teamName = '',
  tab,
  onTabChange,
}) {
  const [localTab, setLocalTab] = useState('scorers')

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

  const teamView = Boolean(teamName)
  const activeTab = tab ?? localTab
  const showScorers = activeTab === 'scorers'
  const rows = showScorers ? data.scorers ?? [] : data.penalties ?? []
  const basis =
    data.withReport < data.totalGames
      ? `Basis: ${data.loadedReports} von ${data.totalGames} Spielen mit Bericht.`
      : null

  const changeTab = (next) => {
    setLocalTab(next)
    onTabChange?.(next)
  }

  return (
    <div className="space-y-4">
      <ProgressBar progress={progress} />
      <StatsTabs tab={activeTab} onChange={changeTab} />

      {data.withReport === 0 ? (
        <StateMessage
          emptyText={
            teamView
              ? 'Für dieses Team liegen noch keine auswertbaren Spielberichte vor.'
              : 'Für diese Liga liegen noch keine auswertbaren Spielberichte vor.'
          }
        />
      ) : rows.length === 0 ? (
        <StateMessage
          emptyText={
            status === 'loading'
              ? showScorers
                ? 'Spielerstatistiken werden ausgewertet …'
                : 'Strafen werden ausgewertet …'
              : showScorers
                ? 'Keine Torschützen gefunden.'
                : 'Keine Strafen gefunden.'
          }
        />
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
            <h2 className="font-head text-base font-bold text-ink">
              {showScorers ? 'Torschützen' : 'Strafen'}
            </h2>
            <span className="text-xs text-muted tabular-nums">
              {rows.length} Spieler · {data.loadedReports} Berichte
            </span>
          </div>

          {showScorers ? (
            <ScorersTable
              scorers={rows}
              teamView={teamView}
              favoriteTeams={favoriteTeams}
            />
          ) : (
            <PenaltiesTable
              penalties={rows}
              teamView={teamView}
              favoriteTeams={favoriteTeams}
            />
          )}

          <p className="mt-2 px-1 text-center text-[11px] text-faint">{basis}</p>
        </section>
      )}
    </div>
  )
}
