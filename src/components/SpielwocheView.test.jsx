import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SpielwocheView from './SpielwocheView.jsx'

const local = (y, m, d, h = 17) => new Date(y, m - 1, d, h).getTime()

function game(id, home, away, dateObj, extra = {}) {
  return {
    id,
    leagueId: 'l1',
    leagueName: 'Bezirksliga',
    home,
    away,
    homeGoals: null,
    awayGoals: null,
    done: false,
    status: 'upcoming',
    dateObj,
    date: '21.10.2026',
    time: '17:00',
    weekday: 'Mi',
    ...extra,
  }
}

const weekStart = '2026-10-19'
const clubs = [
  { clubId: '1', clubName: 'HSG Ettlingen' },
  { clubId: '2', clubName: 'SG Pforzheim/Eutingen' },
]

const data = {
  weekStart,
  games: [
    game('g1', 'HSG Ettlingen', 'TSV Calw', local(2026, 10, 21)),
    game('g2', 'TV Bretten', 'SG Pforzheim/Eutingen 2', local(2026, 10, 24)),
    game('g3', 'SG PF/Eutingen', 'SG Mühlacker', local(2026, 10, 25)),
    game('g4', 'TV Fremd', 'TSG Andere', local(2026, 10, 23)),
    game('g5', 'HSG Ettlingen', 'Nächste Woche', local(2026, 10, 26)),
  ],
}

describe('SpielwocheView', () => {
  it('zeigt Hinweis ohne Favoriten', () => {
    render(<SpielwocheView clubs={[]} teams={[]} status="ready" data={data} />)
    expect(screen.getByText(/keine vereine oder mannschaften als favoriten/i)).toBeInTheDocument()
  })

  it('zeigt nur Spiele der favorisierten Vereine und der aktuellen Woche', () => {
    render(<SpielwocheView clubs={clubs} status="ready" data={data} weekStart={weekStart} />)
    expect(screen.getByText('TSV Calw')).toBeInTheDocument()
    expect(screen.getByText('SG Mühlacker')).toBeInTheDocument()
    expect(screen.getByText('TV Bretten')).toBeInTheDocument()
    expect(screen.queryByText('TV Fremd')).not.toBeInTheDocument()
    expect(screen.queryByText('TSG Andere')).not.toBeInTheDocument()
    expect(screen.queryByText('Nächste Woche')).not.toBeInTheDocument()
  })

  it('matcht SG-Abkürzung und Mannschaftsnummern', () => {
    render(
      <SpielwocheView
        clubs={[{ clubId: '2', clubName: 'SG Pforzheim/Eutingen' }]}
        status="ready"
        data={data}
        weekStart={weekStart}
      />,
    )
    expect(screen.getByText('2 Spiele')).toBeInTheDocument()
    expect(screen.getByText('SG Mühlacker')).toBeInTheDocument()
    expect(screen.queryByText('TSV Calw')).not.toBeInTheDocument()
  })

  it('klappt Gruppen auf und zu', async () => {
    const user = userEvent.setup()
    render(<SpielwocheView clubs={clubs} status="ready" data={data} weekStart={weekStart} />)
    expect(screen.getByText('TSV Calw')).toBeInTheDocument()

    const header = screen.getByRole('button', { name: /HSG Ettlingen 1 Spiel/ })
    await user.click(header)
    expect(screen.queryByText('TSV Calw')).not.toBeInTheDocument()

    await user.click(header)
    expect(screen.getByText('TSV Calw')).toBeInTheDocument()
  })

  it('blättert zwischen Wochen', async () => {
    const user = userEvent.setup()
    const onPrevWeek = vi.fn()
    const onNextWeek = vi.fn()
    render(
      <SpielwocheView
        clubs={clubs}
        status="ready"
        data={data}
        weekStart={weekStart}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
      />,
    )
    expect(screen.getByText('19.10. – 25.10.2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vorherige Woche' }))
    await user.click(screen.getByRole('button', { name: 'Nächste Woche' }))
    expect(onPrevWeek).toHaveBeenCalledTimes(1)
    expect(onNextWeek).toHaveBeenCalledTimes(1)
  })

  it('wählt eine Woche aus dem Dropdown', async () => {
    const user = userEvent.setup()
    const onSelectWeek = vi.fn()
    render(
      <SpielwocheView
        clubs={clubs}
        status="ready"
        data={data}
        weekStart={weekStart}
        weeks={['2026-10-12', weekStart, '2026-10-26']}
        onSelectWeek={onSelectWeek}
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Woche auswählen' })
    expect(select).toHaveValue(weekStart)
    expect(screen.getAllByRole('option')).toHaveLength(3)
    await user.selectOptions(select, '2026-10-26')
    expect(onSelectWeek).toHaveBeenCalledWith('2026-10-26')
  })

  it('zeigt einen Hinweis, wenn keine Spiele in der Woche liegen', () => {
    render(
      <SpielwocheView
        clubs={clubs}
        status="ready"
        data={{ weekStart, games: [game('x', 'TV Fremd', 'TSG Andere', local(2026, 10, 23))] }}
        weekStart={weekStart}
      />,
    )
    expect(screen.getByText(/keine spiele deiner vereine/i)).toBeInTheDocument()
  })
})
