import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveSnapshot, LIVE_POLL_MS } from '../api/live.js'

// Lädt den Live-Ticker eines Spiels und aktualisiert ihn im Intervall
// (wie der offizielle Ticker alle 15 s), solange der Screen offen ist.
// Im Hintergrund (Tab nicht sichtbar) wird nicht gepollt.
export function useLive(token, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const data = await fetchLiveSnapshot(token)
      setState({ status: 'ready', data, error: null })
    } catch (error) {
      // Vorhandene Daten behalten, sonst Fehlerzustand zeigen.
      setState((prev) =>
        prev.data ? prev : { status: 'error', data: null, error: error?.message ?? String(error) },
      )
    } finally {
      inFlight.current = false
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

    const timer = setInterval(() => {
      if (active && !document.hidden) load()
    }, LIVE_POLL_MS)

    const onVisible = () => {
      if (active && !document.hidden) load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, token, load])

  return { ...state, reload: load }
}
