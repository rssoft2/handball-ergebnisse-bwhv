import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchGyms, searchTeams } from '../api/h4a.js'
import LeagueList from './LeagueList.jsx'

vi.mock('../api/h4a.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, searchGyms: vi.fn(), searchTeams: vi.fn() }
})

const leagues = [
  {
    id: 'state',
    name: 'Oberliga',
    sname: 'OL',
    level: 'Oberliga',
    ageGroup: 'Männer',
    section: 'Männer',
    region: '',
  },
  {
    id: 'regional',
    name: 'Bezirksliga 246',
    sname: 'bBL',
    level: 'Bezirksliga',
    ageGroup: 'Männer',
    section: 'Männer',
    region: '246',
  },
]

function renderList(props = {}) {
  const toggleTeam = vi.fn()
  const onBezirkChange = vi.fn()
  render(
    <LeagueList
      leagues={leagues}
      status="ready"
      error={null}
      onSelect={() => {}}
      onRetry={() => {}}
      tab="browse"
      onTabChange={() => {}}
      bezirk="246"
      onBezirkChange={onBezirkChange}
      favorites={{ leagues: [], clubs: [], teams: [] }}
      favoriteTeams={[]}
      liveGames={[]}
      liveStatus="ready"
      liveError={null}
      onRetryLive={() => {}}
      onOpenLive={() => {}}
      weekStatus="idle"
      weekData={null}
      weekError={null}
      onRetryWeek={() => {}}
      weekStart="2026-11-16"
      weeks={[]}
      onSelectWeek={() => {}}
      onPrevWeek={() => {}}
      onNextWeek={() => {}}
      onOpenReport={() => {}}
      onOpenLeague={() => {}}
      onOpenGym={() => {}}
      isLeagueFavorite={() => false}
      isClubFavorite={() => false}
      isTeamFavorite={() => false}
      toggleLeague={() => {}}
      toggleClub={() => {}}
      toggleTeam={toggleTeam}
      onMoveClub={() => {}}
      {...props}
    />,
  )
  return { toggleTeam, onBezirkChange }
}

beforeEach(() => {
  vi.mocked(searchGyms).mockReset().mockResolvedValue([])
  vi.mocked(searchTeams).mockReset().mockResolvedValue({ clubs: [], teams: [], throttled: false })
})

describe('LeagueList Bezirksauswahl', () => {
  it('zeigt den Bezirk und meldet Änderungen', async () => {
    const user = userEvent.setup()
    const { onBezirkChange } = renderList()

    const select = screen.getByLabelText('Bezirk')
    expect(select).toHaveValue('246')
    expect(screen.getByRole('option', { name: 'Schwarzwald-Rhein' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bodensee-Neckar' })).toBeInTheDocument()

    await user.selectOptions(select, '221')
    expect(onBezirkChange).toHaveBeenCalledWith('221')
  })

  it('filtert Vereine und Mannschaften auf den Bezirk und landesweite Ligen', async () => {
    const user = userEvent.setup()
    vi.mocked(searchTeams).mockResolvedValue({
      clubs: [
        { clubId: 'c1', clubName: 'Verein Im Bezirk' },
        { clubId: 'c2', clubName: 'Verein Anderswo' },
      ],
      teams: [
        {
          teamName: 'Team Im Bezirk',
          clubId: 'c1',
          leagueId: 'regional',
          leagueName: 'Bezirksliga 246',
          region: '246',
        },
        {
          teamName: 'Team Landesweit',
          clubId: 'c1',
          leagueId: 'state',
          leagueName: 'Oberliga',
          region: '',
        },
        {
          teamName: 'Team Anderswo',
          clubId: 'c2',
          leagueId: '221',
          leagueName: 'Bezirksliga 221',
          region: '221',
        },
      ],
      throttled: false,
    })
    const { toggleTeam } = renderList()

    await user.type(screen.getByRole('searchbox'), 'Verein')

    await waitFor(() => expect(screen.getByText('Team Im Bezirk')).toBeInTheDocument())
    expect(screen.getByText('Team Landesweit')).toBeInTheDocument()
    expect(screen.queryByText('Team Anderswo')).not.toBeInTheDocument()
    expect(screen.getByText('Verein Im Bezirk')).toBeInTheDocument()
    expect(screen.queryByText('Verein Anderswo')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Team Landesweit zu Favoriten hinzufügen' }),
    )
    expect(toggleTeam).toHaveBeenCalledWith(expect.objectContaining({ region: '' }))
  })
})
