import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchScheduleByDate } from '../api/h4a.js'
import { weekOf } from '../utils/spieltag.js'

function toIso(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIso(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function mondayIsoOf(date) {
  return toIso(weekOf(date.getTime()).start)
}

function shiftWeeks(iso, delta) {
  const date = parseIso(iso)
  date.setDate(date.getDate() + delta * 7)
  return mondayIsoOf(date)
}

// Wochenplan aller Spiele (Mo–So) für den Spielwoche-Modus im Spielplan-Tab.
// Ein Request pro Woche; kein Polling, nur bei Bedarf/Blättern.
export function useScheduleWeek(org, region, { enabled = true } = {}) {
  const [weekStart, setWeekStart] = useState(() => mondayIsoOf(new Date()))
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const requestId = useRef(0)

  const load = useCallback(
    async (force = false) => {
      const id = requestId.current + 1
      requestId.current = id
      setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
      try {
        const data = await fetchScheduleByDate(org, region, weekStart, force)
        if (requestId.current !== id) return
        setState({ status: 'ready', data, error: null })
      } catch (error) {
        if (requestId.current !== id) return
        setState((prev) => ({
          status: prev.data ? 'ready' : 'error',
          data: prev.data,
          error: prev.data ? null : error?.message ?? String(error),
        }))
      }
    },
    [org, region, weekStart],
  )

  useEffect(() => {
    if (!enabled) return undefined
    load(false)
    return undefined
  }, [enabled, load])

  const goWeek = useCallback((delta) => {
    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
    setWeekStart((prev) => shiftWeeks(prev, delta))
  }, [])

  const setWeek = useCallback((iso) => {
    if (!iso) return
    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
    setWeekStart(iso)
  }, [])

  return {
    ...state,
    weekStart,
    weeks: state.data?.weeks ?? [],
    reload: () => load(true),
    prevWeek: () => goWeek(-1),
    nextWeek: () => goWeek(1),
    setWeek,
  }
}
