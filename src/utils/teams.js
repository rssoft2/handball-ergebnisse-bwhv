// Prüft, ob ein Teamname einem der Favoriten entspricht (Teilstring, ohne Groß/Klein).
export function isFavoriteTeam(name, favorites = []) {
  if (!name) return false
  const lower = name.toLowerCase()
  return favorites.some((fav) => fav && lower.includes(fav.toLowerCase()))
}
