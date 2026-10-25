import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import LiveGamesView from './LiveGamesView.jsx'
import { mockGameLive } from '../test/fixtures.js'

describe('LiveGamesView', () => {
  it('shows live count and game cards', () => {
    render(<LiveGamesView games={[mockGameLive]} status="success" onRetry={vi.fn()} />)
    expect(screen.getByText(/Derzeit ist 1 Spiel live/)).toBeInTheDocument()
    expect(screen.getByText('TV Test')).toBeInTheDocument()
  })

  it('shows empty state when no live games', () => {
    render(<LiveGamesView games={[]} status="success" onRetry={vi.fn()} />)
    expect(screen.getByText(/Derzeit ist kein Spiel live/)).toBeInTheDocument()
  })

  it('forwards onOpenLive and onOpenLeague', async () => {
    const user = userEvent.setup()
    const onOpenLive = vi.fn()
    const onOpenLeague = vi.fn()
    render(<LiveGamesView games={[mockGameLive]} status="success" onRetry={vi.fn()} onOpenLive={onOpenLive} onOpenLeague={onOpenLeague} />)
    await user.click(screen.getByRole('button', { name: /Live-Ticker/i }))
    expect(onOpenLive).toHaveBeenCalledWith(mockGameLive)
    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(onOpenLeague).toHaveBeenCalledWith('124')
  })
})