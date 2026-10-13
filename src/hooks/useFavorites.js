import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FAVORITES_STORAGE_KEY,
  favoriteTeamNames as namesOf,
  isClubFavorite as clubIsFav,
  isLeagueFavorite as leagueIsFav,
  isTeamFavorite as teamIsFav,
  loadFavorites,
  saveFavorites,
  toggleClub as toggleClubIn,
  toggleLeague as toggleLeagueIn,
  toggleTeam as toggleTeamIn,
} from '../utils/favorites.js'

// Favoriten pro Gerät: laden, ändern, speichern. Änderungen anderer Tabs
// werden über das `storage`-Event übernommen.
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites)

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    function onStorage(event) {
      if (event.key === FAVORITES_STORAGE_KEY) setFavorites(loadFavorites())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isLeagueFavorite = useCallback((id) => leagueIsFav(favorites, id), [favorites])
  const isClubFavorite = useCallback((name) => clubIsFav(favorites, name), [favorites])
  const isTeamFavorite = useCallback((name) => teamIsFav(favorites, name), [favorites])

  const toggleLeague = useCallback((league) => {
    setFavorites((prev) => toggleLeagueIn(prev, league))
  }, [])
  const toggleClub = useCallback((club) => {
    setFavorites((prev) => toggleClubIn(prev, club))
  }, [])
  const toggleTeam = useCallback((team) => {
    setFavorites((prev) => toggleTeamIn(prev, team))
  }, [])

  const favoriteTeams = useMemo(() => namesOf(favorites), [favorites])

  return {
    favorites,
    favoriteTeams,
    isLeagueFavorite,
    isClubFavorite,
    isTeamFavorite,
    toggleLeague,
    toggleClub,
    toggleTeam,
  }
}
