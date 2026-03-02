import type { ExploreLane, FollowEntity } from '../types/domain';

const sprintStars: FollowEntity[] = [
  { id: 'popovici', type: 'athlete', name: 'David Popovici', meta: { country: 'ROU' } },
  { id: 'dressel', type: 'athlete', name: 'Caeleb Dressel', meta: { country: 'USA' } },
];
const imLegends: FollowEntity[] = [
  { id: 'marchand', type: 'athlete', name: 'Léon Marchand', meta: { country: 'FRA' } },
  { id: 'phelps', type: 'athlete', name: 'Michael Phelps', meta: { country: 'USA' } },
];
const ncaaWatch: FollowEntity[] = [
  { id: 'marchand', type: 'athlete', name: 'Léon Marchand', meta: { country: 'FRA' } },
  { id: 'douglass', type: 'athlete', name: 'Kate Douglass', meta: { country: 'USA' } },
];

export const exploreLanes: ExploreLane[] = [
  {
    id: 'sprint-stars',
    title: 'Sprint Stars',
    description: '50m and 100m freestyle specialists and the race for the wall.',
    recommendedFollows: sprintStars,
    imageId: '1534438327276-14e5300c3a48',
  },
  {
    id: 'im-legends',
    title: 'IM Legends',
    description: 'Individual medley dominance and the quest for the perfect 200m/400m IM.',
    recommendedFollows: imLegends,
    imageId: '1560174038-da43ac74f01b',
  },
  {
    id: 'ncaa-watch',
    title: 'NCAA Watch',
    description: 'College swimming highlights, dual meets, and NCAAs.',
    recommendedFollows: ncaaWatch,
    imageId: '1571019614242-5b2c2c1700b0',
  },
  {
    id: 'technique-training',
    title: 'Technique & Training',
    description: 'Starts, turns, stroke technique, and periodization.',
    recommendedFollows: [],
    imageId: '1541535648570-3c2b9a5142a0',
  },
  {
    id: 'distance-queens',
    title: 'Distance & Endurance',
    description: '800m, 1500m, and open water storylines.',
    recommendedFollows: [
      { id: 'ledecky', type: 'athlete', name: 'Katie Ledecky', meta: { country: 'USA' } },
      { id: 'titmus', type: 'athlete', name: 'Ariarne Titmus', meta: { country: 'AUS' } },
    ],
    imageId: '1534438327276-14e5300c3a48',
  },
];
