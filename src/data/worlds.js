export const WORLDS = {
  soundForest: {
    key: 'soundForest',
    name: 'Sound Forest',
    icon: '🌲',
    color: '#3ee08a',
    focus: 'Sound Blend · Voice · Letter Hunt · Spell Builder',
    skill: 'sound',
    roundCount: 5,
    gridArea: '1 / 1',
  },
  storyCastle: {
    key: 'storyCastle',
    name: 'Story Castle',
    icon: '🏰',
    color: '#ffc857',
    focus: 'Magic Words · Read Aloud · Word Hunt · Comprehension',
    skill: 'reading',
    roundCount: 5,
    gridArea: '1 / 3',
  },
  visionValley: {
    key: 'visionValley',
    name: 'Vision Valley',
    icon: '👁️',
    color: '#4fd8ff',
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
    color: '#ff5cad',
    focus: 'Shapes · Letters · Numbers · Rune Magic · Fine Motor',
    skill: 'motor',
    roundCount: 5,
    gridArea: '2 / 1',
  },
  memoryMountains: {
    key: 'memoryMountains',
    name: 'Memory Mountains',
    icon: '🧠',
    color: '#b98bff',
    focus: 'Remember Items · Missing Object · Order Recall · Sequence',
    skill: 'memory',
    roundCount: 5,
    gridArea: '2 / 2',
  },
};

export const WORLD_ORDER = ['soundForest', 'visionValley', 'storyCastle', 'runeRealm', 'memoryMountains'];

export const AVATARS = [
  { name: 'Kai', role: 'Voice Ace', icon: '🦊', ring: '#4fd8ff' },
  { name: 'Maya', role: 'Story Hero', icon: '🦉', ring: '#ff5cad' },
  { name: 'Leo', role: 'Sound Master', icon: '🐯', ring: '#3ee08a' },
  { name: 'Zara', role: 'Rune Writer', icon: '🦋', ring: '#ffc857' },
  { name: 'Aria', role: 'Memory Champ', icon: '🐼', ring: '#b98bff' },
];
