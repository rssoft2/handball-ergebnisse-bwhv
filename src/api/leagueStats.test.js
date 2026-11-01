import { describe, expect, it } from 'vitest'
import { filterScorersByTeam } from './leagueStats.js'

const players = [
  { name: 'Max Muster', team: 'HSG Ettlingen' },
  { name: 'Erik Beispiel', team: 'SG Pforzheim/Eutingen' },
]

describe('filterScorersByTeam', () => {
  it('behält nur Spieler des gewählten Teams', () => {
    expect(filterScorersByTeam(players, 'HSG Ettlingen', {})).toEqual([players[0]])
  })

  it('nutzt die Kurznamen-Zuordnung aus der Liga', () => {
    const rows = [{ name: 'Erik Beispiel', team: 'SG PF/Eutingen' }]
    const nameMap = { 'SG PF/Eutingen': 'SG Pforzheim/Eutingen' }

    expect(filterScorersByTeam(rows, 'SG Pforzheim/Eutingen', nameMap)).toEqual(rows)
  })

  it('trennt Mannschaftsnummern', () => {
    const rows = [
      { name: 'Max Muster', team: 'HSG Ettlingen' },
      { name: 'Max Muster', team: 'HSG Ettlingen 2' },
    ]

    expect(filterScorersByTeam(rows, 'HSG Ettlingen 2', {})).toEqual([rows[1]])
  })

  it('liefert ohne Team alle Spieler', () => {
    expect(filterScorersByTeam(players, '', {})).toEqual(players)
  })
})
