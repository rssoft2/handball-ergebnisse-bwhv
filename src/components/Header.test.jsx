import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Header from './Header.jsx'

function srcs(container) {
  return [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'))
}

describe('Header', () => {
  it('zeigt das Club-Logo auf der Teamseite', () => {
    const { container } = render(
      <Header meta={{ name: 'HSG Ettlingen', logoName: 'HSG Ettlingen' }} />,
    )

    expect(srcs(container)).toEqual([
      `${import.meta.env.BASE_URL}logos/clubs/hsg-ettlingen.svg`,
    ])
  })

  it('behält das App-Icon, wenn kein Club-Logo vorhanden ist', () => {
    const { container } = render(
      <Header meta={{ name: 'MTG Wangen', logoName: 'MTG Wangen' }} />,
    )

    expect(srcs(container)).toEqual([`${import.meta.env.BASE_URL}icons/icon-64.png`])
  })
})
