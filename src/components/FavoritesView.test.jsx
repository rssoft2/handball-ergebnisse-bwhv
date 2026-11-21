import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchClubTeams } from '../api/h4a.js'
import FavoritesView from './FavoritesView.jsx'

vi.mock('../api/h4a.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetchClubTeams: vi.fn() }
})

const favorites = {
  leagues: [],
  clubs: [
    { clubId: '1', clubName: 'HSG Ettlingen' },
    { clubId: '2', clubName: 'TV Malsch' },
  ],
  teams: [],
}

beforeEach(() => {
  vi.mocked(fetchClubTeams).mockReset()
})

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

describe('Favoriten aus mehreren Bezirken', () => {
  it('sortiert fremde Ligen anhand gespeicherter Metadaten', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchClubTeams).mockResolvedValue([
      {
        teamName: 'Mannschaft A',
        leagueId: '221-a',
        leagueName: 'Bezirksliga',
        leagueLevel: 'Bezirksliga',
        ageGroup: 'Männer',
        section: 'Männer',
        region: '221',
      },
      {
        teamName: 'Mannschaft B',
        leagueId: '246-b',
        leagueName: 'Oberliga',
        leagueLevel: 'Oberliga',
        ageGroup: 'Männer',
        section: 'Männer',
        region: '246',
      },
    ])

    render(
      <FavoritesView
        favorites={{
          leagues: [],
          clubs: [{ clubId: 'fremd', clubName: 'Fremder Verein', region: '221' }],
          teams: [],
        }}
        leagues={[]}
        onSelect={() => {}}
        onToggleLeague={() => {}}
        onToggleClub={() => {}}
        onToggleTeam={() => {}}
        onMoveClub={() => {}}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: /Fremder Verein/ })[0])
    const rows = await screen.findAllByRole('button', { name: /Mannschaft [AB]/ })
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Mannschaft B'),
      expect.stringContaining('Mannschaft A'),
    ])
  })
})
