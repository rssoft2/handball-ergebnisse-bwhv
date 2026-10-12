import { Component } from 'react'

// Fängt Renderfehler ab, damit statt eines weißen Bildschirms eine Meldung
// mit „Neu laden" erscheint.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Renderfehler:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
            <h1 className="font-head text-lg font-semibold">Etwas ist schiefgelaufen</h1>
            <p className="mt-2 text-sm text-muted">Die Ansicht konnte nicht angezeigt werden.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accentink transition hover:opacity-90 active:scale-95"
            >
              Neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
