import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLeagueScorers } from '../api/leagueStats.js'

// Torschützenliste einer Liga laden. Da dafür alle Spielberichte der Liga
// geladen werden (langsam, gedrosselt), läuft das nur, solange der Screen
// sichtbar ist; bei Verlassen werden laufende Ergebnisse verworfen.
export function useLeagueScorers(org, league, enabled) {
  const [state, setState] = useState({ status: 'idle', data: null, progress: null, error: null })
  const runRef = useRef(0)
  const leagueRef = useRef(league)

  const load = useCallback(
    async (force) => {
      const run = (runRef.current += 1)
      setState((prev) => ({ status: 'loading', data: prev.data, progress: null, error: null }))
      try {
        const data = await fetchLeagueScorers(org, league, {
          force,
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
    [org, league],
  )

  useEffect(() => {
    if (!enabled || !league) return undefined
    // Liga gewechselt: alte Statistik nicht weiter anzeigen.
    if (leagueRef.current !== league) {
      leagueRef.current = league
      setState({ status: 'idle', data: null, progress: null, error: null })
    }
    load(false)
    return () => {
      runRef.current += 1
    }
  }, [enabled, league, load])

  return { ...state, reload: () => load(true) }
}
