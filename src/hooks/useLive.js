import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveSnapshot, LIVE_POLL_MS } from '../api/live.js'

// Lädt den Live-Ticker eines Spiels und aktualisiert ihn im Intervall
// (wie der offizielle Ticker alle 15 s), solange der Screen offen ist.
export function useLive(token, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchLiveSnapshot(token)
      setState({ status: 'ready', data, error: null })
    } catch (error) {
      // Vorhandene Daten behalten, sonst Fehlerzustand zeigen.
      setState((prev) =>
        prev.data ? prev : { status: 'error', data: null, error: error?.message ?? String(error) },
      )
    }
  }, [token])

  useEffect(() => {
    if (!enabled || !token) {
      setState({ status: 'idle', data: null, error: null })
      return undefined
    }
    let active = true
    setState({ status: 'loading', data: null, error: null })
    load()
    timer.current = setInterval(() => {
      if (active) load()
    }, LIVE_POLL_MS)
    return () => {
      active = false
      clearInterval(timer.current)
    }
  }, [enabled, token, load])

  return { ...state, reload: load }
}
