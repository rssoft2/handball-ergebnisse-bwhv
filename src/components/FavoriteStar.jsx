// Stern-Button zum Setzen/Entfernen eines Favoriten. Verhindert, dass ein
// Klick in einer klickbaren Zeile auch die Zeile selbst auslöst.
export default function FavoriteStar({ active, onToggle, label, className = '' }) {
  return (
    <button
      type="button"
      aria-label={active ? `${label} aus Favoriten entfernen` : `${label} zu Favoriten hinzufügen`}
      aria-pressed={active}
      title={active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
        active ? 'text-favink hover:bg-favbg' : 'text-faint hover:bg-surface2 hover:text-ink'
      } ${className}`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    </button>
  )
}
