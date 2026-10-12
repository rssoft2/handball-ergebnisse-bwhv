import { useCallback, useEffect, useRef, useState } from 'react'

// Generischer asynchroner Datenlader mit Lade-/Fehlerzustand und reload().
// `fn(force)` wird bei Änderungen von `deps` neu ausgeführt.
export function useAsync(fn, deps, enabled = true) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const requestId = useRef(0)

  const run = useCallback(
    async (force = false) => {
      if (!enabled) {
        setState({ status: 'idle', data: null, error: null })
        return
      }
      const id = ++requestId.current
      setState((prev) => ({ status: 'loading', data: prev.data, error: null }))
      try {
        const data = await fn(force)
        if (id === requestId.current) {
          setState({ status: 'ready', data, error: null })
        }
      } catch (error) {
        if (id === requestId.current) {
          setState({ status: 'error', data: null, error: error?.message ?? String(error) })
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, enabled],
  )

  useEffect(() => {
    run(false)
  }, [run])

  return { ...state, reload: () => run(true) }
}
