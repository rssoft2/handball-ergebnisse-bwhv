import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchGymSchedule } from '../api/h4a.js'
import { mondayIsoOf, parseIsoDate } from '../utils/spieltag.js'

function shiftWeeks(iso, delta) {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + delta * 7)
  return mondayIsoOf(date.getTime())
}

// Hallen-Spielplan einer Kalenderwoche. Wird pro Halle neu gemountet (key in der
// aufrufenden Komponente), daher genügt `initialWeekStart` als Startwoche.
export function useGymSchedule(org, gymId, initialWeekStart) {
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart || mondayIsoOf(Date.now()),
  )
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const requestId = useRef(0)

  const load = useCallback(
    async (force = false) => {
      if (!gymId) return
      const id = requestId.current + 1
      requestId.current = id
      setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
      try {
        const data = await fetchGymSchedule(org, gymId, weekStart, force)
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
    [org, gymId, weekStart],
  )

  useEffect(() => {
    if (!gymId) return undefined
    load(false)
    return undefined
    // load hängt bereits von gymId/weekStart ab.
  }, [gymId, weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

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
