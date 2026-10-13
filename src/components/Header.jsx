import FavoriteStar from './FavoriteStar.jsx'

export default function Header({
  meta,
  onRefresh,
  loading,
  onBack,
  theme,
  onToggleTheme,
  starred,
  onToggleStar,
  starLabel,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück zur Liga-Liste"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink active:scale-95"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}

        <img
          src={`${import.meta.env.BASE_URL}icons/icon-64.png`}
          alt=""
          className="h-9 w-9 shrink-0 rounded-lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-head text-lg font-bold text-ink">
              {meta?.name || 'Handball Ergebnisse'}
            </h1>
            {meta?.live ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted">
            {meta?.subtitle || meta?.area || 'Baden-Württembergischer HV'}
          </p>
        </div>

        {onToggleTheme ? (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'
            }
            title={theme === 'dark' ? 'Hell' : 'Dunkel'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface2 hover:text-accent active:scale-95"
          >
            {theme === 'dark' ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        ) : null}

        {onToggleStar ? (
          <FavoriteStar
            active={Boolean(starred)}
            label={starLabel || 'Liga'}
            onToggle={onToggleStar}
            className="border border-line bg-surface"
          />
        ) : null}

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Daten aktualisieren"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface2 hover:text-accent active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
              <path d="M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  )
}
