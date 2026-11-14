import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReportTimelineScreen from './ReportTimelineScreen.jsx'

const data = {
  hasData: true,
  meta: {
    league: 'männliche C-Jugend Bezirksliga',
    homeFull: 'TV Forst',
    awayFull: 'SG Hei/Hel/Gon 2',
    homeGoals: 46,
    awayGoals: 51,
  },
  codeLabels: {
    TVF: 'TV Forst',
    SGHEIHELGON2: 'SG Hei/Hel/Gon 2',
  },
  events: [
    {
      type: 'goal',
      clock: '00:20:00',
      playTime: '20:00',
      score: '40:40',
      name: 'Max Muster',
      nr: '7',
      teamCode: 'TVF',
      side: true,
      teamGoalRank: 40,
      missed: false,
    },
    {
      type: 'goal',
      clock: '00:21:00',
      playTime: '21:00',
      score: '40:41',
      name: 'Erik Beispiel',
      nr: '9',
      teamCode: 'SGHEIHELGON2',
      side: false,
      teamGoalRank: 40,
      missed: false,
    },
  ],
  milestones: [
    { rank: 40, side: true, name: 'Max Muster', nr: '7' },
    { rank: 40, side: false, name: 'Erik Beispiel', nr: '9' },
  ],
}

describe('ReportTimelineScreen', () => {
  it('markiert das 40. Tor beider Mannschaften', () => {
    render(
      <ReportTimelineScreen
        report={{ status: 'ok', data }}
        game={{ home: 'TV Forst', away: 'SG Hei/Hel/Gon 2', done: true, homeGoals: 46, awayGoals: 51 }}
        favoriteTeams={[]}
      />,
    )

    expect(screen.getAllByText(/40\.\s*Tor/)).toHaveLength(2)
  })
})
