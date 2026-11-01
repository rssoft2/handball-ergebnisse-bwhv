import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ClubLogo from './ClubLogo.jsx'

describe('ClubLogo', () => {
  it('zeigt das Logo eines bekannten Clubs', () => {
    const { container } = render(<ClubLogo name="HSG Ettlingen" />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute(
      'src',
      `${import.meta.env.BASE_URL}logos/clubs/hsg-ettlingen.svg`,
    )
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveClass('object-cover')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('zeigt breite Logos vollständiger an', () => {
    const { container } = render(<ClubLogo name="SG Pforzheim/Eutingen" />)
    expect(container.querySelector('img')).toHaveClass('object-contain')
  })

  it('zeigt für unbekannte Clubs nichts an', () => {
    const { container } = render(<ClubLogo name="MTG Wangen" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('blendet das Logo bei einem Ladefehler aus', () => {
    const { container } = render(<ClubLogo name="HSG Ettlingen" />)
    fireEvent.error(container.querySelector('img'))
    expect(container).toBeEmptyDOMElement()
  })
})
