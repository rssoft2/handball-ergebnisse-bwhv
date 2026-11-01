import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCachedGymnasium, loadGymnasium } from '../api/h4a.js'
import { useGymResin } from './useGymResin.js'

vi.mock('../api/h4a.js', () => ({
  getCachedGymnasium: vi.fn(),
  loadGymnasium: vi.fn(),
}))

describe('useGymResin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCachedGymnasium.mockReturnValue(null)
  })

  it('loads the resin rule for a gym', async () => {
    loadGymnasium.mockResolvedValue({ wax: 'Haftmittel erlaubt' })

    const { result } = renderHook(() => useGymResin('254'))

    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current).toBe('Haftmittel erlaubt'))
    expect(loadGymnasium).toHaveBeenCalledWith('216', '254')
  })

  it('uses a cached rule immediately', () => {
    getCachedGymnasium.mockReturnValue({ wax: 'Absolutes Haftmittelverbot' })

    const { result } = renderHook(() => useGymResin('254'))

    expect(result.current).toBe('Absolutes Haftmittelverbot')
    expect(loadGymnasium).not.toHaveBeenCalled()
  })
})
