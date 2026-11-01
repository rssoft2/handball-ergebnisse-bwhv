import { describe, expect, it } from 'vitest'
import { clubLogoFor, clubLogoUrl } from './clubLogos.js'

describe('clubLogos', () => {
  it('findet ein exaktes Club-Logo', () => {
    expect(clubLogoFor('HSG Ettlingen')?.file).toBe('hsg-ettlingen.svg')
  })

  it('ignoriert die Mannschaftsnummer', () => {
    expect(clubLogoFor('HSG Ettlingen 2')?.file).toBe('hsg-ettlingen.svg')
  })

  it('findet Kurzformen über Aliasse', () => {
    expect(clubLogoFor('SG PF/Eutingen')?.file).toBe('sg-pforzheim-eutingen.svg')
    expect(clubLogoFor('SG Pforzheim/Eutingen e.V.')?.file).toBe(
      'sg-pforzheim-eutingen.svg',
    )
  })

  it('liefert für unbekannte Clubs kein Logo', () => {
    expect(clubLogoFor('MTG Wangen')).toBeNull()
    expect(clubLogoFor('')).toBeNull()
  })

  it('baut die Logo-URL aus der Vite-Basis', () => {
    const logo = clubLogoFor('TV Malsch')
    expect(clubLogoUrl(logo)).toBe(`${import.meta.env.BASE_URL}logos/clubs/tv-malsch.jpg`)
  })
})
