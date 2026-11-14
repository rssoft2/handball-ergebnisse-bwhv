import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TeamScheduleScreen from './TeamScheduleScreen.jsx'
import { mockGameLive, mockGamePlayed, mockGameUpcoming } from '../test/fixtures.js'

vi.mock('../utils/download.js', () => ({ downloadFile: vi.fn() }))

import { downloadFile } from '../utils/download.js'

const data = {
  live: [mockGameLive],
  played: [mockGamePlayed],
  upcoming: [mockGameUpcoming],
  teamNameMap: {},
  meta: {},
}

describe('TeamScheduleScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('opens the team statistics', async () => {
    const user = userEvent.setup()
    const onOpenStats = vi.fn()

    render(
      <TeamScheduleScreen
        data={data}
        teamName="HSG Ettlingen"
        favoriteTeams={[]}
        onOpenStats={onOpenStats}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Team-Statistik/ }))

    expect(onOpenStats).toHaveBeenCalledTimes(1)
  })

  it('exports the team schedule as a calendar file', async () => {
    const user = userEvent.setup()

    render(
      <TeamScheduleScreen
        data={data}
        teamName="HSG Ettlingen"
        leagueShortName="mb-BL-SR"
        favoriteTeams={[]}
      />,
    )

    const calendarButton = screen.getByRole('button', { name: /Kalender exportieren/ })
    expect(calendarButton.textContent).toBe('')

    await user.click(calendarButton)

    expect(downloadFile).toHaveBeenCalledTimes(1)
    const [filename, content] = downloadFile.mock.calls[0]
    expect(filename).toBe('Spielplan-HSG-Ettlingen.ics')
    expect(content).toContain('BEGIN:VCALENDAR')
    expect(content).toContain('SUMMARY:[mb-BL-SR] HSG Ettlingen – TSV Beispiel')
    expect(content).toContain('SUMMARY:[mb-BL-SR] TV Test – HSG Ettlingen')
    expect(content).not.toContain('32:28')
  })
})
