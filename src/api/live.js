import { TICKER_DATA_BASE, TICKER_PAGE_BASE, LIVE_POLL_MS } from '../config.js'

// Live-Ticker: Die Daten kommen von if_ticker_data.php (CORS-freigegeben).
// Ein Live-Spiel der API liefert gToken/gAppid; der Token steuert den Ticker.
// Der Endpunkt wird per POST mit leerem Body aufgerufen, alles steckt im Query.
export { LIVE_POLL_MS }

export function officialTickerUrl(token, appid) {
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (appid) params.set('appid', appid)
  return `${TICKER_PAGE_BASE}?${params.toString()}`
}

async function tickerCall(token, cmd) {
  const url = `${TICKER_DATA_BASE}?token=${encodeURIComponent(token)}&cmd=${encodeURIComponent(cmd)}`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(`Live-Daten konnten nicht geladen werden (${res.status}).`)

  const data = await res.json().catch(() => null)
  // Erfolg ist ein Array (Nachrichten) oder ein Objekt. Der Server stellt ein
  // Envelope mit status 0 voran, liefert bei cmd=getGameInfo aber zugleich das
  // Spielobjekt (das selbst ein status-Feld hat) – daher auch über Inhalt erkennen.
  const isObject = data && typeof data === 'object' && !Array.isArray(data)
  const hasPayload =
    isObject && ['home_lname', 'guest_lname', 'class_lname', 'team_home', 'team_guest'].some((k) => k in data)
  const ok = Array.isArray(data) || (isObject && (data.status === 0 || hasPayload))
  if (!ok) {
    const error = new Error(
      (data && (data.status_descripion || data.status_description)) ||
        'Für dieses Spiel liegen noch keine Live-Daten vor.',
    )
    error.tickerStatus = data?.status
    throw error
  }
  return data
}

function normalizeInfo(info) {
  const referees = [info?.report?.refereeA, info?.report?.refereeB]
    .map((ref) => [ref?.prename, ref?.name].filter(Boolean).join(' ').trim())
    .filter(Boolean)
  return {
    league: (info?.class_lname || '').trim(),
    home: (info?.home_lname || '').trim(),
    away: (info?.guest_lname || '').trim(),
    datetime: (info?.datetime || '').trim(),
    venue: (info?.gym_name || '').trim(),
    town: (info?.gym_town || '').trim(),
    status: info?.status ?? null,
    statusText: (info?.status_description || '').trim(),
    referees,
  }
}

function normalizeTeam(team) {
  const members = team?.team_members
  const players = Array.isArray(members)
    ? members.map((m) => ({
        nr: String(m.player_no ?? '').trim(),
        name: [m.prename, m.name].filter(Boolean).join(' ').trim(),
      }))
    : []
  return { club: (team?.club || '').trim(), players }
}

// Leitet aus dem Nachrichtentext die Aktionsart ab (der Ticker liefert die
// Nachricht als fertigen deutschen Text; nur die Art wird klassifiziert).
export function classifyMessage(message) {
  const head = String(message || '').trimStart()
  if (/^Erfolgreicher 7m/.test(head)) return 'seven'
  if (/^7m-Wurf/.test(head)) return 'missed'
  if (/^Tor\b/.test(head)) return 'goal'
  if (/^Verwarnung\b/.test(head)) return 'yellow'
  if (/^2-min Strafe/.test(head)) return 'two'
  if (/^Disqualifikation mit Bericht/.test(head)) return 'blue'
  if (/^Disqualifikation\b/.test(head)) return 'red'
  if (/^Auszeit\b/.test(head)) return 'timeout'
  if (head.slice(0, 10) === 'Spielstand') return 'score'
  return 'info'
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) return []
  return actions
    .map((a) => ({
      time: Number(a.game_time),
      message: String(a.message ?? '').trim(),
      homeScore: Number.isFinite(Number(a.home_score)) ? Number(a.home_score) : null,
      guestScore: Number.isFinite(Number(a.guest_score)) ? Number(a.guest_score) : null,
      kind: classifyMessage(a.message),
    }))
    .filter((a) => a.message)
}

export async function fetchLiveSnapshot(token) {
  if (!token) throw new Error('Für dieses Spiel ist kein Live-Ticker verfügbar.')

  // Alle drei Aufrufe parallel; Steckbrief und Kader sind optional.
  const [info, detail, actions] = await Promise.all([
    tickerCall(token, 'getGameInfo'),
    tickerCall(token, 'getAllGameInfo').catch(() => null),
    tickerCall(token, 'getAllTickerMessages').catch(() => []),
  ])

  return {
    info: normalizeInfo(info),
    teams: {
      home: normalizeTeam(detail?.team_home),
      away: normalizeTeam(detail?.team_guest),
    },
    actions: normalizeActions(actions),
  }
}
