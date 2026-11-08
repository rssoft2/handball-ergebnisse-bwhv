import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./h4a.js', () => ({ fetchLeague: vi.fn() }))
vi.mock('./reports.js', () => ({ getCachedReport: vi.fn(), getReport: vi.fn() }))

import { fetchLeagueStats } from './leagueStats.js'
import { fetchLeague } from './h4a.js'

describe('fetchLeagueStats cache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('sortiert gecachte Strafen mit der aktuellen Reihenfolge', async () => {
    fetchLeague.mockResolvedValue({
      played: [{ done: true, reportId: 'r1' }],
      teamNameMap: {},
    })
    localStorage.setItem(
      'h4a:leaguestats:v4:216:123',
      JSON.stringify({
        t: Date.now(),
        signature: 'r1',
        v: {
          leagueId: '123',
          totalGames: 1,
          withReport: 1,
          loadedReports: 1,
          failedReports: 0,
          complete: true,
          scorers: [],
          penalties: [
            {
              name: 'Felix Reichert',
              team: 'TV 1895 Flein',
              nr: '23',
              games: 7,
              yellow: 1,
              two: 8,
              red: 2,
              blue: 0,
              total: 11,
            },
            {
              name: 'Lars Knaus',
              team: 'Saase3 Leutershausen Handball 2',
              nr: '21',
              games: 7,
              yellow: 2,
              two: 9,
              red: 0,
              blue: 0,
              total: 11,
            },
            {
              name: 'Fabian Mutschler',
              team: 'SG Kenzingen/Herbolzheim',
              nr: '9',
              games: 8,
              yellow: 3,
              two: 8,
              red: 3,
              blue: 0,
              total: 14,
            },
          ],
        },
      }),
    )

    const result = await fetchLeagueStats('216', '123')

    expect(result.penalties.map((p) => p.name)).toEqual([
      'Fabian Mutschler',
      'Lars Knaus',
      'Felix Reichert',
    ])
  })
})
