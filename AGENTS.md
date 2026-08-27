# AGENTS.md — Lumora-claude Coding Agent Rules

Read fully before touching this repo.

## Mission

Elevate the Lumora World front-end from "good concept, average execution" to a
**premium, art-directed retro-arcade experience**. The implementation plan lives
at `.hermes/plans/2026-08-28_045038-lumora-premium-polish-kimi-k3.md` — execute
it task-by-task in order (Task 1 → Task 6). Each task ends with `npm run build`
(0 errors) + a commit.

## Hard rules

1. **Scope: visual layer only.** Touch only:
   - `index.html` (font link)
   - `src/components/*.jsx` (classNames/markup tweaks)
   - `src/styles/global.css`
   - `LOGBOOK.md` (append session entry at the end)

2. **Do NOT touch:** `src/auth/*`, `src/hooks/*`, `src/lib/*`, `src/services/*`,
   `src/store/*`, `src/adaptive/*`, `src/worlds/*/` game logic, `supabase/`,
   `package.json` (no new deps), `vite.config.js`.

3. **Color law (non-negotiable):** zero red, zero green, zero harsh yellow.
   Allowed palette: ink `#090B14`, sky `#7EC8F5`/`#B8E2FA`, cream `#F5EFE0`,
   pink `#FF2E93` (accents only — max ~10% of any screen), blue `#38B6FF`,
   cyan `#48B8D0`, amber `#E5A83B`, purple `#A47BE0`.

4. **Pixel depth language:** hard offset shadows with 0 blur
   (`box-shadow: 5px 5px 0 var(--ink)`). Never soft gaussian glows.
   Never `border-radius: 999px` bubbles — use chamfers (6px).

5. **8px grid:** all paddings/margins/gaps from the token scale. No arbitrary
   13px/21px values.

6. **Fonts:** Jersey 25 (display), Silkscreen (UI), Lexend (body). Nothing else.
   Body copy ≥ 16px, Lexend only — dyslexia-friendly requirement.

7. **Motion:** every animation/transition guarded by `prefers-reduced-motion`.
   Use tokens `--ease-snap`, `--dur-fast/base`. No bounce/spring libraries.

8. **A11y:** every interactive element gets a `:focus-visible` state (pink
   outline token is pre-defined). Decorative SVGs get `aria-hidden="true"`.

## Workflow

- Work in the existing repo `C:\Users\sujoy\Downloads\Lumora-claude` on branch
  `main`. The working tree has the Session 8 redesign uncommitted — commit it
  as baseline BEFORE starting (see Task 1).
- Commit after every task: `polish(scope): what changed`.
- If a step in the plan conflicts with what you find in the code, keep the
  plan's *intent* (premium polish), adapt the selector names to reality, and
  note the deviation in the commit message.
- Do not refactor working logic while restyling. Do not "improve" game
  mechanics. This pass is visual only.

## Verification before declaring any task done

```bash
npm run build          # 0 errors, mandatory
```
Then visually confirm: 8px alignment, palette compliance, contrast AA on both
sky (light) and space (dark) sections, reduced-motion respected.
