# 📖 Lumora Engineering & Design Logbook

## [Session 8 - 2026-08-28] 1:1 Artistic Retro Tamagotchi Reference Redesign
- **Exact Reference Art Replication**: Re-engineered the landing page to match the user's uploaded Tamagotchi editorial art.
- **Trending Google Pixel Fonts**: Integrated `Jersey 25`, `Pixelify Sans`, `Silkscreen`, and `DotGothic16`.
- **Top Sky Section**:
  - Realistic daylight blue sky with photographic cumulus clouds background.
  - Giant outline pixel headline (`LUMORA`) in `Jersey 25` with thick black stroke and white interior.
  - Embedded warm amber/yellow subtitle badge box centered across the title.
  - Floating 8-bit Tamagotchi pet companion sprite with bobbing animation.
  - Chamfered black pixel button with right-pointing arrow: `[ ▶ Press start ]`.
  - Scattered pink (`#FF2E93`) and black floating pixel cubes.
- **Middle Stepped Horizon**:
  - Stepped silhouette skyline divider.
  - Embedded hot pink (`#FF2E93`) horizontal menu bar with 4 tabs (`Who are they`, `5 Realms`, `Vision Lab`, `Quest Log`).
- **Bottom Obsidian Deep Space Section**:
  - Dark space background with pixel star constellations (5-dot `+` crosses, 4-dot diamonds, single-pixel dots).
  - Giant stacked 2-line pixel heading: `WHO` / `ARE THEY?`
  - Editorial 2-column story layout with hot pink highlight tags (`young explorers`, `camera air-gestures`, `without judgment`, `zero punitive timers`).
  - Bottom-left 16-bit pixel Earth globe with cyan/blue continents.
- **Strict Color Compliance**: Zero Red, Zero Green, Zero Harsh Yellow strictly preserved.
- **Build Status**: Verified with `npm run build` (0 errors) and automated browser subagent recording.



# 📖 Lumora Engineering Logbook & Architecture Journal

This logbook records all architectural decisions, security audits, database migrations, computer vision enhancements, and design system refinements implemented across the Lumora platform.

---

## 📑 Log Entries

### [2026-08-28] — Top 1% Experience Redesign, Living Mascot & Pro Camera Grid Studio (Phase 2)
* **Status:** ✅ Complete & Verified Live in Browser
* **Author:** Principal Full-Stack Engineer

#### 1. Pro Studio & Camera Calibration Panel
* Replaced the basic toggle with a glassmorphic **Pro Studio Calibration Center**:
  * **Camera HUD Grid Overlays:** Real-time canvas rendering of `3x3 Rule of Thirds`, `Kinematic Crosshairs`, `Gesture Target Box`, and `Clean View`.
  * **Tracking Sensitivity & Smoothing Slider:** Fine-grained lerp factor tuning ($0.15 - 0.75$).
  * **Visual Comfort Profiles:** `Celestial (Vibrant)`, `Gentle Calm (Reduced Motion)`, `High Focus (Minimal Dust)`, and `High Contrast (WCAG AAA)`.
  * **Procedural Sound Volume:** Real-time slider and mute control for Web Audio synthesized chimes.
  * **Language Switcher:** Instant multi-lingual dialect selection (English, Hindi, Marathi).

#### 2. Living SVG Companion (Lumi)
* Replaced the static emoji container with an interactive SVG companion:
  * **Dynamic Pupil Gaze:** Real-time angle calculation tracking the child's pointer/hand cursor.
  * **Organic Randomized Blinking:** Natural eyelid spring closures every $2.5\text{s} - 6\text{s}$.
  * **Solar Breathing Aura:** Gentle floating bobbing physics with radial ambient glow.
  * **Interactive Tap Reaction:** Plays a synthesized harmonic chime and executes an excited $360^\circ$ spin.
  * **High-Contrast Speech Bubble:** Responsive, dyslexia-friendly typographic bubble.

#### 3. 3D Cosmic Constellation World Map
* **Cosmic Constellation Aesthetic:** High-density cosmic background with glowing SVG laser starlight paths connecting celestial realms.
* **3D Planetary Realm Orbs:** Floating spheres with planetary rings, layered radial glow, and icon glyphs.
* **Mastery Crowns:** Golden star badges for completed realms (`★ 5/5 Mastered`).
* **Tactile Hover Dynamics:** Magnetic hover elevation with synthesized audio click feedback.

