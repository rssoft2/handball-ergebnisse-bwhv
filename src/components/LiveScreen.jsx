import { useLive } from '../hooks/useLive.js'
import { officialTickerUrl } from '../api/live.js'
import { isFavoriteTeam } from '../utils/teams.js'
import StateMessage from './StateMessage.jsx'
import { CardMark } from './ReportCards.jsx'

const CARD_KINDS = new Set(['yellow', 'two', 'red', 'blue'])

function formatClock(seconds) {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s < 0) return ''
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// "2026-10-17 16:30:00" -> "17.10.2026 · 16:30"
function formatDateTime(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return String(value || '')
  return `${m[3]}.${m[2]}.${m[1]} · ${m[4]}:${m[5]}`
}

// Handball-Icon aus `public/`; hell/dunkel je nach Theme umschalten.
function BallIcon() {
  const base = import.meta.env.BASE_URL
  return (
    <span className="inline-flex h-4 w-4 shrink-0">
      <img
        src={`${base}handball-icon-light-mode.svg`}
        alt="Tor"
        className="h-4 w-4 [[data-theme=dark]_&]:hidden"
      />
      <img
        src={`${base}handball-icon-dark-mode.svg`}
        alt="Tor"
        className="hidden h-4 w-4 [[data-theme=dark]_&]:inline"
      />
    </span>
  )
}

function KindBadge({ kind }) {
  if (kind === 'goal') return <BallIcon />
  if (CARD_KINDS.has(kind)) return <CardMark kind={kind} />
  if (kind === 'seven') {
    return (
      <span className="rounded-full bg-accentsoft px-2 py-0.5 text-[10px] font-bold text-accent">
        7m
      </span>
    )
  }
  if (kind === 'missed') {
    return (
      <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-faint">
        7m daneben
      </span>
    )
  }
  if (kind === 'timeout') return <CardMark kind="timeout" />
  return null
}

export default function LiveScreen({ game, favoriteTeams }) {
  const live = useLive(game?.token, Boolean(game?.token))

  if (!game?.token) {
    return <StateMessage emptyText="Für dieses Spiel ist kein Live-Ticker verfügbar." />
  }

  if (live.status === 'loading' && !live.data) return <StateMessage status="loading" />
  if (live.status === 'error' && !live.data) {
    return <StateMessage status="error" error={live.error} onRetry={live.reload} />
  }

  const data = live.data
  if (!data) return null

  const info = data.info
  const home = info.home || game.home || ''
  const away = info.away || game.away || ''
  const homeFav = isFavoriteTeam(home, favoriteTeams)
  const awayFav = isFavoriteTeam(away, favoriteTeams)

  // Neueste Aktion oben, Spielanfang unten (wie im Spielverlauf).
  // "Spielstand"- und Uhr-Meldungen ("Spielzeit gestoppt") sind keine Aktionen.
  const actions = [...data.actions]
    .filter((a) => a.kind !== 'score' && a.kind !== 'clock')
    .reverse()
  const latest = data.actions[data.actions.length - 1]
  const score =
    latest && latest.homeScore !== null && latest.guestScore !== null
      ? `${latest.homeScore}:${latest.guestScore}`
      : game.done
        ? `${game.homeGoals}:${game.awayGoals}`
        : '–:–'
  const clock = latest ? formatClock(latest.time) : ''

  const when = formatDateTime(info.datetime)
  const place = [info.venue, info.town].filter(Boolean).join(', ')

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="font-medium">{info.league || 'Live-Ticker'}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-right">
            <span className={homeFav ? 'font-bold text-favink' : 'font-medium text-ink'}>{home}</span>
          </div>
          <div className="shrink-0 text-center">
            <div className="rounded-lg bg-surface2 px-3 py-1 text-2xl font-bold tabular-nums text-ink">
              {score}
            </div>
            {clock ? (
              <div className="mt-0.5 text-[11px] tabular-nums text-faint">{clock}</div>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className={awayFav ? 'font-bold text-favink' : 'font-medium text-ink'}>{away}</span>
          </div>
        </div>

        <div className="mt-3 space-y-0.5 text-center text-xs text-muted">
          {when ? <div className="tabular-nums">{when}</div> : null}
          {place ? <div className="text-faint">{place}</div> : null}
          {info.referees.length ? (
            <div className="text-faint">Schiedsrichter: {info.referees.join(' · ')}</div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-center">
          <a
            href={officialTickerUrl(game.token, game.appid)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-surface2 active:scale-95"
          >
            Offizieller Ticker
          </a>
        </div>
      </div>

      {actions.length === 0 ? (
        <StateMessage emptyText="Das Spiel läuft – noch keine Aktionen gemeldet." />
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <li className="flex items-center gap-3 border-b border-line bg-surface2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-faint">
            <span className="w-11 shrink-0">Spielzeit</span>
            <span className="w-12 shrink-0 text-center">Stand</span>
            <span className="min-w-0 flex-1">Ereignis</span>
          </li>
          {actions.map((action, index) => (
            <li
              key={`${action.time}-${action.kind}-${index}`}
              className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0"
            >
              <span className="w-11 shrink-0 text-xs tabular-nums text-faint">
                {formatClock(action.time)}
              </span>
              <span className="w-12 shrink-0 rounded-md bg-surface2 py-0.5 text-center text-sm font-bold tabular-nums text-ink">
                {action.homeScore !== null && action.guestScore !== null
                  ? `${action.homeScore}:${action.guestScore}`
                  : '–'}
              </span>
              <span className="min-w-0 flex-1 text-sm text-ink">{action.message}</span>
              <KindBadge kind={action.kind} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
