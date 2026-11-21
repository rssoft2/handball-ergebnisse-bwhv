import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FAVORITES_STORAGE_KEY,
  loadFavorites,
  moveClub,
  saveFavorites,
  toggleClub,
  toggleLeague,
  toggleTeam,
} from './favorites.js'

describe('Favoriten-Speicher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lädt einen gespeicherten Verein nach einem Neustart', () => {
    const favorites = {
      leagues: [],
      clubs: [{ clubId: '42', clubName: 'TV Malsch', region: '246' }],
      teams: [],
    }

    expect(saveFavorites(favorites)).toBe(true)
    expect(loadFavorites()).toEqual(favorites)
  })

  it('opfert bei vollem Speicher zuerst den API-Cache', () => {
    const cacheKey = 'h4a:report:v4:123'
    window.localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), v: 'x' }))
    window.localStorage.setItem('h4a:theme', 'dark')

    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === FAVORITES_STORAGE_KEY && window.localStorage.getItem(cacheKey)) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      }
      return original.call(this, key, value)
    })

    const favorites = {
      leagues: [],
      clubs: [{ clubId: '42', clubName: 'TV Malsch', region: '246' }],
      teams: [],
    }

    expect(saveFavorites(favorites)).toBe(true)
    expect(window.localStorage.getItem(cacheKey)).toBeNull()
    expect(window.localStorage.getItem('h4a:theme')).toBe('dark')
    expect(loadFavorites()).toEqual(favorites)
  })
})

describe('Vereinssortierung', () => {
  const makeFavorites = () => ({
    leagues: [],
    clubs: [
      { clubId: '1', clubName: 'Erster', region: '246' },
      { clubId: '2', clubName: 'Zweiter', region: '246' },
      { clubId: '3', clubName: 'Dritter', region: '246' },
    ],
    teams: [],
  })

  it('verschiebt einen Verein nach oben und wieder nach unten', () => {
    const moved = moveClub(makeFavorites(), '2', -1)
    expect(moved.clubs.map((club) => club.clubName)).toEqual([
      'Zweiter',
      'Erster',
      'Dritter',
    ])

    const back = moveClub(moved, '2', 1)
    expect(back.clubs.map((club) => club.clubName)).toEqual([
      'Erster',
      'Zweiter',
      'Dritter',
    ])
  })

  it('lässt die Reihenfolge am Anfang und Ende unverändert', () => {
    const favorites = makeFavorites()
    expect(moveClub(favorites, '1', -1)).toBe(favorites)
    expect(moveClub(favorites, '3', 1)).toBe(favorites)
  })

  it('hängt neue Vereine am Ende an', () => {
    const updated = toggleClub(makeFavorites(), { clubId: '4', clubName: 'Vierter' })
    expect(updated.clubs.map((club) => club.clubName)).toEqual([
      'Erster',
      'Zweiter',
      'Dritter',
      'Vierter',
    ])
  })
})

describe('Bezirk-Metadaten', () => {
  it('migriert alte Favoriten ohne Bezirk auf den Standardbezirk', () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({
        leagues: [{ id: '1', name: 'Alt', level: 'Kreisliga' }],
        clubs: [{ clubId: '42', clubName: 'Alter Verein' }],
        teams: [{ name: 'Altmannschaft', leagueId: '1', leagueName: 'Alt' }],
      }),
    )

    const favorites = loadFavorites()
    expect(favorites.leagues[0].region).toBe('246')
    expect(favorites.clubs[0].region).toBe('246')
    expect(favorites.teams[0].region).toBe('246')
  })

  it('behält einen gespeicherten leeren Bezirk für landesweite Ligen', () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ leagues: [{ id: '1', name: 'Land', level: 'Oberliga', region: '' }] }),
    )

    expect(loadFavorites().leagues[0].region).toBe('')
  })

  it('speichert Bezirk und Sortiermetadaten bei neuen Favoriten', () => {
    let favorites = toggleLeague(
      { leagues: [], clubs: [], teams: [] },
      {
        id: '9',
        name: 'Bezirksliga',
        level: 'Bezirksliga',
        sname: 'bBL',
        section: 'Männer',
        ageGroup: 'Männer',
        region: '221',
      },
    )
    favorites = toggleClub(favorites, { clubId: '7', clubName: 'Verein', region: '221' })
    favorites = toggleTeam(favorites, {
      name: 'Team',
      leagueId: '9',
      leagueName: 'Bezirksliga',
      leagueLevel: 'Bezirksliga',
      section: 'Männer',
      ageGroup: 'Männer',
      region: '221',
    })

    expect(favorites.leagues[0]).toMatchObject({ region: '221', sname: 'bBL' })
    expect(favorites.clubs[0]).toMatchObject({ region: '221' })
    expect(favorites.teams[0]).toMatchObject({
      region: '221',
      leagueLevel: 'Bezirksliga',
      section: 'Männer',
      ageGroup: 'Männer',
    })
  })
})
