import { create } from 'zustand';
import { computeProfile, recommendNextActivity } from '../adaptive/engine';
import { WORLD_ORDER } from '../data/worlds';

const STORAGE_KEY = 'lumora-save-v1';

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: state.xp,
        activityLog: state.activityLog,
        worldsCompleted: state.worldsCompleted,
        sessionsCompleted: state.sessionsCompleted,
        totalTimeMs: state.totalTimeMs,
        calmMode: state.calmMode,
        language: state.language,
      })
    );
  } catch {
    /* localStorage unavailable — continue without persistence */
  }
}

const saved = loadSave();

export const useGameStore = create((set, get) => ({
  screen: 'landing', // landing | map | <worldKey> | parent | specialist
  activeWorld: null,
  userMode: 'child', // child | parent | teacher | specialist — landing mode chips

  xp: saved?.xp ?? 15200,
  calmMode: saved?.calmMode ?? false,
  language: saved?.language ?? 'en',

  handConnected: false,

  activityLog: saved?.activityLog ?? [], // { world, round, skill, accuracy, attempts, timeMs, ts }
  worldsCompleted: saved?.worldsCompleted ?? {}, // { [worldKey]: true }
  sessionsCompleted: saved?.sessionsCompleted ?? 3,
  totalTimeMs: saved?.totalTimeMs ?? 1000 * 60 * 42,
  sessionStartedAt: Date.now(),

  setScreen: (screen, world = null) => set({ screen, activeWorld: world }),

  setUserMode: (mode) => {
    set({ userMode: mode });
    if (mode === 'parent') set({ screen: 'parent' });
    else if (mode === 'specialist') set({ screen: 'specialist' });
    else if (mode === 'teacher') set({ screen: 'specialist' });
  },

  setHandConnected: (v) => set({ handConnected: v }),

  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

  toggleCalm: () => set((s) => ({ calmMode: !s.calmMode })),
  setLanguage: (language) => set({ language }),

  logActivity: ({ world, round, skill, accuracy, attempts, timeMs }) => {
    set((s) => {
      const entry = { world, round, skill, accuracy, attempts, timeMs, ts: Date.now() };
      const activityLog = [...s.activityLog, entry].slice(-200);
      const totalTimeMs = s.totalTimeMs + timeMs;
      const next = { activityLog, totalTimeMs };
      persist({ ...s, ...next });
      return next;
    });
  },

  completeWorld: (worldKey) => {
    set((s) => {
      const worldsCompleted = { ...s.worldsCompleted, [worldKey]: true };
      const sessionsCompleted = s.sessionsCompleted + 1;
      const next = { worldsCompleted, sessionsCompleted };
      persist({ ...s, ...next });
      return next;
    });
  },

  getProfile: () => computeProfile(get().activityLog),
  getRecommendation: () => recommendNextActivity(computeProfile(get().activityLog)),

  resetProgress: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      xp: 15200,
      activityLog: [],
      worldsCompleted: {},
      sessionsCompleted: 0,
      totalTimeMs: 0,
    });
  },
}));

export { WORLD_ORDER };
