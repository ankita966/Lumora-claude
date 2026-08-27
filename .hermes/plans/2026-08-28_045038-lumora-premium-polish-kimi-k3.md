# Lumora Premium Design Polish — Implementation Plan (Kimi K3)

> **For Hermes:** This is a handoff plan for Kimi K3 (or any coding agent) to execute task-by-task.
> Repo: `C:\Users\sujoy\Downloads\Lumora-claude` (React 18 + Vite 5 + Zustand). Do NOT touch `dorahack`.

**Goal:** Elevate the Lumora landing page + app shell from "good concept, average execution" to a premium, art-directed product without losing the retro-Tamagotchi identity or breaking the strict color rules (zero red, zero green, zero harsh yellow).

**Architecture:** Pure CSS/JSX polish pass — no new dependencies, no routing changes, no logic changes. All work is in `src/components/Landing.jsx`, `src/components/*.jsx`, `src/styles/global.css`, and `index.html` (fonts). The existing `ref-*` class system in `global.css` is the surface being refined.

**Tech Stack:** React 18, Vite 5, vanilla CSS (custom properties), Google Fonts (already loaded: Jersey 25, Pixelify Sans, Silkscreen, DotGothic16, Space Grotesk, VT323, Lexend, Press Start 2P).

---

## Design North Star (read this first)

**One emotion:** "A museum-grade retro arcade poster" — nostalgic but expensive. Think Teenage Engineering × Nintendo × editorial print design, NOT a template.

**What "premium" means here (the gap to close):**
1. **Optical discipline** — everything aligns to an 8px grid. Antigravity's output drifts: inconsistent paddings, elements misaligned across sections.
2. **Restrained palette** — currently pink is splattered everywhere. Premium = 90% restrained (sky, ink, cream) + 10% hot pink as *precision accents*.
3. **Depth without blur** — pixel art gets depth from *stepped shadows* (hard offset shadows, layered box-shadows with 0 blur) and dithered gradients, NEVER soft gaussian blur. `box-shadow: 6px 6px 0 #000` is the language.
4. **Typography hierarchy** — 3 tiers max: display (Jersey 25), UI (Silkscreen/Pixelify), body (Lexend). Currently 8 fonts are loaded and it shows.
5. **Motion with intent** — one hero animation (pet bob), subtle staggered reveals on scroll, everything else still. `prefers-reduced-motion` respected.

**Hard constraints (from prior sessions — do not violate):**
- Zero red, zero green, zero harsh yellow anywhere (accessibility + brand rule).
- Palette: sky `#7EC8F5`/`#B8E2FA`, ink `#090B14`, cream `#F5EFE0`, hot pink `#FF2E93` (accents only), blue `#38B6FF`, cyan `#48B8D0`, amber `#E5A83B`, purple `#A47BE0`.
- Dyslexia-friendly: Lexend for body copy, min 16px body, no justified text.
- All interactive elements need `:focus-visible` states.
- `prefers-reduced-motion` guard on ALL animations.

---

## Current State (verified 2026-08-28)

- `npm run build` passes clean (4.07s, 0 errors). Warning: main chunk 509KB — ignore for now.
- Git: `main` @ `92951be`, 24 files modified uncommitted (Session 8 redesign in flight). **Commit current state FIRST** so K3 has a clean diff baseline.
- Landing: `ref-tamagotchi-canvas` → 3 sections (sky / skyline+nav / space). Working, but CSS is 1,975 lines and uneven.

## Quality gate (definition of done)

Every task ends with:
```bash
npm run build          # must pass, 0 errors
npx vite preview &     # spot-check in browser at localhost:4173
```
Visual check list: alignment on 8px grid, no red/green/harsh yellow, text contrast AA on both light (sky) and dark (space) sections, animations respect reduced-motion.

---

## Task 1 — Commit baseline & prune fonts

**Objective:** Clean starting point; cut font payload from 8 families to 4.

**Files:**
- Modify: `index.html` (line 10 — the Google Fonts link)

**Step 1:** Commit current work as baseline:
```bash
git add -A
git commit -m "wip: session 8 tamagotchi redesign baseline before premium polish"
```

**Step 2:** Replace the fonts link with exactly:
```html
<link href="https://fonts.googleapis.com/css2?family=Jersey+25&family=Silkscreen:wght@400;700&family=Pixelify+Sans:wght@400;500;600;700&family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```
(Drops DotGothic16, Jersey 15, Press Start 2P, VT323, Space Grotesk.)

**Step 3:** In `src/styles/global.css`, fix any selector still referencing dropped fonts. Search for `DotGothic16|Jersey 15|Press Start 2P|VT323|Space Grotesk` and remap: `DotGothic16`/`VT323`/`Press Start 2P` → `'Silkscreen'`; `Space Grotesk` → `'Lexend'`; `Jersey 15` → `'Jersey 25'`.

**Step 4:**
```bash
npm run build   # expect: 0 errors
grep -c "font-family" src/styles/global.css   # sanity: fonts referenced consistently
```

