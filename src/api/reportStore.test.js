import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { migrateLegacyReportCache, readReportRecord, writeReportRecord } from './reportStore.js'

describe('reportStore', () => {
  it('speichert und liest einen Bericht dauerhaft', async () => {
    const record = {
      sGID: 'store-1',
      parsed: { meta: { homeFull: 'HSG Ettlingen' }, teams: [] },
      text: 'Rohtext',
      parserVersion: 1,
      storedAt: 123,
    }

    expect(await writeReportRecord(record)).toBe(true)
    expect(await readReportRecord('store-1')).toEqual(record)
    expect(await readReportRecord('unbekannt')).toBeNull()
  })

  it('migriert den bisherigen v5-localStorage-Cache', async () => {
    const key = 'h4a:report:v5:legacy-1'
    const parsed = { meta: { homeFull: 'HSG Ettlingen' }, teams: [] }
    window.localStorage.setItem(key, JSON.stringify({ t: 456, v: parsed }))

    expect(await migrateLegacyReportCache(2)).toMatchObject({ migrated: 1, skipped: 0 })
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(await readReportRecord('legacy-1')).toMatchObject({
      sGID: 'legacy-1',
      parsed,
      text: null,
      parserVersion: 2,
      storedAt: 456,
    })
  })

  it('entfernt ältere localStorage-Berichte ohne Migration', async () => {
    const key = 'h4a:report:v4:legacy-2'
    window.localStorage.setItem(key, JSON.stringify({ t: 789, v: { stale: true } }))

    expect(await migrateLegacyReportCache(2)).toMatchObject({ removed: 1, migrated: 0 })
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(await readReportRecord('legacy-2')).toBeNull()
  })
})
