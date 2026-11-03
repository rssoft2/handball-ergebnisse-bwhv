import { describe, expect, it } from 'vitest'
import {
  gamesInRange,
  isoDate,
  mondayIsoOf,
  parseIsoDate,
  weekOf,
  weekLabel,
} from './spieltag.js'

const local = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('weekOf', () => {
  it('beginnt am Montag und endet am darauffolgenden Montag', () => {
    const sunday = weekOf(local(2026, 10, 25))
    expect(sunday.start.getDate()).toBe(19)
    expect(sunday.start.getMonth()).toBe(9)
    expect(sunday.end.getDate()).toBe(26)
    expect(sunday.end.getMonth()).toBe(9)
  })

  it('bleibt für einen Montag bei derselben Woche', () => {
    const monday = weekOf(local(2026, 10, 19))
    expect(monday.start.getDate()).toBe(19)
    expect(monday.end.getDate()).toBe(26)
  })
})

describe('weekLabel', () => {
  it('formatiert Montag bis Sonntag', () => {
    expect(weekLabel(weekOf(local(2026, 10, 25)))).toBe('19.10. – 25.10.2026')
  })
})

describe('gamesInRange', () => {
  const range = weekOf(local(2026, 10, 25))
  const games = [
    { id: 'before', dateObj: local(2026, 10, 18) },
    { id: 'monday', dateObj: local(2026, 10, 19, 0) },
    { id: 'sunday', dateObj: local(2026, 10, 25, 23) },
    { id: 'next', dateObj: local(2026, 10, 26, 0) },
  ]

  it('liefert nur Spiele der Woche (Start inklusiv, Ende exklusiv)', () => {
    expect(gamesInRange(games, range).map((g) => g.id)).toEqual(['monday', 'sunday'])
  })
})

describe('isoDate / parseIsoDate', () => {
  it('formatiert und parst ISO-Daten ohne Zeitzonenverschiebung', () => {
    expect(isoDate(local(2026, 11, 2))).toBe('2026-11-02')
    const parsed = parseIsoDate('2026-11-02')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(10)
    expect(parsed.getDate()).toBe(2)
  })
})

describe('mondayIsoOf', () => {
  it('liefert den Montag der Woche', () => {
    expect(mondayIsoOf(local(2026, 10, 25))).toBe('2026-10-19')
    expect(mondayIsoOf(local(2026, 10, 19))).toBe('2026-10-19')
  })
})
