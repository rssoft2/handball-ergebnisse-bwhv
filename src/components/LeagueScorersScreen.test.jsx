import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LeagueScorersScreen from './LeagueScorersScreen.jsx'

const data = {
  totalGames: 4,
  withReport: 4,
  loadedReports: 4,
  scorers: [
    { name: 'Max Muster', team: 'HSG Ettlingen', nr: '7', games: 4, goals: 12, seven: 2 },
  ],
}

describe('LeagueScorersScreen', () => {
  it('zeigt in der Liga-Ansicht die Team-Spalte', () => {
    render(<LeagueScorersScreen status="ready" data={data} favoriteTeams={[]} />)

    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Max Muster')).toBeInTheDocument()
  })

  it('blendet im Team-Modus die Team-Spalte aus', () => {
    render(
      <LeagueScorersScreen
        status="ready"
        data={data}
        favoriteTeams={[]}
        teamName="HSG Ettlingen"
      />,
    )

    expect(screen.queryByText('Team')).not.toBeInTheDocument()
    expect(screen.getByText('Max Muster')).toBeInTheDocument()
  })

  it('zeigt im Team-Modus einen teambezogenen Leerzustand', () => {
    render(
      <LeagueScorersScreen
        status="ready"
        data={{ totalGames: 2, withReport: 0, loadedReports: 0, scorers: [] }}
        favoriteTeams={[]}
        teamName="HSG Ettlingen"
      />,
    )

    expect(
      screen.getByText('Für dieses Team liegen noch keine auswertbaren Spielberichte vor.'),
    ).toBeInTheDocument()
  })
})
