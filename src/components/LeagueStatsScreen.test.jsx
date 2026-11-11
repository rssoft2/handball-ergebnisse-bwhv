import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LeagueStatsScreen from './LeagueStatsScreen.jsx'

const data = {
  totalGames: 4,
  withReport: 4,
  loadedReports: 4,
  scorers: [
    { name: 'Max Muster', team: 'HSG Ettlingen', nr: '7', games: 4, goals: 12, seven: 2 },
  ],
  penalties: [
    {
      name: 'Erik Beispiel',
      team: 'SG Pforzheim/Eutingen',
      nr: '9',
      games: 3,
      yellow: 2,
      two: 1,
      red: 0,
      blue: 0,
      total: 3,
    },
  ],
}

describe('LeagueStatsScreen', () => {
  it('zeigt in der Liga-Ansicht die Team-Spalte', () => {
    render(<LeagueStatsScreen status="ready" data={data} favoriteTeams={[]} />)

    expect(screen.getByRole('tab', { name: 'Tore' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Max Muster')).toBeInTheDocument()
    expect(screen.getByTitle('Tore pro Spiel')).toBeInTheDocument()
    expect(screen.getByText('3,0')).toBeInTheDocument()
  })

  it('wechselt auf die Strafen-Tabelle', () => {
    render(<LeagueStatsScreen status="ready" data={data} favoriteTeams={[]} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Strafen' }))

    expect(screen.getByRole('heading', { name: 'Strafen' })).toBeInTheDocument()
    expect(screen.getByText('Erik Beispiel')).toBeInTheDocument()
    expect(screen.getByTitle('Gelbe Karten')).toBeInTheDocument()
    expect(screen.getByTitle('2-Minuten-Strafen')).toBeInTheDocument()
    expect(screen.getByTitle('Rote Karten')).toBeInTheDocument()
    expect(screen.getByTitle('Blaue Karten')).toBeInTheDocument()

    const headers = screen
      .getAllByRole('columnheader')
      .map((th) => th.getAttribute('title') || th.textContent.trim())
    expect(headers.slice(-5)).toEqual([
      'Ges.',
      '2-Minuten-Strafen',
      'Rote Karten',
      'Gelbe Karten',
      'Blaue Karten',
    ])
  })

  it('blendet im Team-Modus die Team-Spalte in beiden Tabs aus', () => {
    render(
      <LeagueStatsScreen
        status="ready"
        data={data}
        favoriteTeams={[]}
        teamName="HSG Ettlingen"
      />,
    )

    expect(screen.queryByText('Team')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Strafen' }))

    expect(screen.queryByText('Team')).not.toBeInTheDocument()
    expect(screen.getByText('Erik Beispiel')).toBeInTheDocument()
  })

  it('zeigt im Team-Modus einen teambezogenen Leerzustand', () => {
    render(
      <LeagueStatsScreen
        status="ready"
        data={{ totalGames: 2, withReport: 0, loadedReports: 0, scorers: [], penalties: [] }}
        favoriteTeams={[]}
        teamName="HSG Ettlingen"
      />,
    )

    expect(
      screen.getByText('Für dieses Team liegen noch keine auswertbaren Spielberichte vor.'),
    ).toBeInTheDocument()
  })

  it('zeigt einen Leerzustand für Strafen', () => {
    render(
      <LeagueStatsScreen
        status="ready"
        data={{ ...data, penalties: [] }}
        favoriteTeams={[]}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Strafen' }))

    expect(screen.getByText('Keine Strafen gefunden.')).toBeInTheDocument()
  })
})
