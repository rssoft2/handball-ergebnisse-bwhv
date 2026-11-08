import { describe, expect, it } from 'vitest'
import { parseReport } from './reports.js'

const reportText = [
  'Heim - Gast HSG Ettlingen - SG Gegner Endstand 10:9 (5:4)',
  'Heim: HSG Ettlingen',
  '7 Max Muster 2020 0',
  'Gast: SG Gegner',
  '3 Erik Beispiel 2020 0',
  'Spielverlauf',
  '00:01:00  01:00  Verwarnung für Max Muster (7, HSG)',
  '00:02:00  02:00  2-min Strafe für Max Muster (7, HSG)',
  '00:03:00  03:00  2-min Strafe für Max Muster (7, HSG)',
  '00:04:00  04:00  2-min Strafe für Max Muster (7, HSG)',
  '00:05:00  05:00  Disqualifikation für Erik Beispiel (3, SGGEG)',
].join('\n')

describe('parseReport', () => {
  it('markiert die rote Karte aus der dritten Zeitstrafe als indirekt', () => {
    const report = parseReport(reportText)
    const max = report.teams[0].players[0]

    expect(max.cards).toEqual([
      { kind: 'yellow', time: '01:00', indirect: false },
      { kind: 'two', time: '02:00', indirect: false },
      { kind: 'two', time: '03:00', indirect: false },
      { kind: 'red', time: '04:00', indirect: true },
    ])
  })

  it('lässt eine direkte rote Karte unmarkiert', () => {
    const report = parseReport(reportText)
    const erik = report.teams[1].players[0]

    expect(erik.cards).toEqual([{ kind: 'red', time: '05:00', indirect: false }])
  })
})
