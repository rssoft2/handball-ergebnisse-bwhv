import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TeamStats } from './PlayerStats.jsx'

const team = {
  side: 'home',
  label: 'HSG Ettlingen',
  goals: 3,
  players: [
    { nr: '1', name: 'Ohne Wurf', goals: 0, seven: 0, cards: [] },
    { nr: '2', name: 'Leer', goals: 0, seven: '0/0', cards: [] },
    { nr: '3', name: 'Getroffen', goals: 2, seven: '6/5', cards: [] },
    { nr: '4', name: 'Live verworfen', goals: 1, seven: 0, sevenAttempts: 2, cards: [] },
  ],
}

function sevenCell(name) {
  const row = screen.getByText(name).closest('tr')
  return within(row).getAllByRole('cell')[3]
}

describe('TeamStats', () => {
  it('markiert das 40. Tor je Mannschaft', () => {
    const milestones = [
      { rank: 40, side: true, name: 'Getroffen', nr: '3' },
      { rank: 40, side: false, name: 'Gast', nr: '9' },
    ]

    render(
      <>
        <TeamStats team={team} milestones={milestones} />
        <TeamStats
          team={{
            side: 'away',
            label: 'Gegner',
            goals: 1,
            players: [{ nr: '9', name: 'Gast', goals: 1, seven: 0, cards: [] }],
          }}
          milestones={milestones}
        />
      </>,
    )

    expect(screen.getAllByText(/40\.\s*Tor/)).toHaveLength(2)
  })

  it('lässt die 7m-Anzeige ohne Wurf leer', () => {
    render(<TeamStats team={team} />)
    expect(sevenCell('Ohne Wurf').textContent).toBe('')
    expect(sevenCell('Leer').textContent).toBe('')
  })

  it('zeigt verwandelte/versuchte 7m weiterhin an', () => {
    render(<TeamStats team={team} />)
    expect(sevenCell('Getroffen').textContent).toBe('5/6')
    expect(sevenCell('Live verworfen').textContent).toBe('0/2')
  })
})