#### 4. Native Web Audio Synthesis Engine (`src/lib/soundFx.js`)
* Procedural, zero-dependency browser synthesizer generating celestial bell chimes, tactile clicks, magic swooshes, and victory fanfares without external audio file loading latency.

#### 5. Verification & Live Browser Audit
* `npm run build`: **Success (0 errors)** in 2.92s.
* Live browser subagent audit verified landing page, living mascot gaze, cosmic world map hover animations, and studio calibration grid selection.

---

### [2026-08-28] — Production SaaS Upgrade, Security Hardening & Multi-Gesture Engine (Phase 1)
* **Status:** ✅ Complete & Verified
* **Author:** Principal Full-Stack Engineer

#### 1. Security & Identity Hardening
* **Vulnerability Fixed:** Role escalation in `handle_new_user()` trigger (CWE-269 / CWE-284).
* **Vulnerability Fixed:** Unsalted client-side password hashing and plaintext credential storage in `localStorage` (`demoAuth.js`). Replaced with ephemeral in-memory PBKDF2 sandbox authentication.
* **Vulnerability Fixed:** Client-side score forgery (CWE-602). Created server-authoritative PostgreSQL RPC `submit_round_attempt` in `supabase/migrations/202608300001_enterprise_hardening_and_scoring.sql` to compute and accumulate XP, time, and accuracy atomically.
* **Database Normalization:** Restored composite primary key `(user_id, role)` on `public.user_roles` to support multi-role accounts.

#### 2. Computer Vision & Multi-Gesture Control Engine
* **Performance Optimization:** Eliminated 60 FPS React state thrashing in `useHandTracking.js` by decoupling MediaPipe landmark tracking from the React render loop into mutable `useRef` coordinate buffers, 1D Kalman filtering, and throttled state flushes.
* **Multi-Gesture Recognition State Machine:** `point`, `pinch`, `palm`, `fist`, `peace`, `thumbs_up`.
* **Zero-Jitter Filtering:** Implemented exponential lerp smoothing and Kalman filtering on normalized coordinates.


---

### [2026-08-28] — Session 9–10: Premium Pixel Polish + Critique-Driven Creative Pass
* **Status:** ✅ Complete & Verified
* **Author:** Hermes Agent (Session 10 creative mandate: "pinterest-level, premium, no limitations")

#### 1. Design Doctrine (from parallel research agent)
* Sources: Emil Kowalski's design-engineering skill files (primary), neubrutalism.com guide, Lospec palette discipline.
* 13-rule pixel-premium checklist encoded in `.hermes/plans/2026-08-28_session10-premium-creative.md`: ≤8-color palette, hard shadows 3-5px zero blur, pressed = translate-into-shadow, UI motion <300ms `cubic-bezier(0.23,1,0.32,1)`, sprites never smooth-tween, integer-only sprite scaling, crafted (never photo) hero sky.

#### 2. Typography & Token Foundation
* 8 fonts → 3 (Jersey 25 display / Silkscreen UI / Lexend body). Stepped shadow tokens `--shadow-chip/card/float/press`, 8px grid, reduced-motion gating, pink `:focus-visible`.

#### 3. Crafted Pixel Sky (replaced stock photo)
* 6 hard banded steps + checkerboard dither strips + 2-speed parallax sprite clouds + pixel sun + film grain + chromatic wordmark hover. Mountain range required 6 QA iterations — final version uses programmatically generated adaptive stair-step diagonals (45°, no apex cliffs), 2-tone depth with outline. Vision verdict: 9/10 "shippable premium indie-game quality — Celeste/Stardew Steam-page grade."

#### 4. Critique-Agent Defect Fixes (harsh-critic audit, slop scorecard)
* **C2 fake nav** → 5-Realms strip (real WORLDS data, colored top borders) + scroll-to-section + honest pixel toast for post-auth destinations.
* **C3 camera autoplay** → `cameraOptIn` store gate; MagicMirror shows opt-in offer panel ("camera stays OFF until you say so"), video element only mounts when active — kills "Unable to play media" ghost + landing camera prompt.
* **M2 emoji icons** → `PixelIcon.jsx`: crisp 12×12 rect-based SVG glyphs (5 heroes, 5 realms, settings gear), palette-locked, `crispEdges`.
* **M4 column imbalance** → hero paragraph moved to lead column; heading rebreak "WHO ARE / THEY?" with 1.4em offset.
* Duplicate confetti set removed (was rendered twice).

