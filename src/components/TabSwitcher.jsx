const TABS = [
  { id: 'table', label: 'Tabelle' },
  { id: 'results', label: 'Ergebnisse' },
  { id: 'fixtures', label: 'Spiele' },
]

export default function TabSwitcher({ tab, onChange, counts = {} }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/70">
        {TABS.map((item) => {
          const active = tab === item.id
          const count = counts[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
              {typeof count === 'number' ? (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold ${
                    active
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-slate-300/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
