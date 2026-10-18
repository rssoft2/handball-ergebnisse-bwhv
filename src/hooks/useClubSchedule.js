import { fetchClubSchedule } from '../api/h4a.js'
import { useAsync } from './useAsync.js'

// Spieltag-Spiele eines Vereins laden (aktueller/kommender Spieltag).
export function useClubSchedule(org, club, enabled = true) {
  const clubId = club?.clubId ?? ''
  return useAsync(
    () => fetchClubSchedule(org, club),
    [org, clubId],
    enabled && Boolean(clubId),
  )
}
