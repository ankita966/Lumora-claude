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
        cameraGrid: state.cameraGrid,
        cameraSensitivity: state.cameraSensitivity,
        cameraOptIn: state.cameraOptIn,
        soundFxEnabled: state.soundFxEnabled,
        soundFxVolume: state.soundFxVolume,
        sensoryProfile: state.sensoryProfile,
      })
    );
  } catch {
    /* localStorage unavailable */
  }
}

const saved = loadSave();

export const useGameStore = create((set, get) => ({
  screen: 'landing', // landing | map | <worldKey> | parent | specialist
  activeWorld: null,
  homeRequested: false,
  authPortal: null,
  authMode: 'login',
  userMode: 'child',

  xp: saved?.xp ?? 15200,
  calmMode: saved?.calmMode ?? false,
  language: saved?.language ?? 'en',

  // Pro Camera Controls
  cameraGrid: saved?.cameraGrid ?? 'none', // 'none' | 'thirds' | 'crosshair' | 'box'
  cameraOptIn: saved?.cameraOptIn ?? false, // camera NEVER starts without explicit user gesture (C3)
  cameraSensitivity: saved?.cameraSensitivity ?? 0.35, // 0.15 - 0.75

  // Sensory & Audio Studio Settings
  soundFxEnabled: saved?.soundFxEnabled ?? true,
  soundFxVolume: saved?.soundFxVolume ?? 0.7,
  sensoryProfile: saved?.sensoryProfile ?? 'vibrant', // 'vibrant' | 'gentle' | 'focus' | 'contrast'

  handConnected: false,

  activityLog: saved?.activityLog ?? [],
  worldsCompleted: saved?.worldsCompleted ?? {},
  sessionsCompleted: saved?.sessionsCompleted ?? 3,
  totalTimeMs: saved?.totalTimeMs ?? 1000 * 60 * 42,
  sessionStartedAt: Date.now(),

  setScreen: (screen, world = null) => set({ screen, activeWorld: world, homeRequested: false }),
  goHome: () => set({ screen: 'landing', activeWorld: null, homeRequested: true }),
  setAuthPortal: (authPortal) => set({ authPortal }),
  setAuthMode: (authMode) => set({ authMode }),

  setUserMode: (mode) => {
    set({ userMode: mode });
    if (mode === 'child') set({ screen: 'map', homeRequested: false });
    else if (mode === 'parent') set({ screen: 'parent', homeRequested: false });
    else if (mode === 'specialist') set({ screen: 'specialist', homeRequested: false });
    else if (mode === 'teacher') set({ screen: 'teacher', homeRequested: false });
    else if (mode === 'school_admin') set({ screen: 'schoolAdmin', homeRequested: false });
  },

  setHandConnected: (v) => set({ handConnected: v }),

  // Camera & Sensory actions
  setCameraGrid: (cameraGrid) => set((s) => {
    const next = { cameraGrid };
    persist({ ...s, ...next });
    return next;
  }),
  setCameraOptIn: (cameraOptIn) => set((s) => {
    const next = { cameraOptIn };
    persist({ ...s, ...next });
    return next;
  }),
  setCameraSensitivity: (cameraSensitivity) => set((s) => {
    const next = { cameraSensitivity };
    persist({ ...s, ...next });
    return next;
  }),
  setSoundFxEnabled: (soundFxEnabled) => set((s) => {
    const next = { soundFxEnabled };
    persist({ ...s, ...next });
    return next;
  }),
  setSoundFxVolume: (soundFxVolume) => set((s) => {
    const next = { soundFxVolume };
    persist({ ...s, ...next });
    return next;
  }),
  setSensoryProfile: (sensoryProfile) => set((s) => {
    const calm = sensoryProfile === 'gentle';
    const next = { sensoryProfile, calmMode: calm };
    persist({ ...s, ...next });
    return next;
  }),

  addXp: (amount) => set((s) => {
    const next = { xp: s.xp + amount };
    persist({ ...s, ...next });
    return next;
  }),

  toggleCalm: () => set((s) => {
    const nextCalm = !s.calmMode;
    const next = { calmMode: nextCalm, sensoryProfile: nextCalm ? 'gentle' : 'vibrant' };
    persist({ ...s, ...next });
    return next;
  }),

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

  hydrateProgress: (progress) => set((s) => {
    const next = {
      xp: progress.xp ?? s.xp,
      activityLog: progress.activityLog ?? s.activityLog,
      worldsCompleted: progress.worldsCompleted ?? s.worldsCompleted,
      sessionsCompleted: progress.sessionsCompleted ?? s.sessionsCompleted,
      totalTimeMs: progress.totalTimeMs ?? s.totalTimeMs,
    };
    persist({ ...s, ...next });
    return next;
  }),

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
