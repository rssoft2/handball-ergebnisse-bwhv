import { describe, expect, it } from 'vitest'
import { resinStatus } from './resin.js'

describe('resinStatus', () => {
  it('detects explicit permission and bans', () => {
    expect(resinStatus('Haftmittel erlaubt')).toBe('allowed')
    expect(resinStatus('Absolutes Haftmittelverbot')).toBe('forbidden')
    expect(resinStatus('Regelung Haftmittelverbot: Im Spielbetrieb gilt absolutes Harzverbot.')).toBe(
      'forbidden',
    )
  })

  it('marks water-soluble resin and exceptions as limited', () => {
    expect(
      resinStatus('Regelung Haftmittelverbot: wasserlösliche Haftmittel erlaubt'),
    ).toBe('allowed')
    expect(
      resinStatus(
        'Regelung Haftmittelverbot: Haftmittel ist nur bei Spielen der Regionalliga und Oberliga erlaubt',
      ),
    ).toBe('limited')
    expect(
      resinStatus(
        'Regelung Haftmittelverbot: Verbot, Ausnahme: Seniorenmannschaften erlaubt',
      ),
    ).toBe('limited')
    expect(
      resinStatus(
        'Regelung Haftmittelverbot: für Aktive erlaubt, für die B-Jugend absolutes Haftmittelverbot',
      ),
    ).toBe('limited')
  })

  it('returns null when the rule is missing or unclear', () => {
    expect(resinStatus('')).toBeNull()
    expect(resinStatus(null)).toBeNull()
    expect(resinStatus('Regelung Haftmittelverbot: siehe Verzeichnis auf der Homepage')).toBeNull()
    expect(resinStatus('Freigabe für den Spielbetrieb auf Bezirks-Ebene')).toBeNull()
  })
})
