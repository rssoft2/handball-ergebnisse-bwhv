// Normalisiert Teamnamen für den Abgleich (Groß/Klein, Umlaute, Sonderzeichen egal).
export function normalizeTeamName(name) {
  return String(name ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

// Prüft, ob `short` als Teilsequenz in `full` steckt.
export function isSubsequence(short, full) {
  if (!short) return false
  let i = 0
  for (const char of full) {
    if (char === short[i]) i += 1
    if (i === short.length) return true
  }
  return false
}

// Ein Favorit (Vereins- oder Mannschaftsname) passt zu einem Teamnamen der Spiele.
// Die Spiele nennen oft Kurzformen ("SG PF/Eutingen 2"), Favoriten aber Langformen
// ("SG Pforzheim/Eutingen") – deshalb zusätzlich Teilsequenz-Abgleich in beide
// Richtungen (wie bei der Vereins-/Mannschaftszuordnung). Team-Nummern ("... 2")
// werden getrennt verglichen, damit Mannschaftsfavoriten nur ihre eigene Mannschaft
// treffen, Vereinsfavoriten aber alle Mannschaften (keine Nummer).
function splitTeamNumber(norm) {
  const match = norm.match(/^(.*?)([0-9]+)$/)
  return match ? { base: match[1], num: match[2] } : { base: norm, num: null }
}

function favoriteMatches(favorite, name) {
  const fav = String(favorite ?? '').trim()
  if (!fav || !name) return false
  if (name.toLowerCase().includes(fav.toLowerCase())) return true

  const f = normalizeTeamName(fav)
  const n = normalizeTeamName(name)
  if (f.length < 3 || n.length < 3) return false

  const fa = splitTeamNumber(f)
  const na = splitTeamNumber(n)
  if (fa.base.length < 3 || na.base.length < 3) return false
  const baseMatches = isSubsequence(fa.base, na.base) || isSubsequence(na.base, fa.base)
  if (!baseMatches) return false

  // Ohne Nummer im Favoriten gilt der ganze Verein (alle Mannschaften).
  if (fa.num === null) return true
  return fa.num === na.num
}

// Prüft, ob ein Teamname zu einem der Favoriten passt (Vereins- und Mannschaftsnamen).
export function isFavoriteTeam(name, favorites = []) {
  if (!name) return false
  return favorites.some((fav) => favoriteMatches(fav, name))
}
