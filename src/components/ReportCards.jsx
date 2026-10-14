// Karten-Darstellung für Spielberichte: Verwarnung (gelb), Zeitstrafe
// (2 Minuten als Karte mit "2"), Disqualifikation (rot), Bericht (blau).
const CARD_STYLE = {
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
  blue: 'bg-blue-600',
}

const CARD_TITLE = {
  yellow: 'Verwarnung (gelbe Karte)',
  red: 'Disqualifikation (rote Karte)',
  blue: 'Disqualifikation mit Bericht (blaue Karte)',
  two: '2-Minuten-Strafe',
}

function Card({ kind }) {
  if (kind === 'two') {
    return (
      <span
        title={CARD_TITLE.two}
        className="inline-flex h-4 w-3.5 items-center justify-center rounded-[3px] bg-ink text-[8px] font-bold leading-none text-surface"
      >
        2&apos;
      </span>
    )
  }
  return <span title={CARD_TITLE[kind]} className={`inline-block h-4 w-3 rounded-[3px] ${CARD_STYLE[kind]}`} />
}

export function CardsCell({ cards }) {
  if (!cards || !cards.length) return null
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      {cards.map((card, index) => (
        <Card key={`${card.kind}-${index}`} kind={card.kind} />
      ))}
    </span>
  )
}

export function CardMark({ kind }) {
  return <Card kind={kind} />
}
