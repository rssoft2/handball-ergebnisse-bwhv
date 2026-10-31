import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TeamScheduleScreen from './TeamScheduleScreen.jsx'
import { mockGameLive, mockGamePlayed, mockGameUpcoming } from '../test/fixtures.js'

const data = {
  live: [mockGameLive],
  played: [mockGamePlayed],
  upcoming: [mockGameUpcoming],
  teamNameMap: {},
  meta: {},
}

describe('TeamScheduleScreen', () => {
  it('shows only the selected team in upcoming games and results', () => {
    render(
      <TeamScheduleScreen data={data} teamName="HSG Ettlingen" favoriteTeams={[]} />,
    )

    expect(screen.getByRole('heading', { name: 'Kommende Spiele' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ergebnisse' })).toBeInTheDocument()
    expect(screen.getAllByText('HSG Ettlingen')).toHaveLength(2)
    expect(screen.queryByText('SG A')).not.toBeInTheDocument()
    expect(screen.queryByText('SG B')).not.toBeInTheDocument()
  })

  it('shows an empty state when the team has no games', () => {
    render(<TeamScheduleScreen data={data} teamName="Unbekannt" favoriteTeams={[]} />)

    expect(screen.getByText('Keine Spiele für dieses Team gefunden.')).toBeInTheDocument()
  })
})
