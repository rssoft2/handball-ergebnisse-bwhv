import { useMemo, useState } from 'react'
import StateMessage from './StateMessage.jsx'

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function LeagueRow({ league, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(league.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100 active:scale-[0.99] dark:hover:bg-slate-800"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {league.name || league.sname}
        </div>
        {league.level ? (
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {league.level}
          </div>
        ) : null}
      </div>
      <ChevronRight />
    </button>
  )
}

export default function LeagueList({ leagues, status, error, onSelect, onRetry }) {
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState(() => new Set())

  const groups = useMemo(() => {
    const map = new Map()
    for (const league of leagues) {
      if (!map.has(league.section)) map.set(league.section, [])
      map.get(league.section).push(league)
    }
    return [...map.entries()]
  }, [leagues])

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return null
    return leagues.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.sname.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q) ||
        l.ageGroup.toLowerCase().includes(q) ||
        l.section.toLowerCase().includes(q),
    )
  }, [leagues, q])

  function toggle(group) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Liga suchen (z. B. Bezirksliga, weibliche C)"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
        />
      </div>

      {status === 'loading' && leagues.length === 0 ? (
        <StateMessage status="loading" />
      ) : status === 'error' ? (
        <StateMessage status="error" error={error} onRetry={onRetry} />
      ) : results ? (
        results.length === 0 ? (
          <StateMessage emptyText="Keine Liga gefunden." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {results.map((league) => (
              <LeagueRow key={league.id} league={league} onSelect={onSelect} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {groups.map(([group, items]) => {
            const open = openGroups.has(group)
            return (
              <div
                key={group}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => toggle(group)}
                  className="flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {group}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {items.length}
                  </span>
                </button>

                {open ? (
                  <div className="border-t border-slate-100 p-1 dark:border-slate-800">
                    {items.map((league) => (
                      <LeagueRow key={league.id} league={league} onSelect={onSelect} />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