#### 5. Verification
* `npm run build`: success after every change; 16 commits this session chain (`f353a7c` → `ac8e2ab`).
* Live vision QA: hero 9/10, camera offer verified, realms strip "premium pixel-UI", zero console errors. Globe integer-scale attempt (400px) reverted — occluded editorial copy; 320px composition is canonical.

---

### [2026-10-17] — Learning Insights & Support Report Enhancement and Role-Based Integration
* **Status:** ✅ Complete & Verified (`npm run build`: 0 errors)
* **Objective:** Build a comprehensive, evidence-based, supportive, accessible, and explicitly non-diagnostic Learning Insights & Support Report and integrate the appropriate report into each existing role-based dashboard.

#### 1. Evidence-Based Domain Summaries (Actual Game Activities Only)
* Audited all 5 learning worlds, round definitions, and stored results:
  * **Sound Forest:** Phonological awareness, letter-sound correspondence, phoneme blending, oral pronunciation, and auditory word recognition.
  * **Story Castle:** Reading fluency, sight words, cloze sentence decoding, oral passage reading, and narrative comprehension.
  * **Rune Realm:** Letter formation (Letter A), number formation (Digit 3), shape tracing, and fine motor stroke planning.
  * **Memory Mountains:** Visual working memory, sequential recall, and mathematical/sequence pattern matching.
  * **Vision Valley:** Smooth pursuit visual tracking, rapid saccadic target acquisition, and visual discrimination.
* Distinctly distinguishes actual recorded difficulties (repeated attempts/lower accuracy across sessions) from insufficient data (< 2 completed rounds).
* Never infers cognitive or learning difficulties from unrelated metrics.

#### 2. Responsible Learning Differences Section ("Learning Differences: What to Understand")
* Condition cards appear ONLY when relevant to recorded learning domains:
  * **Dyslexia:** displayed when phonological or reading activities are recorded.
  * **Dysgraphia:** displayed when letter/number tracing and motor writing activities are recorded.
  * **Dyscalculia:** displayed when number recognition and mathematical pattern activities are recorded.
* Clarifies that learning differences are not measures of intelligence.
* Clearly explains how in-game performance differs from clinical condition indicators (lighting, mouse sensitivity, speech recognition volume, fatigue).
* Strictly non-diagnostic: no condition ranking, no disease probabilities, no risk scores, and no unvalidated clinical thresholds.

#### 3. Practical Recommendations Section ("What Can Help Next?")
* Educational strategies tailored to recorded domains:
  * Teacher classroom strategies (multisensory phonics, alternative formats, visual manipulatives).
  * Parent home-support ideas (paired shared reading, playful sound games, tactile tracing).
  * Student encouraging next quests with mascot support.
  * Specialist/Administrator collaborative accommodations.

#### 4. Dashboard Integration
* Integrated into `TeacherDashboard` (`role="teacher"`), `ParentDashboard` (`role="parent"`), `SpecialistDashboard` (`role="specialist"`), `SchoolAdminDashboard` (`role="school_admin"` with student selector), and `WorldMap` (`role="student"` with real game store hydration).
* Includes rich sample learner preview fallback so reports are fully interactive even in offline/demo modes.
* Strict palette adherence: ink, sky, cream, pink accents (≤10%), blue, cyan, amber, purple; 0 blur hard shadows; 6px chamfers; Lexend typography (≥16px); `prefers-reduced-motion` guarded; full print stylesheet.

#### 5. Family Link Code Creation & Dual-Portal Resolution Fix
* Resolved the "Unable to create a link code" failure when unconfigured or when Supabase RPC is unreachable.
* Implemented resilient hybrid code generation: tries Supabase RPC first, then falls back seamlessly to a persistent local link registry.
* Added 1-click "📋 Copy Code" button with instant visual feedback.
* Enabled bi-directional code claiming and lookup:
  * **Parent Portal (`ParentDashboard`):** Pasting the family link code immediately links the student, populates their sessions, active learning time, completed realms, and loads their full Learning Insights & Support Report.
  * **Student Screen (`StudentLinkCode`):** Added a tab to paste a link code, instantly retrieving and displaying the learner's stats and providing a 1-click button to view their complete report.

