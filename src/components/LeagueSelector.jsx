import { useMemo, useState } from 'react'

const LEVEL_ORDER = [
  'Regionalliga',
  'Oberliga',
  'Verbandsliga',
  'Landesliga',
  'Bezirksliga',
  'Bezirksklasse',
  'Kreisliga',
  'Kreisklasse',
]

function levelSortKey(level) {
  const index = LEVEL_ORDER.indexOf(level)
  return index === -1 ? LEVEL_ORDER.length : index
}

export default function LeagueSelector({
  org,
  region,
  regions,
  league,
  leagueLabel,
  leagues,
  onRegionChange,
  onLeagueChange,
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const regionOptions = useMemo(
    () => (regions ?? []).filter((item) => item.id !== org),
    [regions, org],
  )

  const groups = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const filtered = query
      ? leagues.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sname.toLowerCase().includes(query),
        )
      : leagues

    const map = new Map()
    for (const item of filtered) {
      const key = item.level || 'Weitere'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return [...map.entries()].sort((a, b) => {
      const diff = levelSortKey(a[0]) - levelSortKey(b[0])
      return diff !== 0 ? diff : a[0].localeCompare(b[0], 'de')
    })
  }, [leagues, filter])

  const flat = filter.trim() !== ''
  const leagueMissing = league && !leagues.some((item) => item.id === league)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Liga
            </div>
            <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {leagueLabel || 'Liga wählen'}
            </div>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open ? (
          <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Bereich
              </span>
              <select
                value={region}
                onChange={(event) => onRegionChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Alle Bereiche (Gesamtverband)</option>
                {regionOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Suche
              </span>
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Liga suchen …"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Liga
              </span>
              <select
                value={league}
                onChange={(event) => onLeagueChange(event.target.value)}
                size={flat ? 10 : 1}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {leagueMissing ? (
                  <option value={league}>{leagueLabel || league}</option>
                ) : null}
                {flat
                  ? groups.flatMap(([, items]) =>
                      items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      )),
                    )
                  : groups.map(([level, items]) => (
                      <optgroup key={level} label={level}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  )
}
