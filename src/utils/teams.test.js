import { describe, expect, it } from 'vitest'
import { isFavoriteTeam, normalizeTeamName, isSubsequence } from './teams.js'

describe('normalizeTeamName', () => {
  it('ignoriert Groß/Klein, Umlaute und Sonderzeichen', () => {
    expect(normalizeTeamName('SG Pforzheim / Eutingen')).toBe('SGPFORZHEIMEUTINGEN')
    expect(normalizeTeamName('SG PF/Eutingen')).toBe('SGPFEUTINGEN')
  })
})

describe('isSubsequence', () => {
  it('erkennt Teilsequenzen', () => {
    expect(isSubsequence('ABC', 'XABCY')).toBe(true)
    expect(isSubsequence('ABC', 'ACB')).toBe(false)
  })
})

describe('isFavoriteTeam', () => {
  it('matcht exakte Namen', () => {
    expect(isFavoriteTeam('HSG Ettlingen', ['HSG Ettlingen'])).toBe(true)
  })

  it('matcht Mannschaftsnummern', () => {
    expect(isFavoriteTeam('HSG Ettlingen 2', ['HSG Ettlingen 2'])).toBe(true)
    expect(isFavoriteTeam('HSG Ettlingen 1', ['HSG Ettlingen 2'])).toBe(false)
  })

  it('Vereinsfavorit ohne Nummer deckt alle Mannschaften ab', () => {
    expect(isFavoriteTeam('HSG Ettlingen 2', ['HSG Ettlingen'])).toBe(true)
    expect(isFavoriteTeam('HSG Ettlingen 3', ['HSG Ettlingen'])).toBe(true)
  })

  it('matcht SG Pforzheim/Eutingen inkl. Abkürzung und Nummern', () => {
    expect(isFavoriteTeam('SG Pforzheim/Eutingen', ['SG Pforzheim/Eutingen'])).toBe(true)
    expect(isFavoriteTeam('SG Pforzheim/Eutingen 1', ['SG Pforzheim/Eutingen'])).toBe(true)
    expect(isFavoriteTeam('SG Pforzheim/Eutingen 2', ['SG Pforzheim/Eutingen'])).toBe(true)
    expect(isFavoriteTeam('SG PF/Eutingen', ['SG Pforzheim/Eutingen'])).toBe(true)
    expect(isFavoriteTeam('SG PF/Eutingen 2', ['SG Pforzheim/Eutingen'])).toBe(true)
    expect(isFavoriteTeam('SG Pforzheim/Eutingen 2', ['SG PF/Eutingen'])).toBe(true)
  })

  it('matcht Schreibweisen mit Leerzeichen um den Slash', () => {
    expect(isFavoriteTeam('SG PF/Eutingen 2', ['SG Pforzheim / Eutingen'])).toBe(true)
  })

  it('matcht keine fremden Vereine', () => {
    expect(isFavoriteTeam('TSG Wiesloch', ['SG Pforzheim/Eutingen'])).toBe(false)
  })

  it('matcht keinen Verein mit anderem Kürzel und ähnlichem Ortsnamen', () => {
    expect(isFavoriteTeam('TSV Rot-Malsch', ['TV Malsch'])).toBe(false)
    expect(isFavoriteTeam('TSV Germania Malsch', ['TV Malsch'])).toBe(false)
  })

  it('matcht TV Malsch weiterhin inkl. Mannschaftsnummer', () => {
    expect(isFavoriteTeam('TV Malsch', ['TV Malsch'])).toBe(true)
    expect(isFavoriteTeam('TV Malsch 2', ['TV Malsch'])).toBe(true)
    expect(isFavoriteTeam('TV Malsch', ['TV Malsch 2'])).toBe(false)
  })

  it('matcht SG Sulzfeld/Bretten mit der Kurzform SG Sulzf/Brett', () => {
    expect(isFavoriteTeam('SG Sulzf/Brett', ['SG Sulzfeld/Bretten'])).toBe(true)
    expect(isFavoriteTeam('SG Sulzfeld/Bretten', ['SG Sulzf/Brett'])).toBe(true)
    expect(isFavoriteTeam('SG Sulzf/Brett 2', ['SG Sulzfeld/Bretten'])).toBe(true)
  })

  it('matcht SG Sulzfeld/Bretten nicht mit TV Bretten', () => {
    expect(isFavoriteTeam('TV Bretten', ['SG Sulzfeld/Bretten'])).toBe(false)
    expect(isFavoriteTeam('TV Bretten', ['SG Sulzf/Brett'])).toBe(false)
    expect(isFavoriteTeam('SG Sulzfeld/Bretten', ['TV Bretten'])).toBe(false)
    expect(isFavoriteTeam('SG Sulzf/Brett', ['TV Bretten'])).toBe(false)
  })

  it('matcht weiterhin Kurzformen mit gleichem Kürzel', () => {
    expect(isFavoriteTeam('HSG DiMa', ['HSG Dielheim/Malschenberg'])).toBe(true)
    expect(
      isFavoriteTeam('SG Heidel/Helm', ['SG Heidelsheim/Helmsheim/Gondelsheim']),
    ).toBe(true)
  })
})
