export const WORLDS = {
  soundForest: {
    key: 'soundForest',
    name: 'Sound Forest',
    icon: '🌲',
    color: '#38B6FF',
    focus: 'Sound Blend · Voice · Letter Hunt · Spell Builder',
    skill: 'sound',
    roundCount: 5,
    gridArea: '1 / 1',
  },
  storyCastle: {
    key: 'storyCastle',
    name: 'Story Castle',
    icon: '🏰',
    color: '#E5A83B',
    focus: 'Magic Words · Read Aloud · Word Hunt · Comprehension',
    skill: 'reading',
    roundCount: 5,
    gridArea: '1 / 3',
  },
  visionValley: {
    key: 'visionValley',
    name: 'Vision Valley',
    icon: '👁️',
    color: '#48B8D0',
    focus: 'Track & Touch · Color Match · Spot Diff · Pattern',
    skill: 'vision',
    roundCount: 5,
    gridArea: '1 / 2',
    center: true,
  },
  runeRealm: {
    key: 'runeRealm',
    name: 'Rune Realm',
    icon: '✍️',
    color: '#FF2E93',
    focus: 'Shapes · Letters · Numbers · Rune Magic · Fine Motor',
    skill: 'motor',
    roundCount: 5,
    gridArea: '2 / 1',
  },
  memoryMountains: {
    key: 'memoryMountains',
    name: 'Memory Mountains',
    icon: '🧠',
    color: '#A47BE0',
    focus: 'Remember Items · Missing Object · Order Recall · Sequence',
    skill: 'memory',
    roundCount: 5,
    gridArea: '2 / 2',
  },
};

export const WORLD_ORDER = ['soundForest', 'visionValley', 'storyCastle', 'runeRealm', 'memoryMountains'];

export const AVATARS = [
  { name: 'Kai', role: 'Voice Ace', icon: '🦊', ring: '#48B8D0' },
  { name: 'Maya', role: 'Story Hero', icon: '🦉', ring: '#FF2E93' },
  { name: 'Leo', role: 'Sound Master', icon: '🐯', ring: '#38B6FF' },
  { name: 'Zara', role: 'Rune Writer', icon: '🦋', ring: '#E5A83B' },
  { name: 'Aria', role: 'Memory Champ', icon: '🐼', ring: '#A47BE0' },
];
