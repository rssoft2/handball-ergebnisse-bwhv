import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GymScheduleScreen from './GymScheduleScreen.jsx'
import { useGymSchedule } from '../hooks/useGymSchedule.js'
import { useGymResin } from '../hooks/useGymResin.js'
import { mockGamePlayed } from '../test/fixtures.js'

vi.mock('../hooks/useGymSchedule.js', () => ({ useGymSchedule: vi.fn() }))
vi.mock('../hooks/useGymResin.js', () => ({ useGymResin: vi.fn() }))

function schedule(overrides = {}) {
  return {
    status: 'ready',
    data: {
      gym: { id: '1234', name: 'Bertha-Benz-Halle', town: 'Pforzheim' },
      games: [mockGamePlayed],
      weekStart: '2026-10-19',
      weeks: ['2026-10-19'],
    },
    error: null,
    weekStart: '2026-10-19',
    weeks: ['2026-10-19'],
    reload: vi.fn(),
    setWeek: vi.fn(),
    prevWeek: vi.fn(),
    nextWeek: vi.fn(),
    ...overrides,
  }
}

describe('GymScheduleScreen', () => {
  beforeEach(() => {
    useGymResin.mockReturnValue(undefined)
    useGymSchedule.mockReturnValue(schedule())
  })

  it('shows the hall, address and games grouped by day', () => {
    render(<GymScheduleScreen gymId="1234" initialWeekStart="2026-10-19" />)
    expect(screen.getByText('Bertha-Benz-Halle')).toBeInTheDocument()
    expect(screen.getAllByText(/Musterstraße 1/).length).toBeGreaterThan(0)
    expect(screen.getByText('HSG Ettlingen')).toBeInTheDocument()
    expect(screen.getByText('32:28')).toBeInTheDocument()
    expect(screen.getByText('Sonntag, 25.10.2026')).toBeInTheDocument()
  })

  it('shows the full league name instead of the abbreviation', () => {
    useGymSchedule.mockReturnValue(
      schedule({
        data: {
          gym: { id: '1234', name: 'Bertha-Benz-Halle', town: 'Pforzheim' },
          games: [{ ...mockGamePlayed, leagueName: 'BLM' }],
          weekStart: '2026-10-19',
          weeks: ['2026-10-19'],
        },
      }),
    )
    render(
      <GymScheduleScreen
        gymId="1234"
        initialWeekStart="2026-10-19"
        leagues={[{ id: '123', name: 'Bezirksliga Männer' }]}
      />,
    )
    expect(screen.getByText('Bezirksliga Männer')).toBeInTheDocument()
    expect(screen.queryByText('BLM')).not.toBeInTheDocument()
  })

  it('keeps the abbreviation when the league is unknown', () => {
    useGymSchedule.mockReturnValue(
      schedule({
        data: {
          gym: { id: '1234', name: 'Bertha-Benz-Halle', town: 'Pforzheim' },
          games: [{ ...mockGamePlayed, leagueName: 'BLM' }],
          weekStart: '2026-10-19',
          weeks: ['2026-10-19'],
        },
      }),
    )
    render(<GymScheduleScreen gymId="1234" initialWeekStart="2026-10-19" leagues={[]} />)
    expect(screen.getByText('BLM')).toBeInTheDocument()
  })

  it('shows an empty hint when the hall has no games that week', () => {
    useGymSchedule.mockReturnValue(
      schedule({
        data: { gym: { id: '1234', name: 'Bertha-Benz-Halle', town: 'Pforzheim' }, games: [], weeks: [] },
      }),
    )
    render(<GymScheduleScreen gymId="1234" initialWeekStart="2026-10-19" />)
    expect(
      screen.getByText(/in dieser Halle keine Spiele angesetzt/i),
    ).toBeInTheDocument()
  })

  it('shows the error state with a retry', () => {
    const reload = vi.fn()
    useGymSchedule.mockReturnValue(schedule({ status: 'error', data: null, error: 'kaputt', reload }))
    render(<GymScheduleScreen gymId="1234" initialWeekStart="2026-10-19" />)
    expect(screen.getByText(/kaputt/)).toBeInTheDocument()
  })
})
