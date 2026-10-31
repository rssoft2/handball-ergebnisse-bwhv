import { CardsCell } from './ReportCards.jsx'

// Die Berichtsspalte „7m/ Tore" liefert "Versuche/verwandelte" (z. B. "6/5");
// angezeigt als "verwandelte/Versuche", also z. B. "5/6".
function sevenValue(seven) {
  if (seven == null || seven === '') return ''
  const m = String(seven).match(/^(\d+)\s*\/\s*(\d+)$/)
  if (m) {
    if (Number(m[1]) === 0 && Number(m[2]) === 0) return ''
    return `${m[2]}/${m[1]}`
  }
  if (Number(seven) === 0) return ''
  return seven
}

function isMilestonePlayer(team, player, milestone) {
  if (!milestone) return false
  if (milestone.side === true && team.side !== 'home') return false
  if (milestone.side === false && team.side !== 'away') return false
  return player.name === milestone.name && player.nr === milestone.nr
}

// Spielerstatistik-Tabelle einer Mannschaft (Nr., Spieler, Tore, 7m, Karten).
// Wird im vollständigen Spielbericht und in der Live-Aufstellung verwendet.
export function TeamStats({ team, milestone, favorite }) {
  const role = team.side === 'home' ? 'Heim' : 'Gast'
  return (
    <section className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3
          className={`font-head text-sm font-bold ${favorite ? 'text-favink' : 'text-ink'}`}
        >
          {team.label}
        </h3>
        <span className="text-xs text-muted">
          {role} · {team.goals} Tore
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-faint">
            <th className="w-8 py-1 text-left font-medium">Nr.</th>
            <th className="py-1 text-left font-medium">Spieler</th>
            <th className="w-12 py-1 text-right font-medium">Tore</th>
            <th className="w-12 py-1 text-right font-medium" title="7m (verwandelte/Versuche)">
              7m
            </th>
            <th className="w-24 py-1 text-right font-medium">Karten</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => {
            const milestoneRow = isMilestonePlayer(team, p, milestone)
            return (
              <tr
                key={`${p.nr}-${p.name}`}
                className={`border-t border-line ${milestoneRow ? 'bg-accentsoft' : ''}`}
              >
                <td className="py-1 tabular-nums text-faint">{p.nr}</td>
                <td className="py-1 text-ink">
                  <span className={milestoneRow ? 'font-bold text-accent' : ''}>{p.name}</span>
                  {milestoneRow ? (
                    <span className="ml-1 inline-block whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 align-middle text-[10px] font-bold text-accentink">
                      {milestone.rank}.&nbsp;Tor
                    </span>
                  ) : null}
                </td>
                <td className="py-1 text-right font-semibold tabular-nums text-ink">
                  {p.goals || ''}
                </td>
                <td className="py-1 text-right tabular-nums text-muted">
                  {p.sevenAttempts
                    ? `${p.seven || 0}/${p.sevenAttempts}`
                    : sevenValue(p.seven)}
                </td>
                <td className="py-1 text-right">
                  <CardsCell cards={p.cards} />
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-semibold text-ink">
            <td className="py-1" />
            <td className="py-1">Gesamt</td>
            <td className="py-1 text-right tabular-nums">{team.goals}</td>
            <td className="py-1" />
            <td className="py-1" />
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
