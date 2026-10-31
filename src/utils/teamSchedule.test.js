import { describe, expect, it } from 'vitest'
import { scheduleForTeam } from './teamSchedule.js'

function game(id, status, dateObj, home, away) {
  return { id, status, dateObj, home, away }
}

const data = {
  teamNameMap: {
    'TSV Heiningen': 'TSV Heiningen 1892',
    'TV N\'hausen/E.': 'TV 1893 Neuhausen/E.',
  },
  live: [game('l1', 'live', 5, 'TV N\'hausen/E.', 'TSV Heiningen')],
  played: [
    game('p1', 'finished', 2, 'TSV Heiningen', 'TV N\'hausen/E.'),
    game('p2', 'finished', 3, 'SG A', 'SG B'),
    game('p3', 'finished', 4, 'SG C', 'TSV Heiningen'),
    game('p1', 'finished', 2, 'TSV Heiningen', 'TV N\'hausen/E.'),
  ],
  upcoming: [
    game('u1', 'upcoming', 7, 'TSV Heiningen', 'SG A'),
    game('u2', 'upcoming', 8, 'SG B', 'SG C'),
  ],
}

describe('scheduleForTeam', () => {
  it('matches short game names to the long standings name', () => {
    const schedule = scheduleForTeam(data, 'TSV Heiningen 1892')

    expect(schedule.live.map((g) => g.id)).toEqual(['l1'])
    expect(schedule.upcoming.map((g) => g.id)).toEqual(['u1'])
    expect(schedule.played.map((g) => g.id)).toEqual(['p3', 'p1'])
  })

  it('filters other teams and removes duplicate games', () => {
    const schedule = scheduleForTeam(data, 'TSV Heiningen 1892')
    const ids = [...schedule.live, ...schedule.upcoming, ...schedule.played].map((g) => g.id)

    expect(ids).toEqual(['l1', 'u1', 'p3', 'p1'])
    expect(ids).not.toContain('p2')
    expect(ids).not.toContain('u2')
  })

  it('returns empty lists without a team or data', () => {
    expect(scheduleForTeam(data, '')).toEqual({ live: [], upcoming: [], played: [] })
    expect(scheduleForTeam(null, 'TSV Heiningen 1892')).toEqual({
      live: [],
      upcoming: [],
      played: [],
    })
  })
})
