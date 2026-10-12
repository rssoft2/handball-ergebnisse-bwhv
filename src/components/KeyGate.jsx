import { useEffect, useState } from 'react'
import { keyIsValid, readStoredKey, readUrlKey, storeKey } from '../utils/access.js'

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-faint"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export default function KeyGate({ children }) {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let active = true

    async function check() {
      const urlKey = readUrlKey()
      if (urlKey && (await keyIsValid(urlKey))) {
        storeKey(urlKey)
        if (active) setState('granted')
        return
      }
      const storedKey = readStoredKey()
      if (storedKey && (await keyIsValid(storedKey))) {
        if (active) setState('granted')
        return
      }
      if (active) setState('denied')
    }

    check()
    return () => {
      active = false
    }
  }, [])

  if (state === 'granted') return children

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-muted">
        <Spinner />
        <span className="ml-3">Wird geprüft …</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <h1 className="font-head text-lg font-semibold">Kein Zugang</h1>
        <p className="mt-2 text-sm text-muted">
          Diese Seite ist nur über einen persönlichen Einladungslink erreichbar.
        </p>
        <p className="mt-4 text-xs text-faint">
          Daten: handball4all.de · inoffizielle Ansicht
          <br />© 2026 Frank Rabold
        </p>
      </div>
    </div>
  )
}
