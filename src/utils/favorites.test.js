import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FAVORITES_STORAGE_KEY,
  loadFavorites,
  moveClub,
  saveFavorites,
  toggleClub,
} from './favorites.js'

describe('Favoriten-Speicher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lädt einen gespeicherten Verein nach einem Neustart', () => {
    const favorites = {
      leagues: [],
      clubs: [{ clubId: '42', clubName: 'TV Malsch' }],
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
      clubs: [{ clubId: '42', clubName: 'TV Malsch' }],
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
      { clubId: '1', clubName: 'Erster' },
      { clubId: '2', clubName: 'Zweiter' },
      { clubId: '3', clubName: 'Dritter' },
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
