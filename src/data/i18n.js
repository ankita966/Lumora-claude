// Minimal, dependency-free i18n. Add a new language by adding a key here —
// e.g. `mr: { ... }` for Marathi — and it will show up automatically in the
// language switcher (see LANGUAGES below).

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
  // { code: 'mr', label: 'मरा' }, // ready to enable once translations are added
];

const dict = {
  en: {
    tagline: 'Next-generation inclusive learning platform',
    title: 'LUMORA WORLD',
    subtitle1: 'Every child learns differently.',
    subtitle2: 'Every child deserves a world where they can shine.',
    quote: '"Different ways of learning. One world where every child can shine."',
    enterWorld: 'Enter Lumora World',
    exploreWorlds: 'Explore the Worlds',
    childMode: 'Child Mode',
    parentPortal: 'Parent Portal',
    teacherClass: 'Teacher Class',
    specialistLab: 'Specialist Lab',
    worldMapTitle: 'LUMORA WORLD MAP',
    selectWorldHint: 'Select any world to enter its custom 5-round interactive quest',
    map: 'Map',
    home: 'Home',
    backToMap: 'Back to World Map',
    restart: 'Restart',
    exit: 'Exit',
  },
  hi: {
    tagline: 'अगली पीढ़ी का समावेशी शिक्षण मंच',
    title: 'लुमोरा वर्ल्ड',
    subtitle1: 'हर बच्चा अलग तरीके से सीखता है।',
    subtitle2: 'हर बच्चा एक ऐसी दुनिया का हकदार है जहाँ वह चमक सके।',
    quote: '"सीखने के अलग-अलग तरीके। एक दुनिया जहाँ हर बच्चा चमक सकता है।"',
    enterWorld: 'लुमोरा वर्ल्ड में जाएं',
    exploreWorlds: 'दुनिया खोजें',
    childMode: 'बाल मोड',
    parentPortal: 'अभिभावक पोर्टल',
    teacherClass: 'शिक्षक कक्षा',
    specialistLab: 'विशेषज्ञ लैब',
    worldMapTitle: 'लुमोरा विश्व मानचित्र',
    selectWorldHint: 'अपनी 5-राउंड यात्रा शुरू करने के लिए एक दुनिया चुनें',
    map: 'नक्शा',
    home: 'होम',
    backToMap: 'नक्शे पर वापस जाएं',
    restart: 'फिर से शुरू करें',
    exit: 'बाहर जाएं',
  },
};

export function t(lang, key) {
  return dict[lang]?.[key] ?? dict.en[key] ?? key;
}
