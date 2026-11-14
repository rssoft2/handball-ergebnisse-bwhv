import { describe, expect, it } from 'vitest'
import { buildActions } from './live.js'

const teams = {
  home: {
    club: 'HSG Ettlingen',
    players: [{ nr: '7', name: 'Max Muster' }],
  },
  away: {
    club: 'SG Gegner',
    players: [{ nr: '9', name: 'Erik Beispiel' }],
  },
}

const goal = (time, kind = 'goal') => ({
  time,
  kind,
  side: 'home',
  nr: '7',
  raw: kind === 'seven' ? 'Erfolgreicher 7m durch die Nummer 7' : 'Tor durch die Nummer 7',
  homeScore: time + 1,
  guestScore: 0,
})

const awayGoal = (time) => ({
  time,
  kind: 'goal',
  side: 'away',
  nr: '9',
  raw: 'Tor durch die Nummer 9',
  homeScore: 0,
  guestScore: time + 1,
})

describe('buildActions', () => {
  it('markiert das 40. Tor einer Mannschaft', () => {
    const actions = Array.from({ length: 40 }, (_, index) => goal(index))

    const result = buildActions(teams, actions)

    expect(result.milestones).toHaveLength(1)
    expect(result.milestones[0]).toMatchObject({
      rank: 40,
      side: true,
      name: 'Max Muster',
      nr: '7',
    })
    expect(result.actions[39].isMilestone).toBe(true)
    expect(result.actions[38].isMilestone).toBe(false)
    expect(result.teams.home.goals).toBe(40)
  })

  it('zählt auch ein 7m-Tor als 40. Tor', () => {
    const actions = [
      ...Array.from({ length: 39 }, (_, index) => goal(index)),
      goal(39, 'seven'),
    ]

    const result = buildActions(teams, actions)

    expect(result.milestones[0]).toMatchObject({ rank: 40, name: 'Max Muster' })
    expect(result.actions[39].isMilestone).toBe(true)
  })

  it('markiert das 40. Tor beider Mannschaften', () => {
    const actions = [
      ...Array.from({ length: 40 }, (_, index) => goal(index)),
      ...Array.from({ length: 40 }, (_, index) => awayGoal(index + 40)),
    ]

    const result = buildActions(teams, actions)

    expect(result.milestones).toHaveLength(2)
    expect(result.milestones.map((milestone) => milestone.side)).toEqual([true, false])
    expect(result.actions[39].isMilestone).toBe(true)
    expect(result.actions[79].isMilestone).toBe(true)
    expect(result.actions[38].isMilestone).toBe(false)
    expect(result.actions[78].isMilestone).toBe(false)
  })

  it('markiert keinen fehlgeschlagenen 7m als 40. Tor', () => {
    const actions = [
      ...Array.from({ length: 40 }, (_, index) => goal(index)),
      {
        time: 40,
        kind: 'missed',
        side: 'home',
        nr: '7',
        raw: '7m-Wurf durch die Nummer 7',
        homeScore: 40,
        guestScore: 0,
      },
    ]

    const result = buildActions(teams, actions)

    expect(result.actions[39].isMilestone).toBe(true)
    expect(result.actions[40].isMilestone).toBe(false)
  })
})
