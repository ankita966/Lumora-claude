# Lumora Premium-Creative Pass — Session 10 (2026-08-28)

## Mandate (user, verbatim intent)
"be creative… keeping the lumora world map page layout as it is… make every possible update… be free…
first use agent reach skill to look for retro pixel gamified website… read all frontend and design skills…
pinterest level quality… people get impressed… at home page the sky image is not going well…
think of animations, recent trends / popular-web-designs /art-poster-system /learning-system /claude-design…
follow structure like emil kowalski… expecting a website made in framer/figma… focus on the consumer too…
span out agents for critique, research and design… run unless it does not meet premium standard…
same style but make it premium. no limitations."

## Constraints (locked)
- **World Map page layout: UNTOUCHED.** All polish on Landing + components around it.
- Palette discipline (zero red/green/harsh-yellow): hot pink #FF2E93, sky blue #38B6FF, amber-soft, black, obsidian #090B14, off-white #E2E8F0.
- Dyslexia sizing: body ≥15px. prefers-reduced-motion on ALL decorative motion.
- 3-font system stays: Jersey 25 (display XL) / Silkscreen (pixel UI) / Lexend (body).
- Quality bar: Framer-template level; Emil Kowalski motion discipline; anti-slop score must pass verify_design rules.

## Diagnosis (already confirmed)
1. **CRITICAL — stock photo sky** (`public/sky_clouds.jpg` on `.ref-top-sky-section`): real photograph
   clashing with pixel UI. Anti-slop rule #21 (untreated stock photo). Single biggest cheapness tell.
2. Slop tells observed: center-stack composition, uniform section rhythm, missing grain/texture,
   single-elevation shadows, no staggered motion choreography.
3. Vision QA earlier scored hero 9/10 after fixes — but user bar is higher: "people get impressed".

## Design Direction — "Handheld Console Premium"
One emotion: **the magic of a premium handheld game console, opened for the first time.**
One focal point: the LUMORA wordmark as a physical pixel object. One asymmetry: editorial
left-weighted hero stack with counter-weighted floating sprite.

### The Premium Pixel Recipe (from skills + research agent)
- **Crafted sky, not photo**: CSS banded gradient (5-6 hard steps, no smooth gradients — dither
  bands between steps via repeating-conic or checker 2px pattern) + sprite clouds drifting at
  2 parallax speeds + pixel sun with stepped glow rings.
- **Grain everywhere**: SVG noise overlay at 4-6% opacity, multiply — kills digital flatness (art-poster rule 4).
- **Typography as object**: Jersey 25 at clamp(5rem→10rem), -0.02em; Silkscreen labels at +0.08em
  wide tracking; weight contrast 400↔900; one word of the headline gets pink fill inversion.
- **Layered stepped shadows**: every elevation = 2 steps (chip 3px+6px, card 4px+8px, float 6px+12px)
  in obsidian, never blur. Chamfered corners via clip-path on feature panels only (radius mix rule).
- **Motion = Emil discipline**: spring cubic-bezier(0.34,1.56,0.64,1) on interactions only;
  staggered 60ms cascade reveals on section entry (IntersectionObserver); pet/floaters idle at
  slow 6-9s loops; NOTHING above 2.5s linear drift. All gated by prefers-reduced-motion.
- **Microinteractions**: button press = translateY(3px)+shadow-collapse (already have); add
  hover-sprite-bounce on nav tabs; wordmark gets subtle chromatic-aberration hover (2px pink/cyan split).

## Task Plan
- C1: Crafted pixel sky (kill sky_clouds.jpg) + grain overlay + parallax sprite clouds.
- C2: Typography scale-up + editorial asymmetry on hero stack; pink-fill emphasis word.
- C3: Staggered reveal cascade + hover microinteractions (nav bounce, card tilt).
- C4: Space section: add dither horizon transition (sky→space band), constellation parallax.
- C5: QA gate: browser_vision critique loop until "premium" verdict; build clean; commit per task.

## Verification
- npm run build after each task; git commit polish(...) messages.
- browser_vision with slop-critic questions each round; iterate ≤4 rounds.
- World Map untouched (verify via git diff --stat only touching Landing/global.css).
