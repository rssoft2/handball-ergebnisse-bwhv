import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ResinBadge from './ResinBadge.jsx'

describe('ResinBadge', () => {
  it('shows the allowed droplet', () => {
    render(<ResinBadge wax="Haftmittel erlaubt" />)
    expect(screen.getByRole('img', { name: 'Haftmittel erlaubt' })).toHaveAttribute(
      'data-status',
      'allowed',
    )
  })

  it('shows the forbidden droplet', () => {
    render(<ResinBadge wax="Absolutes Haftmittelverbot" />)
    expect(screen.getByRole('img', { name: 'Haftmittel verboten' })).toHaveAttribute(
      'data-status',
      'forbidden',
    )
  })

  it('shows the limited droplet', () => {
    render(
      <ResinBadge wax="Regelung Haftmittelverbot: Haftmittel ist nur bei Oberliga-Spielen erlaubt" />,
    )
    expect(
      screen.getByRole('img', { name: 'Haftmittel eingeschränkt erlaubt' }),
    ).toHaveAttribute('data-status', 'limited')
  })

  it('shows a hint with the rule on hover', async () => {
    render(<ResinBadge wax="Absolutes Haftmittelverbot" />)
    const icon = screen.getByRole('img', { name: 'Haftmittel verboten' })

    await userEvent.hover(icon)
    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('Haftmittel verboten')
    expect(tip).toHaveTextContent('Absolutes Haftmittelverbot')

    await userEvent.unhover(icon)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders nothing without a clear rule', () => {
    const { container } = render(<ResinBadge wax="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
