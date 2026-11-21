import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  bezirkLabel,
  isBezirkId,
  readBezirkFromUrl,
  readStoredBezirk,
  storeBezirk,
} from './bezirk.js'

function setSearch(value) {
  window.history.replaceState(null, '', value ? `?${value}` : '/')
}

describe('bezirk', () => {
  beforeEach(() => setSearch(''))

  afterEach(() => setSearch(''))

  it('kennt nur die Bezirke des BWHV', () => {
    expect(isBezirkId('246')).toBe(true)
    expect(isBezirkId('216')).toBe(false)
    expect(isBezirkId('999')).toBe(false)
  })

  it('liest einen gültigen Bezirk aus der URL', () => {
    setSearch('k=secret&bz=221')
    expect(readBezirkFromUrl()).toBe('221')
  })

  it('verwirft ungültige URL-Werte', () => {
    setSearch('bz=999')
    expect(readBezirkFromUrl()).toBe('')
  })

  it('liest und speichert den Bezirk lokal', () => {
    expect(readStoredBezirk()).toBe('')
    storeBezirk('256')
    expect(readStoredBezirk()).toBe('256')
  })

  it('liefert das Label des Bezirks', () => {
    expect(bezirkLabel('246')).toBe('Schwarzwald-Rhein')
    expect(bezirkLabel('999')).toBe('Schwarzwald-Rhein')
  })
})