**Step 5:** Commit: `git commit -am "polish: prune to 4-font system (display/UI/body)"`

---

## Task 2 — Design tokens: define the premium foundation

**Objective:** One `:root` token block that all sections consume. This is what makes the result feel art-directed instead of improvised.

**Files:**
- Modify: `src/styles/global.css` (top of file, before existing rules)

**Step 1:** Add (do not delete existing yet — migration in Task 4):
```css
:root {
  /* Lumora Premium Tokens — retro-arcade editorial */
  --ink: #090B14;
  --ink-soft: #141824;
  --sky: #7EC8F5;
  --sky-light: #B8E2FA;
  --cream: #F5EFE0;
  --pink: #FF2E93;
  --pink-deep: #D91F7A;
  --blue: #38B6FF;
  --cyan: #48B8D0;
  --amber: #E5A83B;
  --purple: #A47BE0;

  /* Typography */
  --font-display: 'Jersey 25', monospace;
  --font-ui: 'Silkscreen', monospace;
  --font-body: 'Lexend', sans-serif;

  /* Stepped (pixel) shadows — 0 blur, the premium pixel signature */
  --shadow-chip: 3px 3px 0 var(--ink);
  --shadow-card: 5px 5px 0 var(--ink);
  --shadow-float: 8px 8px 0 var(--ink), 16px 16px 0 rgba(9,11,20,0.18);
  --shadow-press: 2px 2px 0 var(--ink);

  /* Radii — pixel world uses chamfers, not curves */
  --chamfer: 6px;

  /* Spacing — strict 8px grid */
  --sp-1: 8px;  --sp-2: 16px; --sp-3: 24px;
  --sp-4: 32px; --sp-6: 48px; --sp-8: 64px; --sp-12: 96px;

  /* Motion */
  --ease-snap: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 0.15s;
  --dur-base: 0.3s;
}
```

