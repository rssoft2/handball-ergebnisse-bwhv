import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getReport } from '../api/reports.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Lädt Spielberichte im Hintergrund (sequenziell, damit der Dienst nicht
// drosselt) und hält das Ergebnis in einer Map pro sGID. `ensure` lädt einzelne
// Berichte bei Bedarf auch ohne Vorladen nach.
export function useReports(games = [], enabled = true) {
  const [map, setMap] = useState(() => new Map())
  const mapRef = useRef(map)
  const running = useRef(new Set())

  const update = useCallback((sGID, entry) => {
    const next = new Map(mapRef.current)
    next.set(sGID, entry)
    mapRef.current = next
    setMap(next)
  }, [])

  const load = useCallback(
    async (sGID) => {
      if (!sGID || running.current.has(sGID)) return
      running.current.add(sGID)
      update(sGID, { status: 'loading' })
      try {
        const data = await getReport(sGID)
        update(sGID, { status: 'ready', data })
      } catch (error) {
        update(sGID, { status: 'error', error: error?.message || String(error) })
      } finally {
        running.current.delete(sGID)
      }
    },
    [update],
  )

  const ensure = useCallback(
    (sGID) => {
      if (!sGID) return
      const current = mapRef.current.get(sGID)
      if (current && (current.status === 'ready' || current.status === 'loading')) return
      load(sGID)
    },
    [load],
  )

  const ids = useMemo(
    () => [...new Set(games.map((g) => g.reportId).filter(Boolean))],
    [games],
  )
  const key = ids.join(',')

  useEffect(() => {
    if (!enabled || !key) return
    let cancelled = false
    const queue = key.split(',')
    ;(async () => {
      for (const sGID of queue) {
        if (cancelled) return
        const current = mapRef.current.get(sGID)
        if (current && (current.status === 'ready' || current.status === 'loading')) continue
        await load(sGID)
        if (cancelled) return
        await sleep(600)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key, enabled, load])

  const progress = useMemo(() => {
    let ready = 0
    let loading = 0
    let failed = 0
    for (const id of ids) {
      const entry = map.get(id)
      if (!entry) continue
      if (entry.status === 'ready') ready += 1
      else if (entry.status === 'loading') loading += 1
      else if (entry.status === 'error') failed += 1
    }
    return { total: ids.length, ready, loading, failed }
  }, [ids, map])

  return { get: (sGID) => map.get(sGID), ensure, progress }
}
