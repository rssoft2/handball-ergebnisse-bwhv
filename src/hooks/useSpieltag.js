import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchClubsSchedules } from '../api/h4a.js'

// Spielpläne mehrerer Favoriten-Vereine laden (Spieltag-Tab). Kein Polling –
// nur bei Bedarf bzw. manuell aktualisieren, um die API zu schonen.
export function useSpieltag(org, clubs, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const inFlight = useRef(false)
  const clubsRef = useRef(clubs)
  clubsRef.current = clubs
  const key = clubs.map((c) => c.clubId).join(',')

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const data = await fetchClubsSchedules(org, clubsRef.current)
      setState({ status: 'ready', data, error: null })
    } catch (error) {
      setState((prev) =>
        prev.data ? prev : { status: 'error', data: null, error: error?.message ?? String(error) },
      )
    } finally {
      inFlight.current = false
    }
  }, [org, key])

  useEffect(() => {
    if (!enabled) return undefined
    if (!clubsRef.current.length) {
      setState({ status: 'ready', data: { clubs: [], throttled: false }, error: null })
      return undefined
    }
    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
    load()
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load])

  return { ...state, reload: () => load() }
}
