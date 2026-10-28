import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import MatchCard from './MatchCard.jsx'
import { mockGamePlayed, mockGameLive, mockGameUpcoming } from '../test/fixtures.js'

describe('MatchCard', () => {
  it('shows scores and team names for finished game', () => {
    render(<MatchCard game={mockGamePlayed} />)
    expect(screen.getByText('HSG Ettlingen')).toBeInTheDocument()
    expect(screen.getByText('TSV Beispiel')).toBeInTheDocument()
    expect(screen.getByText('32:28')).toBeInTheDocument()
    expect(screen.getByText('(16:14)')).toBeInTheDocument()
  })

  it('calls onOpenReport for statistik and verlauf', async () => {
    const user = userEvent.setup()
    const onOpenReport = vi.fn()
    render(<MatchCard game={mockGamePlayed} onOpenReport={onOpenReport} />)
    await user.click(screen.getByRole('button', { name: 'Statistik' }))
    await user.click(screen.getByRole('button', { name: 'Verlauf' }))
    expect(onOpenReport).toHaveBeenCalledWith(mockGamePlayed, 'stats')
    expect(onOpenReport).toHaveBeenCalledWith(mockGamePlayed, 'timeline')
  })

  it('calls onOpenLeague from Tabelle button', async () => {
    const user = userEvent.setup()
    const onOpenLeague = vi.fn()
    render(<MatchCard game={mockGamePlayed} onOpenLeague={onOpenLeague} />)
    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(onOpenLeague).toHaveBeenCalledWith('123')
  })

  it('shows the gym with full address as navigation link', () => {
    render(<MatchCard game={mockGamePlayed} />)
    const link = screen.getByRole('link', {
      name: /Sporthalle, Musterstraße 1, 76275 Ettlingen/,
    })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Sporthalle%2C%20Musterstra%C3%9Fe%201%2C%2076275%2C%20Ettlingen',
    )
  })

  it('shows PDF link for finished game with report', () => {
    render(<MatchCard game={mockGamePlayed} />)
    const link = screen.getByRole('link', { name: 'PDF' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows live ticker button and calls onOpenLive', async () => {
    const user = userEvent.setup()
    const onOpenLive = vi.fn()
    render(<MatchCard game={mockGameLive} onOpenLive={onOpenLive} />)
    expect(screen.getByText(/Live seit/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Live-Ticker/i }))
    expect(onOpenLive).toHaveBeenCalledWith(mockGameLive)
  })

  it('highlights favorite team', () => {
    render(<MatchCard game={mockGamePlayed} favoriteTeams={['HSG Ettlingen']} />)
    const team = screen.getByText('HSG Ettlingen')
    expect(team).toHaveClass('font-bold')
  })

  it('does not show report buttons for upcoming game without report', () => {
    render(<MatchCard game={mockGameUpcoming} />)
    expect(screen.queryByRole('button', { name: 'Statistik' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verlauf' })).not.toBeInTheDocument()
  })
})