**Step 2:** Add global reduced-motion + focus rules at end of file:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
:focus-visible {
  outline: 3px solid var(--pink);
  outline-offset: 3px;
}
```

**Step 3:** `npm run build` → expect 0 errors. Commit: `polish: add premium design tokens + a11y guards`

---

## Task 3 — Hero (sky section) refinement

**Objective:** The LUMORA headline + pet block becomes the money shot.

**Files:**
- Modify: `src/components/Landing.jsx` (lines ~81–166, `ref-top-sky-section`)
- Modify: `src/styles/global.css` (section `ref-top-sky-section`)

**Step 1 — headline treatment.** In `global.css`, restyle `.ref-title-pixel-text`:
```css
.ref-title-pixel-text {
  font-family: var(--font-display);
  font-size: clamp(5rem, 18vw, 13rem);
  line-height: 0.85;
  color: var(--cream);
  -webkit-text-stroke: clamp(2px, 0.5vw, 4px) var(--ink);
  paint-order: stroke fill;
  letter-spacing: 0.02em;
  text-shadow: 0.06em 0.06em 0 var(--pink); /* single hard offset — premium, not glow */
  margin: 0;
}
```

**Step 2 — press start button.** Restyle `.ref-press-start-btn` as a chunky arcade key:
```css
.ref-press-start-btn {
  font-family: var(--font-ui);
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--cream);
  color: var(--ink);
  border: 3px solid var(--ink);
  border-radius: var(--chamfer);
  padding: 14px 28px;
  box-shadow: var(--shadow-card);
  transition: transform var(--dur-fast) var(--ease-snap), box-shadow var(--dur-fast) var(--ease-snap);
}
.ref-press-start-btn:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 var(--ink); }
.ref-press-start-btn:active { transform: translate(3px, 3px); box-shadow: var(--shadow-press); }
```

**Step 3 — pet sprite.** Wrap animation: bob 6s ease-in-out infinite (translateY ±8px only, no rotation); pause on hover; add `aria-hidden="true"` to decorative SVGs.

**Step 4 — pixel blocks cleanup.** The 6 scattered `ref-pixel-block` divs: constrain to 3 pink + 2 ink, sizes 12/16/24px, positions on the 8px grid, animation `float 9s ease-in-out infinite alternate` with `animation-delay` stagger (-1s, -3s, -5s). Delete extras.

**Step 5:** Build + visual check. Commit: `polish(hero): headline offset-shadow, arcade key button, disciplined floaters`

---

## Task 4 — Sections 2+3: skyline nav & deep-space editorial

**Objective:** Middle nav bar and bottom story section get the same discipline.

**Files:**
- Modify: `src/styles/global.css` (sections `ref-magenta-menu-bar`, `ref-bottom-space-section`)
- Modify: `src/components/Landing.jsx` (lines ~171–367)

**Step 1 — nav bar.** Tabs become cream-on-ink chips with hard shadow; active tab = pink fill, ink text, inset shadow (`box-shadow: inset 2px 2px 0 rgba(9,11,20,0.35)`); hover raises 2px. Bar itself: ink background, 3px cream top+bottom border, NO gradient.

**Step 2 — "WHO ARE THEY?" heading.** Mirror the hero treatment: `font-size: clamp(3.5rem, 9vw, 8rem)`, cream fill, ink stroke, `text-shadow: 0.05em 0.05em 0 var(--pink)`. The two stacked lines get `margin-left` offset (line 1: 0, line 2: 0.75em) for editorial asymmetry.

**Step 3 — pink highlight tags.** `.ref-pink-highlight` / `.ref-pink-tag`: replace any glow/underline with a stepped marker style:
```css
.ref-pink-highlight {
  background: linear-gradient(transparent 62%, rgba(255,46,147,0.35) 62%);
  font-weight: 600;
  padding: 0 2px;
}
.ref-pink-tag {
  font-family: var(--font-ui);
  font-size: 0.72em;
  border: 2px solid var(--pink);
  color: var(--pink);
  padding: 1px 6px;
  border-radius: var(--chamfer);
  white-space: nowrap;
}
```

**Step 4 — earth globe.** Add slow rotation only inside `@media (prefers-reduced-motion: no-preference)`: 60s linear infinite on the continent `<g>`, with `transform-origin: center`. Add `role="img"` + `aria-label="Pixel Earth globe"`.

**Step 5 — star field.** Replace 7 absolutely-positioned star divs with ONE `background-image` using 2 layered `radial-gradient`/`conic` pixel-star patterns at different scales + `background-repeat`. Fewer DOM nodes, crisper.

**Step 6:** Build + visual check. Commit: `polish(space): editorial asymmetry, stepped tags, css-only starfield`

---

## Task 5 — App shell consistency pass (map, topbar, settings)

**Objective:** Inside the app (post-login), the premium feel must continue — this is where Antigravity output felt most "avg".

**Files:**
- Modify: `src/components/WorldMap.jsx`, `src/components/TopBar.jsx`, `src/components/SettingsPanel.jsx`, `src/components/Mascot.jsx`
- Modify: `src/styles/global.css` (world-map / topbar / settings sections)

**Step 1 — WorldMap realm cards.** Uniform 3D orbs → varied: mastered realms get `--shadow-float` + gold star chip; locked realms get dashed 2px ink border at 60% opacity, desaturated color; hover = translateY(-6px) + shadow grows one step. Grid gap on 8px scale (--sp-3).

**Step 2 — TopBar.** Single row, 56px height, ink background, cream text. XP counter gets `font-family: var(--font-ui)` with a small pink pixel-square bullet. Avatar chip: 2px ink border + `--shadow-chip`.

**Step 3 — SettingsPanel.** Sliders: pixel-style — track = 8px cream bar with 2px ink border, thumb = 16px pink square rotated 0deg (a diamond reads as harsh; keep square), hard shadow. Segmented controls (sensory profile): chips matching nav tab style from Task 4.

**Step 4:** Build + visual check on `/map` (login required — use demo auth). Commit: `polish(app-shell): realm cards, topbar, pixel controls`

---

## Task 6 — Final QA, screenshot review, handoff log

**Objective:** Verify premium feel, log the session in LOGBOOK.md.

**Step 1:** `npm run build` → 0 errors. `npm run preview` → walk through: landing (logged out), auth, map, one world round, settings.

**Step 2:** Screenshot review at 1440×900 and 390×844 (mobile). Fix the worst 3 issues found; mobile must not horizontally scroll.

**Step 3:** Append to `LOGBOOK.md`:
```markdown
## [Session 9 - 2026-08-28] Premium Polish Pass (Kimi K3)
- Font system pruned 8→4 (Jersey 25 display / Silkscreen UI / Lexend body)
- Design tokens: stepped pixel shadows, 8px grid, chamfer radii, motion tokens
- Hero: offset-shadow headline, arcade-press button, disciplined floaters
- Space: editorial asymmetry, marker-highlight tags, CSS-only starfield
- App shell: realm card states, 56px topbar, pixel sliders/segmented controls
- A11y: prefers-reduced-motion guards, :focus-visible pink outlines
```

**Step 4:** Commit: `polish: session 9 complete — premium pass` → `git log --oneline -3` to verify.

---

## Risks / Notes

- **Font metrics shift:** Jersey 25 at huge sizes has tight metrics — check the amber badge box still centers under the headline. If clipping, reduce to `clamp(4.5rem, 11vw, 10rem)`.
- **`-webkit-text-stroke` + `paint-order`** works Chromium/Firefox; Safari ok ≥ 16. Fallback is fine (stroke-less text still readable).
- **Don't touch:** `src/auth/*` logic, `src/hooks/useHandTracking.js`, Supabase migrations, `src/worlds/*/` game logic. Visual classes only.
- **Chunk warning (509KB)** is out of scope — do not code-split in this pass.
- Color audit before finishing: `grep -iE "#(f[0-9a-f]{2}5|0f0|008000|ff0\b|adff2f|9acd32)" src/styles/global.css` should return nothing suspicious (no reds/greens).
