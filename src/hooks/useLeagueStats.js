import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLeagueStats } from '../api/leagueStats.js'

// Torschützen und Strafen einer Liga oder eines Teams laden. Da dafür die
// Spielberichte geladen werden (langsam, gedrosselt), läuft das nur, solange
// der Screen sichtbar ist; bei Verlassen werden laufende Ergebnisse verworfen.
export function useLeagueStats(org, league, enabled, teamName = '') {
  const [state, setState] = useState({ status: 'idle', data: null, progress: null, error: null })
  const runRef = useRef(0)
  const scope = `${league ?? ''}\u0000${teamName ?? ''}`
  const scopeRef = useRef(scope)

  const load = useCallback(
    async (force) => {
      const run = (runRef.current += 1)
      setState((prev) => ({ status: 'loading', data: prev.data, progress: null, error: null }))
      try {
        const data = await fetchLeagueStats(org, league, {
          force,
          teamName,
          onProgress: (progress) => {
            if (run === runRef.current) setState((prev) => ({ ...prev, progress }))
          },
        })
        if (run === runRef.current) {
          setState({ status: 'ready', data, progress: null, error: null })
        }
      } catch (error) {
        if (run !== runRef.current) return
        setState((prev) =>
          prev.data
            ? { ...prev, status: 'ready', progress: null, error: null }
            : { status: 'error', data: null, progress: null, error: error?.message ?? String(error) },
        )
      }
    },
    [org, league, teamName],
  )

  useEffect(() => {
    if (!enabled || !league) return undefined
    // Liga oder Team gewechselt: alte Statistik nicht weiter anzeigen.
    if (scopeRef.current !== scope) {
      scopeRef.current = scope
      setState({ status: 'idle', data: null, progress: null, error: null })
    }
    load(false)
    return () => {
      runRef.current += 1
    }
  }, [enabled, league, scope, load])

  return { ...state, reload: () => load(true) }
}