---

### [2026-11-20] — Session 11: LUMORA INSIGHT — World-Wise Learning Evidence & Gemini Support Analysis
* **Status:** ✅ Complete, Tested & Verified (Build passes with 0 errors)
* **Author:** Principal Full-Stack & AI Systems Engineer

#### 1. Secure Dual-Environment Backend (`api/insights.js` & `vite.config.js`)
* **Production & Local Dev Parity:** Serverless `POST /api/insights` runs natively on Vercel and in local development via Vite Connect middleware.
* **Server-Side Secrecy:** `GEMINI_API_KEY` is kept strictly server-side. No frontend leaks.
* **Stable Model Selection:** Configured with `gemini-2.5-flash` with automatic fallback to `gemini-2.0-flash` (strictly avoiding deprecated models).
* **Transparent Attribution:** When `GEMINI_API_KEY` is unconfigured or offline, returns a rule-based deterministic fallback honestly labeled as non-AI fallback. Never claims fallback output was generated by Gemini.

#### 2. Strict Pseudonymisation & Privacy Service (`src/services/geminiInsights.js`)
* **Zero PII Transmitted:** Replaces learner names and identifiers with synthetic cryptographic pseudonyms (e.g. `learner_73a725`).
* **Evidence Grounding:** Telemetry contains only structured gameplay metrics: `world`, `round`, `accuracy`, `attempts`, `duration_seconds`, `hints`, and `completion_status`.
* **Client-Side Cache:** In-memory caching prevents redundant API invocations across tabs.

#### 3. World-Wise Educational Insight Analysis (`src/dashboards/LumoraInsightPanel.jsx`)
* **Five Learning Realms Analyzed:**
  * **Sound Forest:** Phonological awareness, letter-sound recognition, phoneme blending, auditory discrimination, spoken pronunciation.
  * **Vision Valley:** Visual tracking, smooth pursuit, saccadic target acquisition, visual discrimination, visual-motor timing.
  * **Story Castle:** Sight-word recognition, sentence decoding, reading fluency, story sequencing, reading comprehension.
  * **Rune Realm:** Letter formation, number formation, fine-motor coordination, tracing precision, continuous stroke planning.
  * **Memory Mountains:** Visual working memory, object recall, sequential recall, pattern recognition, memory updating.
* **Interactive Visual Dashboard Elements:**
  * **Realm Navigation Tabs:** Seamless switching between holistic 5-world matrix and dedicated deep-dive realm views.
  * **Activity Accuracy Bar Chart:** Pure SVG bar chart displaying individual activity performance relative to the 80% mastery benchmark.
  * **Session-Wise Longitudinal Trend Chart:** Multi-session accuracy progression lines for tracking long-term growth and differentiating fatigue from mastery.
  * **Completion Donut Chart:** Circular SVG donut illustrating realm challenges mastered ($x/5$).
  * **Data Sufficiency Indicators:** Transparent badges (`Evidence-Ready (2+ rounds)`, `Preliminary Data (1 round)`, `No Activity Recorded`) ensuring no child is labeled from isolated attempts.
  * **Gemini Interpretation Cards:** Structured insights providing strengths-first summaries, observed mastery highlights, growth areas with educational rationale, and practical next activity recommendations.
  * **Role-Specific Views:** Tailored educational lenses for Parents (home routines), Teachers (classroom accommodations), Specialists (cognitive load analysis), School Admins (participation metrics), and Students (encouraging quest invitations).

#### 4. Design & Preservation Verification
* **Color Law & Visual System:** Adheres strictly to ink `#090B14`, sky `#7EC8F5`/`#B8E2FA`, cream `#F5EFE0`, pink `#FF2E93` (accents only ≤10%), blue `#38B6FF`, cyan `#48B8D0`, amber `#E5A83B`, and purple `#A47BE0`. Hard offset shadows ($5\text{px} \times 5\text{px}$ zero blur), 6px chamfers, and 8px grid scale.
* **Strict Non-Diagnostic Commitment:** Explicit non-diagnostic disclaimers throughout; no medical/psychological condition predictions or deficit framing.
* **Zero Regressions:** All existing learning worlds, MediaPipe camera interactions, authentication flows, routing, and existing six report sections preserved intact.
* **Build Verification:** `npm run build` succeeds with 0 errors.

