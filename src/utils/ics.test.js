import { describe, expect, it } from 'vitest'
import { buildTeamCalendarIcs, teamCalendarFilename } from './ics.js'

const played = {
  id: 'g1',
  date: '25.10.2026',
  time: '17:00',
  home: 'HSG Ettlingen',
  away: 'TSV Beispiel',
  leagueName: 'Bezirksliga',
  venue: 'Sporthalle',
  street: 'Musterstraße 1',
  postal: '76275',
  town: 'Ettlingen',
  homeGoals: 32,
  awayGoals: 28,
  done: true,
}

const upcoming = {
  id: 'g2',
  date: '01.11.2026',
  time: '19:30',
  home: 'SG A',
  away: 'SG B',
  leagueName: 'Kreisliga',
  venue: 'Halle X',
  street: 'Schulstraße 2',
  postal: '76133',
  town: 'Karlsruhe',
}

const now = new Date('2026-11-11T12:00:00Z')

describe('buildTeamCalendarIcs', () => {
  it('exportiert vergangene und kommende Spiele ohne Ergebnisse', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      games: [upcoming, played],
      now,
    })

    expect(ics).toContain('BEGIN:VCALENDAR\r\n')
    expect(ics).toContain('X-WR-CALNAME:Spielplan HSG Ettlingen')
    expect(ics).toContain('X-WR-TIMEZONE:Europe/Berlin')
    expect(ics).toContain('BEGIN:VTIMEZONE')
    expect(ics).toContain('SUMMARY:HSG Ettlingen – TSV Beispiel')
    expect(ics).toContain('SUMMARY:SG A – SG B')
    expect(ics).not.toContain('32:28')
    expect(ics).not.toContain('Ergebnis:')
    expect(ics.indexOf('UID:g1@')).toBeLessThan(ics.indexOf('UID:g2@'))
  })

  it('stellt das Liga-Kürzel im Titel voran', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      leagueShortName: 'mb-BL-SR',
      games: [played],
      now,
    })

    expect(ics).toContain('SUMMARY:[mb-BL-SR] HSG Ettlingen – TSV Beispiel')
  })

  it('lässt den Titel ohne Liga-Kürzel unverändert', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      leagueShortName: '   ',
      games: [played],
      now,
    })

    expect(ics).toContain('SUMMARY:HSG Ettlingen – TSV Beispiel')
  })

  it('setzt Start, Ende und Ort korrekt', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      games: [played],
      now,
    })

    expect(ics).toContain('DTSTAMP:20261111T120000Z')
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261025T170000')
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20261025T183000')
    expect(ics).toContain('LOCATION:Sporthalle\\, Musterstraße 1\\, 76275 Ettlingen')
    expect(ics).toContain(
      'DESCRIPTION:Bezirksliga\\nHeim: HSG Ettlingen\\nGast: TSV Beispiel',
    )
  })

  it('behandelt Spiele ohne Uhrzeit als ganztägig', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      games: [{ id: 'g3', date: '02.11.2026', home: 'A', away: 'B' }],
      now,
    })

    expect(ics).toContain('DTSTART;VALUE=DATE:20261102')
    expect(ics).toContain('DTEND;VALUE=DATE:20261103')
  })

  it('faltet lange Zeilen auf höchstens 75 Bytes', () => {
    const ics = buildTeamCalendarIcs({
      teamName: `HSG ${'A'.repeat(80)}`,
      games: [played],
      now,
    })
    const encoder = new TextEncoder()

    expect(ics.split('\r\n').filter((line) => encoder.encode(line).length > 75)).toEqual([])
  })

  it('beendet Spiele nach Mitternacht am Folgetag', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      games: [{ id: 'g4', date: '02.11.2026', time: '23:30', home: 'A', away: 'B' }],
      now,
    })

    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261102T233000')
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20261103T010000')
  })

  it('dedupliziert Spiele anhand der ID', () => {
    const ics = buildTeamCalendarIcs({
      teamName: 'HSG Ettlingen',
      games: [played, played],
      now,
    })

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })
})

describe('teamCalendarFilename', () => {
  it('erzeugt einen sicheren Dateinamen', () => {
    expect(teamCalendarFilename('SG Pforzheim/Eutingen')).toBe(
      'Spielplan-SG-Pforzheim-Eutingen.ics',
    )
    expect(teamCalendarFilename('HSG Größe')).toBe('Spielplan-HSG-Groesse.ics')
  })
})
