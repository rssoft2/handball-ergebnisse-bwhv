function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-slate-400"
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

export default function StateMessage({ status, error, onRetry, emptyText }) {
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-10 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Spinner />
        <span>Daten werden geladen …</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/60 dark:bg-red-950/40">
        <p className="font-medium text-red-700 dark:text-red-300">
          Daten konnten nicht geladen werden
        </p>
        {error ? (
          <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">{error}</p>
        ) : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
          >
            Erneut versuchen
          </button>
        ) : null}
      </div>
    )
  }

  if (emptyText) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {emptyText}
      </div>
    )
  }

  return null
}
