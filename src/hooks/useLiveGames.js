import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveGames } from '../api/h4a.js'
import { LIVE_LIST_POLL_MS } from '../config.js'

// Liste aller laufenden Spiele laden und – solange aktiv – regelmäßig
// aktualisieren (Live-Tab der Startseite).
export function useLiveGames(org, region, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const timer = useRef(null)

  const load = useCallback(
    async (force = false) => {
      try {
        const data = await fetchLiveGames(org, region, force)
        setState({ status: 'ready', data, error: null })
      } catch (error) {
        setState((prev) =>
          prev.data ? prev : { status: 'error', data: null, error: error?.message ?? String(error) },
        )
      }
    },
    [org, region],
  )

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
    load()
    timer.current = setInterval(() => {
      if (active) load()
    }, LIVE_LIST_POLL_MS)
    return () => {
      active = false
      clearInterval(timer.current)
    }
  }, [enabled, load])

  return { ...state, reload: () => load(true) }
}
