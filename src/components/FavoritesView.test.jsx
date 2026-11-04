import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FavoritesView from './FavoritesView.jsx'

const favorites = {
  leagues: [],
  clubs: [
    { clubId: '1', clubName: 'HSG Ettlingen' },
    { clubId: '2', clubName: 'TV Malsch' },
  ],
  teams: [],
}

function renderView(onMoveClub = vi.fn()) {
  render(
    <FavoritesView
      favorites={favorites}
      onSelect={() => {}}
      onToggleLeague={() => {}}
      onToggleClub={() => {}}
      onToggleTeam={() => {}}
      onMoveClub={onMoveClub}
    />,
  )
  return onMoveClub
}

describe('FavoritesView Sortier-Modus', () => {
  it('verschiebt einen Verein über die Pfeile', async () => {
    const user = userEvent.setup()
    const onMoveClub = renderView()

    await user.click(screen.getByRole('button', { name: 'Sortier-Modus starten' }))
    await user.click(screen.getByRole('button', { name: /TV Malsch nach oben verschieben/i }))

    expect(onMoveClub).toHaveBeenCalledWith('2', -1)
  })

  it('deaktiviert die Pfeile am Anfang und Ende', async () => {
    const user = userEvent.setup()
    renderView()

    await user.click(screen.getByRole('button', { name: 'Sortier-Modus starten' }))

    expect(
      screen.getByRole('button', { name: /HSG Ettlingen nach oben verschieben/i }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /TV Malsch nach unten verschieben/i }),
    ).toBeDisabled()
  })
})
