import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchScheduleByDate } from './h4a.js'

function payload(id) {
  return {
    content: {
      classes: [
        {
          gClassID: `L-${id}`,
          gClassGender: 'm',
          gClassAGsDesc: 'M',
          gClassLname: `Liga ${id}`,
          gClassLevelName: 'Oberliga',
          games: [
            {
              gID: `game-${id}`,
              gDate: '2026-11-21',
              gTime: '15:00:00',
              gHomeTeam: 'Heim',
              gGuestTeam: 'Gast',
            },
          ],
        },
      ],
    },
    menu: { dt: { list: { '2026-11-16': 'KW 47' } } },
  }
}

describe('fetchScheduleByDate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lädt landesweit und je Bezirk nacheinander und führt die Spiele zusammen', async () => {
    const calls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        const parsed = new URL(url)
        const region = parsed.searchParams.get('o') || ''
        calls.push(parsed)
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify([payload(region || 'state')]),
        }
      }),
    )

    const dateIso = '2026-11-16'
    const result = await fetchScheduleByDate('216', ['246', '221'], dateIso)

    expect(calls).toHaveLength(3)
    expect(calls.map((url) => url.searchParams.get('o') || '')).toEqual([
      '',
      '221',
      '246',
    ])
    for (const url of calls) {
      expect(url.searchParams.get('cmd')).toBe('po')
      expect(url.searchParams.get('og')).toBe('216')
      expect(url.searchParams.get('do')).toBe(dateIso)
    }
    expect(result.games.map((game) => game.id)).toEqual([
      'game-221',
      'game-246',
      'game-state',
    ])
    expect(result.weeks).toEqual(['2026-11-16'])
    expect(window.localStorage.getItem('h4a:cache:v8:week:216:221+246:2026-11-16')).not.toBeNull()
  })
})
