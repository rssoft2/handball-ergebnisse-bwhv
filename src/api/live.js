import { TICKER_DATA_BASE, TICKER_PAGE_BASE, LIVE_POLL_MS } from '../config.js'

// Live-Ticker: Die Daten kommen von if_ticker_data.php (CORS-freigegeben).
// Ein Live-Spiel der API liefert gToken/gAppid; der Token steuert den Ticker.
// Der Endpunkt wird per POST mit leerem Body aufgerufen, alles steckt im Query.
export { LIVE_POLL_MS }

export function officialTickerUrl(token, appid) {
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (appid) params.set('appid', appid)
  const query = params.toString()
  return query ? `${TICKER_PAGE_BASE}?${query}` : TICKER_PAGE_BASE
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
    ? members
        .map((m) => ({
          nr: String(m.player_no ?? '').trim(),
          name: [m.prename, m.name].filter(Boolean).join(' ').trim(),
        }))
        // Nur echte Spieler (numerische Rückennummer); Buchstaben sind
        // Offizielle/Betreuer. Nach Nummer sortieren.
        .filter((p) => /^\d+$/.test(p.nr))
        .sort((a, b) => Number(a.nr) - Number(b.nr))
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
  if (/^(Mannschafts-)?Auszeit\b/.test(head)) return 'timeout'
  // Reine Uhrsteuerung ("Spielzeit gestoppt"/"gestartet") – keine Aktion.
  if (/^Spielzeit\b/.test(head)) return 'clock'
  if (head.slice(0, 10) === 'Spielstand') return 'score'
  return 'info'
}

// Ticker-Texte vereinheitlichen. Der Ticker liefert fertige deutsche Sätze mit
// "Heimmannschaft"/"Gastmannschaft" und (bei Spielern) "der Nummer X"; angezeigt
// wird ein einheitliches "<Aktion> für Heim/Gast durch die Nummer X <Name>".
const ACTION_LABEL = {
  goal: 'Tor',
  seven: '7m Tor',
  missed: '7m-Wurf',
  yellow: 'Verwarnung',
  two: '2-min Strafe',
  red: 'Disqualifikation',
  blue: 'Disqualifikation mit Bericht',
  timeout: 'Auszeit',
}

const CARD_KINDS = new Set(['yellow', 'two', 'red', 'blue'])
const MILESTONE_RANK = 40

function actionSide(message) {
  if (/Heimmannschaft/.test(message)) return 'home'
  if (/Gastmannschaft/.test(message)) return 'away'
  return null
}

function formatMessage(action, sideLabel, name) {
  const label = ACTION_LABEL[action.kind]
  if (!label) return action.raw
  if (action.kind === 'timeout') return sideLabel ? `Auszeit für ${sideLabel}` : 'Auszeit'
  if (action.kind === 'missed') {
    return sideLabel ? `${label} für ${sideLabel}: Kein Treffer` : label
  }
  if (action.nr) {
    const sidePart = sideLabel ? ` für ${sideLabel}` : ''
    return `${label}${sidePart} durch die Nummer ${action.nr}${name ? ` ${name}` : ''}`
  }
  return action.raw
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) return []
  return actions
    .map((a) => {
      const raw = String(a.message ?? '').trim()
      const nrMatch = raw.match(/Nummer\s+(\d+)/)
      return {
        time: Number(a.game_time),
        raw,
        kind: classifyMessage(raw),
        side: actionSide(raw),
        nr: nrMatch ? nrMatch[1] : '',
        homeScore: Number.isFinite(Number(a.home_score)) ? Number(a.home_score) : null,
        guestScore: Number.isFinite(Number(a.guest_score)) ? Number(a.guest_score) : null,
      }
    })
    .filter((a) => a.raw)
}

function playerLookup(team) {
  const map = new Map()
  for (const p of team?.players ?? []) map.set(String(Number(p.nr)), p)
  return map
}

// Nachrichten um Spielernamen ergänzen und dabei die Statistik je Spieler
// aufbauen (Tore, 7m, Karten) sowie das 40. Tor einer Mannschaft markieren.
function buildActions(baseTeams, actions) {
  const enriched = {}
  const lookup = {}
  for (const side of ['home', 'away']) {
    const players = (baseTeams[side]?.players ?? []).map((p) => ({
      ...p,
      goals: 0,
      seven: 0,
      cards: [],
    }))
    enriched[side] = { ...baseTeams[side], goals: 0, players }
    lookup[side] = playerLookup({ players })
  }

  const counts = { home: 0, away: 0 }
  let milestone = null

  const list = actions.map((a) => {
    const sideLabel = a.side === 'home' ? 'Heim' : a.side === 'away' ? 'Gast' : null
    const player = a.nr ? lookup[a.side]?.get(String(Number(a.nr))) : null
    const name = player?.name ?? ''

    if (a.kind === 'goal' || a.kind === 'seven') {
      counts[a.side] += 1
      enriched[a.side].goals += 1
      if (player) {
        player.goals += 1
        if (a.kind === 'seven') {
          player.seven += 1
          player.sevenAttempts = (player.sevenAttempts || 0) + 1
        }
      }
    } else if (a.kind === 'missed' && a.side && player) {
      player.sevenAttempts = (player.sevenAttempts || 0) + 1
      if (!milestone && counts[a.side] === MILESTONE_RANK) {
        milestone = { rank: MILESTONE_RANK, side: a.side === 'home', name, nr: player?.nr ?? a.nr }
      }
    } else if (CARD_KINDS.has(a.kind) && player) {
      player.cards.push({ kind: a.kind })
    }

    return { ...a, name, message: formatMessage(a, sideLabel, name) }
  })

  return { teams: enriched, actions: list, milestone }
}

// Steckbrief + Kader ändern sich während des Spiels nicht – einmal laden und
// zwischenspeichern. So holt das Polling nur noch die Ticker-Nachrichten.
const baseCache = new Map()

async function fetchLiveBase(token) {
  const cached = baseCache.get(token)
  if (cached) return cached
  const [info, detail] = await Promise.all([
    tickerCall(token, 'getGameInfo'),
    tickerCall(token, 'getAllGameInfo').catch(() => null),
  ])
  const value = {
    info: normalizeInfo(info),
    teams: {
      home: normalizeTeam(detail?.team_home),
      away: normalizeTeam(detail?.team_guest),
    },
  }
  baseCache.set(token, value)
  return value
}

export async function fetchLiveSnapshot(token) {
  if (!token) throw new Error('Für dieses Spiel ist kein Live-Ticker verfügbar.')

  // Steckbrief/Kader (gecacht) + Nachrichten; letztere ändern sich laufend.
  const [base, actions] = await Promise.all([
    fetchLiveBase(token),
    tickerCall(token, 'getAllTickerMessages').catch(() => []),
  ])

  const { teams, actions: list, milestone } = buildActions(base.teams, normalizeActions(actions))
  return { info: base.info, teams, actions: list, milestone }
}
