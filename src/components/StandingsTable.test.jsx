import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StandingsTable from './StandingsTable.jsx'
import { mockStandings } from '../test/fixtures.js'

const formByTeam = {
  'HSG Ettlingen': ['S', 'S', 'U', 'S', 'N'],
}

describe('StandingsTable', () => {
  it('shows points as plus:minus and rank', () => {
    render(<StandingsTable rows={mockStandings} formByTeam={formByTeam} favoriteTeams={[]} />)
    expect(screen.getByText('17:3')).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getByText('HSG Ettlingen')).toBeInTheDocument()
  })

  it('shows form badges', () => {
    render(<StandingsTable rows={mockStandings} formByTeam={formByTeam} favoriteTeams={[]} />)
    expect(screen.getAllByText('S').length).toBeGreaterThan(0)
    expect(screen.getAllByText('U').length).toBeGreaterThan(0)
    expect(screen.getAllByText('N').length).toBeGreaterThan(0)
  })

  it('highlights favorite team', () => {
    render(<StandingsTable rows={mockStandings} formByTeam={formByTeam} favoriteTeams={['HSG Ettlingen']} />)
    const team = screen.getByText('HSG Ettlingen')
    expect(team).toHaveClass('font-bold')
  })

  it('opens the team schedule when clicking a team name', async () => {
    const user = userEvent.setup()
    const onSelectTeam = vi.fn()
    render(
      <StandingsTable
        rows={mockStandings}
        formByTeam={formByTeam}
        favoriteTeams={[]}
        onSelectTeam={onSelectTeam}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'HSG Ettlingen' }))

    expect(onSelectTeam).toHaveBeenCalledWith('HSG Ettlingen')
  })
})