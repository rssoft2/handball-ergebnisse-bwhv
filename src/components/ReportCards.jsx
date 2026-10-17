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
  timeout: 'Auszeit (grüne Karte)',
}

// Grüne Karte ("T") – markiert eine Auszeit.
function TimeoutCard() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block h-4 w-4"
    >
      <path
        d="M2 1.06667C2 0.477563 2.53726 0 3.2 0H12.8C13.4627 0 14 0.477563 14 1.06667V14.9333C14 15.5224 13.4627 16 12.8 16H3.2C2.53726 16 2 15.5224 2 14.9333V1.06667Z"
        fill="#00DC5D"
      />
      <path
        d="M7.68697 6.192H6.24097V5.504H9.75697V6.192H8.31097V11.2H7.68697V6.192Z"
        fill="black"
      />
    </svg>
  )
}

function Card({ kind }) {
  if (kind === 'timeout') {
    return (
      <span title={CARD_TITLE.timeout} className="inline-flex">
        <TimeoutCard />
      </span>
    )
  }
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
