import type { LearnModule } from '../types/domain';

export const learnModules: LearnModule[] = [
  {
    id: 'stroke-rules',
    title: 'Stroke Rules Quick Quiz',
    description: 'Test your knowledge of legal technique in each stroke.',
    type: 'quiz',
    steps: [
      { question: 'In butterfly, how many arm strokes are allowed per kick cycle?', options: ['One', 'Two', 'One per arm'], correctIndex: 1 },
      { question: 'In backstroke, can you turn onto your front before the wall?', options: ['Yes, anytime', 'Only during the turn', 'Never'], correctIndex: 1 },
      { question: 'In breaststroke, the hands must not go past the hip line except during the first stroke after start/turn.', options: ['True', 'False'], correctIndex: 0 },
    ],
  },
  {
    id: 'race-strategy',
    title: 'Race Strategy Checklist',
    description: 'A simple checklist for pacing and race day.',
    type: 'checklist',
    steps: [
      { content: 'Negative split the second half of the race when possible.' },
      { content: 'Build the last 25m in sprint events.' },
      { content: 'Know your split targets before the race.' },
      { content: 'Warm down properly after the race.' },
    ],
  },
  {
    id: 'guess-split',
    title: 'Guess the Split',
    description: 'Match the 100m split to the total 200m time.',
    type: 'guess_split',
    steps: [
      { content: 'If the first 100m is 52.0, a well-paced 200m Free might be around...', options: ['1:44.0', '1:46.0', '1:48.0'], correctIndex: 0 },
      { content: 'A 400m IM opening 100m (fly) in 54.0 often leads to a total near...', options: ['4:08', '4:12', '4:16'], correctIndex: 0 },
    ],
  },
  {
    id: 'starts-turns',
    title: 'Starts & Turns Basics',
    description: 'Quick rules for starts and turns.',
    type: 'info',
    steps: [
      { content: 'On the start signal, you may dive. In backstroke, feet must be under the water at the start.' },
      { content: 'In freestyle and backstroke, you may do a flip turn and push off on your back (backstroke must finish on back).' },
      { content: 'In breaststroke and butterfly, both hands must touch the wall simultaneously at turns and finish.' },
    ],
  },
  {
    id: 'open-water',
    title: 'Open Water 101',
    description: 'Brief intro to open water racing.',
    type: 'info',
    steps: [
      { content: 'Races are typically 5k, 10k, or 25k. 10k is the Olympic distance.' },
      { content: 'Drafting is legal and important for energy conservation.' },
      { content: 'Feeding stations allow nutrition during longer races.' },
    ],
  },
];
