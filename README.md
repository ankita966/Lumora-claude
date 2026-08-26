# Lumora World

A magical, AI-powered, computer-vision and voice-enabled learning platform for
children aged 5–12, supporting foundational skills associated with dyslexia,
dysgraphia and dyscalculia. **This is not a diagnostic tool** — every score in
the app describes practice performance only.

This is a full rebuild (as real, runnable source code) of the original Brik
prototype, preserving its dark/blue magical aesthetic, world map, mascot,
round-based flow, and XP system — plus the fixes and additions requested:

- **Story Castle**: real microphone permission flow, live listening state,
  Web Speech API transcription with word-by-word highlighting, and a graceful
  tap-to-read fallback for browsers without speech recognition (e.g. Firefox).
- **Rune Realm**: fixed to run **5 full rounds** (circle → letter → number →
  star rune → infinity rune) with live accuracy/coverage tracking, a progress
  indicator, a "Clear trace" retry, and a proper round-complete → next-round
  transition — it no longer goes blank after round 1.
- **Adaptive learning engine**: every round logs accuracy/attempts/time to a
  6-skill profile (Sound, Vision, Reading, Motor/Tracing, Number Sense,
  Memory) and recommends the next best activity.
- **Parent Dashboard** and **Specialist/Educator Lab** (with clearly labeled
  DEMO DATA child profiles).
- **Calm Mode** (reduced motion/sound, bigger controls, slower pacing) and a
  language switcher (English + Hindi live, architecture ready for Marathi).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`) in a
recent Chrome/Edge (best Web Speech + camera support). Grant camera/mic
permission when prompted to try the hand-tracking and voice features — both
worlds work fine with mouse/keyboard and a "tap to confirm" fallback if you
decline.

To build for production:

```bash
npm run build
npm run preview
```

## Supabase Phase 1 setup

Authentication and cloud progress are optional at runtime: without the two
environment variables below, Lumora continues to use its existing local
Zustand and `lumora-save-v1` localStorage flow. To enable Supabase locally,
copy `.env.example` to `.env` and add the project's public URL and anon key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Apply [202608250001_auth_roles_progress.sql](supabase/migrations/202608250001_auth_roles_progress.sql)
and [202608260001_backfill_profiles_and_admin_users.sql](supabase/migrations/202608260001_backfill_profiles_and_admin_users.sql)
using either `supabase db push` (after linking
the project) or the Supabase Dashboard's SQL Editor. The migration is local
only; this repository does not apply it automatically. In Supabase Auth,
enable Email/Password sign-in and configure the site's local/production URL
and redirect URL as appropriate for your environments.

Apply [202608290001_single_role_mvp.sql](supabase/migrations/202608290001_single_role_mvp.sql)
as well. It preserves a single, database-backed role per account. First-time
users choose that one role during signup; the Auth trigger creates the profile
and role server-side. Returning users log in with email and password only, and
Lumora routes them from the saved role. The browser never receives service
credentials or a `user_roles` write policy.

## Project structure

```
src/
  App.jsx                 — screen router
  store/useGameStore.js    — zustand store: XP, screen, settings, activity log
  adaptive/engine.js       — skill-profile scoring + recommendation engine
  data/worlds.js           — world metadata (names, colors, icons)
  data/i18n.js             — translation dictionary (en, hi; mr-ready)
  hooks/
    useHandTracking.js     — MediaPipe HandLandmarker camera hook
    useCursor.js            — unified hand/mouse pointer for camera games
    useSpeechRecognition.js — Web Speech API wrapper + TTS + fuzzy matching
    useWorldFlow.js         — shared 5-round game loop (progress/XP/logging)
  components/               — Landing, WorldMap, TopBar, Mascot, dashboards' shared bits
  worlds/
    soundForest/            — 5 rounds: Sound Slash, Sound Match, Phoneme
                               Blend, Pronounce It (voice), Word Recognition
    visionValley/            — 5 camera-driven rounds: Track & Touch, Color
                               Match, Spot the Difference, Pattern Match,
                               Focus Challenge
    storyCastle/              — 5 reading-aloud rounds + comprehension check
    runeRealm/                 — 5 air-tracing rounds + shapes.js (path generators)
    memoryMountains/            — 5 memory/sequencing/pattern rounds
  dashboards/
    ParentDashboard.jsx
    SpecialistDashboard.jsx
    SkillBars.jsx
```

## Notes for continued development

- Hand tracking loads MediaPipe's model/WASM from Google's CDN at runtime
  (no local model files to manage). Swap `useHandTracking.js`'s URLs for a
  self-hosted copy if you need to work offline.
- Speech recognition uses the browser's built-in `SpeechRecognition` — there's
  no external API key or cost, but browser support varies (best in
  Chromium-based browsers).
- Progress is persisted to `localStorage` (`lumora-save-v1`) so XP and the
  activity log survive a refresh. Clear it via
  `useGameStore.getState().resetProgress()` in the browser console, or wipe
  `localStorage`.
- All gameplay content (word banks, passages, shapes) lives in small data
  files/arrays near each world, so adding more rounds or a new language is a
  content change, not an architecture change.
