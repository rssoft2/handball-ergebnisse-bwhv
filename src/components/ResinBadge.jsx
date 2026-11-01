import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resinStatus } from '../utils/resin.js'

const LABELS = {
  allowed: 'Haftmittel erlaubt',
  limited: 'Haftmittel eingeschränkt erlaubt',
  forbidden: 'Haftmittel verboten',
}

const COLORS = {
  allowed: 'text-emerald-500',
  limited: 'text-amber-500',
  forbidden: 'text-red-500',
}

const DROP = 'M12 2.4S5 9.6 5 14.4a7 7 0 0 0 14 0C19 9.6 12 2.4 12 2.4Z'

export default function ResinBadge({ wax, className = '' }) {
  const status = resinStatus(wax)
  const triggerRef = useRef(null)
  const [tip, setTip] = useState(null)

  if (!status) return null

  const hint = LABELS[status]
  const text = String(wax ?? '').trim()
  const rule = text && text !== hint ? text : null

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const maxWidth = Math.min(288, window.innerWidth - 16)
    const center = rect.left + rect.width / 2
    const left = Math.min(
      Math.max(center, maxWidth / 2 + 8),
      window.innerWidth - maxWidth / 2 - 8,
    )
    const above = rect.top > 96

    setTip({
      left,
      top: above ? rect.top - 8 : rect.bottom + 8,
      above,
      maxWidth,
    })
  }

  const hide = () => setTip(null)

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        className={`inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
      >
        <svg
          role="img"
          aria-label={hint}
          viewBox="0 0 24 24"
          data-status={status}
          className={`h-full w-full ${COLORS[status]}`}
        >
          <path
            d={DROP}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {tip
        ? createPortal(
            <div
              role="tooltip"
              style={{ left: tip.left, top: tip.top, maxWidth: tip.maxWidth }}
              className={`pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink shadow-lg ${
                tip.above ? '-translate-y-full' : ''
              }`}
            >
              <div className="font-medium">{hint}</div>
              {rule ? <div className="mt-0.5 break-words leading-snug text-faint">{rule}</div> : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
