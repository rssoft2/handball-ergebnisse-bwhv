import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getReport,
  parseReport,
  REPORT_PARSER_VERSION,
} from './reports.js'
import { readReportRecord, writeReportRecord } from './reportStore.js'

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

function reportTextWithTwoMilestones() {
  const events = []
  let home = 0
  let away = 0
  const addGoal = (side) => {
    if (side === 'home') home += 1
    else away += 1
    const index = events.length
    const seconds = (index + 1) * 30
    const clock = `00:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    const playTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    const name = side === 'home' ? 'Max Muster' : 'Erik Beispiel'
    const nr = side === 'home' ? '7' : '9'
    const code = side === 'home' ? 'TVF' : 'SGHEIHELGON2'
    events.push(`${clock}  ${playTime}  ${home}:${away}  Tor durch ${name} (${nr}, ${code})`)
  }

  for (let i = 1; i <= 40; i += 1) addGoal('home')
  for (let i = 1; i <= 40; i += 1) addGoal('away')
  for (let i = 41; i <= 46; i += 1) addGoal('home')
  for (let i = 41; i <= 51; i += 1) addGoal('away')

  return [
    'Heim - Gast TV Forst - SG Hei/Hel/Gon 2 Endstand 46:51 (23:25)',
    'Heim: TV Forst',
    '7 Max Muster 2020 46',
    'Gast: SG Hei/Hel/Gon 2',
    '9 Erik Beispiel 2020 51',
    'Spielverlauf',
    ...events,
  ].join('\n')
}

describe('parseReport', () => {
  it('markiert das 40. Tor beider Mannschaften', () => {
    const report = parseReport(reportTextWithTwoMilestones())

    expect(report.milestones).toHaveLength(2)
    expect(report.milestones).toEqual([
      expect.objectContaining({ rank: 40, side: true, name: 'Max Muster', nr: '7' }),
      expect.objectContaining({ rank: 40, side: false, name: 'Erik Beispiel', nr: '9' }),
    ])
  })

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

function mockReportFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => reportText,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getReport', () => {
  it('lädt einen Bericht nur einmal und speichert den Rohtext', async () => {
    const fetchMock = mockReportFetch()

    const first = await getReport('report-cache-once')
    const second = await getReport('report-cache-once')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
    expect(await readReportRecord('report-cache-once')).toMatchObject({
      text: reportText,
      parserVersion: REPORT_PARSER_VERSION,
    })
  })

  it('parst bei veralteter Parser-Version aus dem gespeicherten Rohtext neu', async () => {
    await writeReportRecord({
      sGID: 'report-reparse',
      parsed: { stale: true },
      text: reportText,
      parserVersion: REPORT_PARSER_VERSION - 1,
      storedAt: 1,
    })
    const fetchMock = mockReportFetch()

    const report = await getReport('report-reparse')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(report.teams[0].players[0].name).toBe('Max Muster')
    expect(await readReportRecord('report-reparse')).toMatchObject({
      parserVersion: REPORT_PARSER_VERSION,
    })
  })

  it('lädt bei force bewusst neu', async () => {
    const fetchMock = mockReportFetch()

    await getReport('report-force')
    await getReport('report-force', true)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('dedupliziert parallele Aufrufe für denselben Bericht', async () => {
    const fetchMock = mockReportFetch()

    const [first, second] = await Promise.all([
      getReport('report-concurrent'),
      getReport('report-concurrent'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
  })
})
