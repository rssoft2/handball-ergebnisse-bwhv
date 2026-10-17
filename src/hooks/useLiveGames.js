import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveGames } from '../api/h4a.js'
import { LIVE_LIST_POLL_MS } from '../config.js'

// Liste aller laufenden Spiele laden und – solange aktiv – regelmäßig
// aktualisieren (Live-Tab der Startseite). Im Hintergrund (Tab nicht sichtbar)
// wird nicht gepollt, um die API nicht unnötig zu belasten.
export function useLiveGames(org, region, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const inFlight = useRef(false)

  const load = useCallback(
    async (force = false) => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const data = await fetchLiveGames(org, region, force)
        setState({ status: 'ready', data, error: null })
      } catch (error) {
        setState((prev) =>
          prev.data ? prev : { status: 'error', data: null, error: error?.message ?? String(error) },
        )
      } finally {
        inFlight.current = false
      }
    },
    [org, region],
  )

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
    load()

    const timer = setInterval(() => {
      if (active && !document.hidden) load()
    }, LIVE_LIST_POLL_MS)

    // Beim Zurückkehren in den Tab sofort aktualisieren.
    const onVisible = () => {
      if (active && !document.hidden) load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, load])

  return { ...state, reload: () => load(true) }
}
