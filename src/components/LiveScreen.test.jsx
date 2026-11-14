import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLive } from '../hooks/useLive.js'
import LiveScreen from './LiveScreen.jsx'

vi.mock('../hooks/useLive.js', () => ({ useLive: vi.fn() }))

const data = {
  info: {
    league: 'Bezirksliga',
    home: 'HSG Ettlingen',
    away: 'SG Gegner',
    datetime: '2026-11-14 19:30:00',
    venue: 'Sporthalle',
    town: 'Ettlingen',
    referees: [],
  },
  teams: {
    home: { club: 'HSG Ettlingen', goals: 46, players: [] },
    away: { club: 'SG Gegner', goals: 51, players: [] },
  },
  actions: [
    {
      time: 1900,
      kind: 'goal',
      side: 'away',
      nr: '9',
      homeScore: 45,
      guestScore: 51,
      message: 'Tor für Gast durch die Nummer 9 Erik Beispiel',
      isMilestone: true,
      milestoneRank: 40,
    },
    {
      time: 1920,
      kind: 'goal',
      side: 'home',
      nr: '7',
      homeScore: 46,
      guestScore: 51,
      message: 'Tor für Heim durch die Nummer 7 Max Muster',
      isMilestone: true,
      milestoneRank: 40,
    },
  ],
  milestones: [
    { rank: 40, side: false, name: 'Erik Beispiel', nr: '9' },
    { rank: 40, side: true, name: 'Max Muster', nr: '7' },
  ],
}

describe('LiveScreen', () => {
  beforeEach(() => {
    useLive.mockReturnValue({ status: 'ok', data })
  })

  it('zeigt das 40. Tor beider Mannschaften im Live-Ticker', () => {
    render(
      <LiveScreen
        game={{ token: 'test', home: 'HSG Ettlingen', away: 'SG Gegner' }}
        favoriteTeams={[]}
      />,
    )

    expect(screen.getAllByText(/40\.\s*Tor/)).toHaveLength(2)
    expect(
      screen.getByText('Tor für Gast durch die Nummer 9 Erik Beispiel'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tor für Heim durch die Nummer 7 Max Muster'),
    ).toBeInTheDocument()
  })
})
