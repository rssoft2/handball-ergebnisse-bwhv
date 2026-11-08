import { describe, expect, it } from 'vitest'
import { aggregatePenalties, aggregateScorers, filterPlayersByTeam } from './leagueStats.js'

const players = [
  { name: 'Max Muster', team: 'HSG Ettlingen' },
  { name: 'Erik Beispiel', team: 'SG Pforzheim/Eutingen' },
]

const penaltyReport = {
  teams: [
    {
      label: 'HSG Ettlingen',
      players: [
        { nr: '1', name: 'Nur Tore', goals: 3, seven: '0/0', cards: [] },
        { nr: '2', name: 'Gelb', goals: 0, seven: '0/0', cards: [{ kind: 'yellow' }] },
        { nr: '3', name: 'Rot', goals: 0, seven: '0/0', cards: [{ kind: 'red' }] },
        { nr: '4', name: 'Blau', goals: 0, seven: '0/0', cards: [{ kind: 'blue' }] },
        { nr: '5', name: 'Zwei', goals: 0, seven: '0/0', cards: [{ kind: 'two' }] },
        {
          nr: '6',
          name: 'Gemischt',
          goals: 0,
          seven: '0/0',
          cards: [{ kind: 'yellow' }, { kind: 'blue' }],
        },
        {
          nr: '7',
          name: 'Mehr Rot',
          goals: 0,
          seven: '0/0',
          cards: [{ kind: 'red' }, { kind: 'yellow' }],
        },
      ],
    },
  ],
}

describe('aggregatePenalties', () => {
  it('zählt Karten und ignoriert Spieler ohne Karten', () => {
    const rows = aggregatePenalties([penaltyReport])
    const gemischt = rows.find((p) => p.name === 'Gemischt')

    expect(rows.map((p) => p.name)).not.toContain('Nur Tore')
    expect(gemischt).toMatchObject({ yellow: 1, two: 0, red: 0, blue: 1, total: 2 })
  })

  it('zählt eine direkte rote Karte doppelt', () => {
    const report = {
      teams: [
        {
          label: 'HSG Ettlingen',
          players: [
            { nr: '8', name: 'Direkt Rot', goals: 0, seven: '0/0', cards: [{ kind: 'red' }] },
          ],
        },
      ],
    }

    expect(aggregatePenalties([report])[0]).toMatchObject({ red: 2, total: 2 })
  })

  it('zählt eine indirekte rote Karte einfach', () => {
    const report = {
      teams: [
        {
          label: 'HSG Ettlingen',
          players: [
            {
              nr: '9',
              name: 'Indirekt Rot',
              goals: 0,
              seven: '0/0',
              cards: [{ kind: 'red', indirect: true }],
            },
          ],
        },
      ],
    }

    expect(aggregatePenalties([report])[0]).toMatchObject({ red: 1, total: 1 })
  })

  it('sortiert nach Gesamt, 2 Min, Rot, Gelb, Name', () => {
    expect(aggregatePenalties([penaltyReport]).map((p) => p.name)).toEqual([
      'Mehr Rot',
      'Rot',
      'Gemischt',
      'Zwei',
      'Gelb',
      'Blau',
    ])
  })

  it('sortiert bei gleicher Gesamtzahl 2 Minuten vor Rot', () => {
    const report = {
      teams: [
        {
          label: 'HSG Ettlingen',
          players: [
            {
              nr: '10',
              name: 'Rot',
              goals: 0,
              seven: '0/0',
              cards: [{ kind: 'red', indirect: true }],
            },
            {
              nr: '11',
              name: 'Zwei',
              goals: 0,
              seven: '0/0',
              cards: [{ kind: 'two' }],
            },
          ],
        },
      ],
    }

    expect(aggregatePenalties([report]).map((p) => p.name)).toEqual(['Zwei', 'Rot'])
  })

  it('lässt die Torschützenliste unverändert', () => {
    expect(aggregateScorers([penaltyReport]).map((p) => p.name)).toEqual(['Nur Tore'])
  })
})

describe('filterPlayersByTeam', () => {
  it('behält nur Spieler des gewählten Teams', () => {
    expect(filterPlayersByTeam(players, 'HSG Ettlingen', {})).toEqual([players[0]])
  })

  it('nutzt die Kurznamen-Zuordnung aus der Liga', () => {
    const rows = [{ name: 'Erik Beispiel', team: 'SG PF/Eutingen' }]
    const nameMap = { 'SG PF/Eutingen': 'SG Pforzheim/Eutingen' }

    expect(filterPlayersByTeam(rows, 'SG Pforzheim/Eutingen', nameMap)).toEqual(rows)
  })

  it('trennt Mannschaftsnummern', () => {
    const rows = [
      { name: 'Max Muster', team: 'HSG Ettlingen' },
      { name: 'Max Muster', team: 'HSG Ettlingen 2' },
    ]

    expect(filterPlayersByTeam(rows, 'HSG Ettlingen 2', {})).toEqual([rows[1]])
  })

  it('liefert ohne Team alle Spieler', () => {
    expect(filterPlayersByTeam(players, '', {})).toEqual(players)
  })
})
