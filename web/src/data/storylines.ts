import type { Storyline } from '../types/domain';

export const storylinesData: Storyline[] = [
  {
    id: 'ledecky-titmus-400',
    title: 'Ledecky vs. Titmus: The 400m Free Rivalry',
    summary: 'The distance rivalry that defined the Tokyo Olympics and continues into Paris. Can Titmus defend her 400m title, or will Ledecky reclaim dominance in the middle distance?',
    keyAthletes: ['Katie Ledecky', 'Ariarne Titmus'],
    keyEvents: ['Olympic Games 2024', 'World Aquatics Championships 2025'],
    timeline: [
      { id: 't1', title: 'Tokyo 2021', description: 'Titmus wins 400m Free gold', date: '2021-07-26', type: 'result' },
      { id: 't2', title: 'Worlds 2023', description: 'Ledecky reclaims 800m/1500m', date: '2023-07', type: 'result' },
      { id: 't3', title: 'Paris 2024', description: '400m Free showdown', date: '2024-07', type: 'upcoming' },
    ],
  },
  {
    id: 'popovici-sprint',
    title: "Popovici's Sprint Dominance",
    summary: 'After shattering the 100m freestyle world record, all eyes are on the young Romanian to see if he can go even faster and defend his titles.',
    keyAthletes: ['David Popovici'],
    keyEvents: ['World Aquatics Championships', 'European Championships'],
    timeline: [
      { id: 'p1', title: 'World Record', description: '46.86 in 100m Free', date: '2022-08', type: 'milestone' },
      { id: 'p2', title: 'Worlds 2024', description: 'Double gold 100/200 Free', date: '2024-02', type: 'result' },
      { id: 'p3', title: 'Paris 2024', description: 'Olympic debut', date: '2024-07', type: 'upcoming' },
    ],
  },
  {
    id: 'marchand-im',
    title: "Marchand and the Sub-4:00 400m IM",
    summary: 'The French superstar is reportedly hitting times in practice that suggest the first ever sub-4 minute 400m IM is possible at a major meet.',
    keyAthletes: ['Léon Marchand'],
    keyEvents: ['World Aquatics Championships 2025', 'Olympic Games 2024'],
    timeline: [
      { id: 'm1', title: 'NCAA Dominance', description: 'Arizona State, multiple records', date: '2023-2024', type: 'result' },
      { id: 'm2', title: 'Worlds 2025', description: 'Target: sub-4:00 400m IM', date: '2025', type: 'upcoming' },
    ],
  },
];
