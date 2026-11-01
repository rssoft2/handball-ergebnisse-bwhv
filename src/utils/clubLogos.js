import { CLUB_LOGOS } from '../data/clubLogos.js'
import { normalizeTeamName } from './teams.js'

const LOGO_BASE = `${import.meta.env.BASE_URL}logos/clubs/`

// Mannschaftsnummer am Ende ("HSG Ettlingen 2") gehört nicht zum Vereinsnamen.
function clubKey(name) {
  const base = String(name ?? '')
    .trim()
    .replace(/\s+\d{1,2}$/, '')
  return normalizeTeamName(base)
}

const logoIndex = new Map()

for (const entry of CLUB_LOGOS) {
  for (const name of [entry.name, ...(entry.aliases ?? [])]) {
    const key = clubKey(name)
    if (!key) continue
    if (import.meta.env.DEV && logoIndex.has(key) && logoIndex.get(key) !== entry) {
      console.warn(`Doppeltes Club-Logo für "${name}"`)
    }
    logoIndex.set(key, entry)
  }
}

export function clubLogoFor(name) {
  return logoIndex.get(clubKey(name)) ?? null
}

export function clubLogoUrl(entry) {
  return entry?.file ? `${LOGO_BASE}${entry.file}` : ''
}
