# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## WhatsBotheringYou

## 1. Project Overview

**WhatsBotheringYou** is a web app that lets users draw a star representing something that is bothering them and release it into a shared universe. The experience is: open modal → draw a star shape on a canvas → AI validates the drawing → the star is placed into a live, animated star-field visible to all users.

The domain is emotional expression / mental wellness, presented as a calming, dark-sky visual experience.

---

## 2. Tech Stack

| Technology                      | Version          | Role                                                         |
| ------------------------------- | ---------------- | ------------------------------------------------------------ |
| Next.js                         | 14.2.35          | App Router, SSR, API routes                                  |
| React                           | ^18              | UI framework                                                 |
| TypeScript                      | ^5               | Strict type safety                                           |
| Tailwind CSS                    | ^3.4.1           | Utility-first styling                                        |
| Zustand                         | ^5.0.11          | Global client state                                          |
| class-variance-authority        | ^0.7.1           | Button/component variants                                    |
| clsx                            | ^2.1.1           | Conditional className merging                                |
| tailwind-merge                  | ^3.5.0           | Tailwind conflict resolution via `cn()`                      |
| framer-motion                   | ^12.36.0         | Installed as dependency; not currently used in any component |
| @anthropic-ai/sdk               | ^0.78.0          | Claude API calls from API routes                             |
| Vitest                          | 2.1.8            | Unit testing                                                 |
| @testing-library/react          | ^14.3.1          | Component testing                                            |
| @testing-library/user-event     | ^14.6.1          | User interaction simulation                                  |
| @testing-library/jest-dom       | ^6.9.1           | DOM matchers                                                 |
| msw                             | ^2.12.10         | Installed; not yet used                                      |
| jsdom                           | ^28.1.0          | Test environment                                             |
| ESLint                          | ^8               | Linting                                                      |
| Prettier                        | ^3.8.1           | Formatting                                                   |
| Husky                           | ^9.1.7           | Git hooks                                                    |
| lint-staged                     | ^16.3.3          | Per-commit file linting                                      |
| @commitlint/cli                 | ^20.4.4          | Commit message linting                                       |
| @commitlint/config-conventional | ^20.4.4          | Conventional commits ruleset                                 |
| pnpm                            | 9.0.0            | Package manager                                              |
| Node.js                         | >=20.0.0 <21.0.0 | Runtime requirement                                          |

---

## 3. Code Style

### Formatting (`.prettierrc.json`)

- **Indentation**: 4 spaces (`tabWidth: 4`)
- **Quotes**: single quotes (`singleQuote: true`)
- **Semicolons**: always (`semi: true`)
- **Trailing commas**: all (`trailingComma: "all"`)
- **Print width**: 100 characters
- **Arrow parens**: always (`(x) => x`, never `x => x`)
- **Line endings**: LF

### TypeScript (`tsconfig.json`)

- `strict: true` — all strict checks enabled
- `noUnusedLocals: true` — unused variables are errors
- `noUnusedParameters: true` — unused parameters are errors
- `noUncheckedIndexedAccess: true` — array indexing returns `T | undefined`
- `allowJs: false` — TypeScript only, no JS files
- Target: `ES2017`

### ESLint (`.eslintrc.json`) — key rules

- `@typescript-eslint/no-explicit-any`: error — never use `any`
- `@typescript-eslint/consistent-type-imports`: error — always use `import type` for type-only imports
- `@typescript-eslint/no-non-null-assertion`: error — never use `!`
- `@typescript-eslint/prefer-nullish-coalescing`: error — use `??` not `||` for null checks
- `@typescript-eslint/no-misused-promises`: error — async functions must not be passed as `onClick` directly; wrap with `() => { void fn(); }`
- `@typescript-eslint/no-floating-promises`: error — all promises must be awaited or voided
- `react/no-unstable-nested-components`: error — no component definitions inside render
- `react/no-array-index-key`: error — never use array index as React key
- `import/no-cycle`: error — no circular imports
- `no-console`: warn — use `// eslint-disable-next-line no-console` only in API routes for server logging
- `no-param-reassign`: error — never mutate function parameters

### Import Order

Enforced by `import/order`. Groups separated by blank lines, alphabetised within each group:

1. `react`, `next/**` (external, before)
2. All other external packages
3. `@/types/**`, `@/constants/**` (internal, before)
4. `@/lib/**`, `@/store/**`, `@/services/**`, `@/hooks/**`, `@/styles/**` (internal)
5. `@/components/**` (internal, after)

Type imports are separate and do not affect group ordering.

---

## 4. Folder Structure

```text
src/
├── app/
│   ├── api/
│   │   └── validate-drawing/route.ts   # POST — AI drawing validation
│   ├── fonts/                          # GeistVF.woff, GeistMonoVF.woff (loaded but Inter is used)
│   ├── globals.css                     # Global styles, keyframes, dialog animations
│   ├── layout.tsx                      # Root layout, Inter font, metadata
│   ├── page.tsx                        # Home page — canvas + modal
│   └── page.test.tsx                   # Home page tests
├── components/
│   ├── add-star/                       # Multi-step "Add Star" modal flow
│   │   ├── ColourSwatch.tsx            # Colour picker button used in Step 1
│   │   ├── DrawingCanvas.tsx           # forwardRef canvas component
│   │   ├── Step1Draw.tsx               # Step 1 UI — drawing + validation
│   │   └── Step2WriteText.tsx          # Step 2 UI — worry text input
│   ├── universe/                       # Background star field
│   │   ├── AmbientStars.tsx            # Canvas — 180–220 pulsing ambient stars
│   │   ├── ShootingStar.tsx            # Canvas — periodic shooting star animation
│   │   ├── PresenceCounter.tsx         # "N stars in the galaxy" label
│   │   ├── UniverseCanvas.tsx          # Composes AmbientStars + ShootingStar + vignette
│   │   └── UniverseCanvas.module.css  # .universe and .vignette CSS module classes
│   ├── ui/                             # Reusable primitives
│   │   ├── Button.tsx                  # CVA button with variants/sizes/isLoading
│   │   ├── Button.test.tsx             # Button unit tests
│   │   └── Modal.tsx                   # Native <dialog> modal with open/close animations
│   ├── star-detail/                    # Placeholder — not yet built
│   ├── post-submit/                    # Placeholder — not yet built
│   └── crisis/                         # Placeholder — not yet built
├── constants/
│   ├── animation.ts                    # ANIMATION timing constants
│   ├── animation.test.ts
│   ├── colours.ts                      # STAR_COLOURS array + COLOURS object
│   └── colours.test.ts
├── hooks/
│   └── useDrawingCanvas.ts             # All canvas drawing logic — no React state for perf-sensitive values
├── lib/
│   ├── cn.ts                           # twMerge + clsx utility
│   └── cn.test.ts
├── services/                           # Placeholder — not yet built
├── store/
│   ├── useDrawingStore.ts              # Drawing state: blob, colour, brushSize, worryText
│   └── useModalStore.ts               # Modal state: isOpen, currentStep (1|2|3)
├── styles/                             # Placeholder — not yet built
├── test/
│   └── setup.ts                        # Imports @testing-library/jest-dom
└── types/                              # Placeholder — not yet built
```

---

## 5. Design System

### Colour Tokens (`tailwind.config.ts` + `src/constants/colours.ts`)

| Token          | Hex       | Tailwind class                           | Usage                                       |
| -------------- | --------- | ---------------------------------------- | ------------------------------------------- |
| `bg-base`      | `#0D1117` | `bg-bg-base`                             | Page background, canvas background          |
| `bg-surface`   | `#161B27` | `bg-bg-surface`                          | Modal background                            |
| `bg-raised`    | `#1E2435` | `bg-bg-raised`                           | Elevated surfaces                           |
| `brand`        | `#7C5CBF` | `bg-brand`, `border-brand`, `text-brand` | Primary actions, active step dot            |
| `brand-light`  | `#9B8EC4` | `bg-brand-light`                         | Lighter brand accent                        |
| `neon-pink`    | `#E879A0` | `text-neon-pink`                         | Error/invalid validation messages           |
| `neon-blue`    | `#79C4E8` | `text-neon-blue`                         | Star colour option                          |
| `neon-teal`    | `#4EC9B0` | `text-neon-teal`                         | Star colour option                          |
| `neon-gold`    | `#C9A84C` | `text-neon-gold`                         | Star colour option                          |
| `neon-grey`    | `#9CA3C4` | `text-neon-grey`                         | Star colour option, default drawing colour  |
| `text-primary` | `#F4F0FF` | `text-text-primary`                      | Primary text                                |
| `text-muted`   | `#888899` | `text-text-muted`                        | Secondary text, inactive dots, icon buttons |

### Star Colours (`src/constants/colours.ts` — `STAR_COLOURS`)

Five options as `{ id, hex, label }` tuples — pink `#E879A0`, blue `#79C4E8`, teal `#4EC9B0`, gold `#C9A84C`, grey `#9CA3C4`.

### Typography

- Body font: Quicksand (Google Fonts via `next/font/google`), weights 400/500/600, CSS variable `--font-quicksand`, Tailwind class `font-sans`
- Heading font: Fredoka (Google Fonts via `next/font/google`), weights 400/500/600, CSS variable `--font-fredoka`, Tailwind class `font-heading`
- Both variables are injected on `<body>` in `src/app/layout.tsx`
- Apply `font-heading` explicitly on `<h1>`–`<h6>` elements; body text inherits `font-sans` automatically

### Animation Constants (`src/constants/animation.ts`)

- `SHOOTING_STAR_MIN_INTERVAL_MS`: 45,000
- `SHOOTING_STAR_MAX_INTERVAL_MS`: 90,000
- `SHOOTING_STAR_DURATION_MS`: 1,200
- `STAR_DRIFT_AMPLITUDE_PX`: 8
- `AMBIENT_STAR_COUNT_MIN`: 180
- `AMBIENT_STAR_COUNT_MAX`: 220

### Dialog Animations (`src/app/globals.css`)

- `dialog-open`: opacity 0→1, translateY 20px→0, scale 0.98→1, 0.3s ease-out
- `dialog-close`: opacity 1→0, translateY 0→20px, scale 1→0.98, 0.28s ease-in
- `backdrop-open`: opacity 0→1, 0.2s ease-out
- `backdrop-close`: opacity 1→0, 0.28s ease-in
- Applied via `dialog.dialog-opening` and `dialog.dialog-closing` CSS classes
- `prefers-reduced-motion`: sets `animation: none` on `dialog[open]`, `dialog[open]::backdrop`, `dialog.closing`, `dialog.closing::backdrop`

---

## 6. Component Rules

### `'use client'` directive

Required on any component that uses hooks, browser APIs, or event handlers:

- `AmbientStars.tsx` — uses `useEffect`, `useRef`, canvas API
- `ShootingStar.tsx` — uses `useEffect`, `useRef`, canvas API
- `DrawingCanvas.tsx` — uses hooks, canvas events
- `Step1Draw.tsx` — uses hooks, fetch
- `Button.tsx` — uses `ButtonHTMLAttributes`
- `Modal.tsx` — uses `useEffect`, `useRef`, `useState`
- `page.tsx` — uses Zustand hooks

NOT required on: `UniverseCanvas.tsx`, `PresenceCounter.tsx` (pure rendering, no hooks).

### `forwardRef` pattern

Used in `DrawingCanvas.tsx` to expose an imperative handle to the parent:

```tsx
const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
    function DrawingCanvas({ onBlankChange }, ref) { ... }
);
DrawingCanvas.displayName = 'DrawingCanvas';
```

Always set `displayName` on forwardRef components. Always name the inner function (not an arrow function) for better stack traces.

### Type imports

Always use `import type { Foo }` for type-only imports:

```tsx
import type { DrawingCanvasHandle } from '@/components/add-star/DrawingCanvas';
```

Never use `import { type Foo }` inline — split into a separate `import type` statement.

### Accessibility requirements

- All `<canvas>` elements must have `aria-label`
- All icon buttons must have `aria-label`
- Validation messages must use `aria-live="polite"`
- `<Modal>` must receive a `labelId` that matches an `id` on the heading inside it
- Interactive elements must be reachable by keyboard (no `div` click handlers without role/keyboard support)
- Touch events on canvas use `e.preventDefault()` to suppress scroll

### Async onClick

Never pass an async function directly to `onClick`. Always wrap:

```tsx
onClick={() => { void handleContinue(); }}
```

---

## 7. State Management

### `useModalStore` (`src/store/useModalStore.ts`)

Owns the modal lifecycle and wizard step.

| Field         | Type          | Initial |
| ------------- | ------------- | ------- |
| `isOpen`      | `boolean`     | `false` |
| `currentStep` | `1 \| 2 \| 3` | `1`     |

Actions: `open()` (sets `isOpen: true, currentStep: 1`), `close()` (sets `isOpen: false, currentStep: 1`), `nextStep()`, `prevStep()`. Steps are clamped with `Math.min`/`Math.max` and cast to `1 | 2 | 3`.

### `useDrawingStore` (`src/store/useDrawingStore.ts`)

Owns the drawing submission data across the modal steps.

| Field          | Type           | Initial     |
| -------------- | -------------- | ----------- |
| `canvasBlob`   | `Blob \| null` | `null`      |
| `chosenColour` | `string`       | `'#9CA3C4'` |
| `brushSize`    | `number`       | `6`         |
| `worryText`    | `string`       | `''`        |

Actions: `setCanvasBlob`, `setChosenColour`, `setBrushSize`, `setWorryText`, `reset()`. `reset()` uses `DEFAULT_STATE as const` — do not inline it.

**Rule**: `reset()` must always be called alongside `close()` when the modal closes (handled in `page.tsx` `handleClose`).

### Zustand pattern

Always use `create<StoreType>()()` (double call) — required for Zustand v5 with TypeScript.

---

## 8. API Routes

| Route                   | Method | Purpose                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/validate-drawing` | `POST` | Accepts `FormData` with a `drawing` Blob (PNG). Converts to base64, calls `claude-haiku-4-5-20251001` with image + text prompt "Does this drawing look like a star? Reply with only YES or NO." Returns `{ valid: boolean }`. Fails open (returns `{ valid: true }`) on any error. Uses `Promise.race` with an 8s timeout. |

**Model in use**: `claude-haiku-4-5-20251001`

**Dev mock**: In `NODE_ENV === 'development'` the route returns `{ valid: true }` immediately without calling the Anthropic API.

---

## 9. Environment Variables

| Variable            | Side        | Required                | Purpose                                                         |
| ------------------- | ----------- | ----------------------- | --------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Server only | Yes (for AI validation) | Authenticates calls to Anthropic API in `/api/validate-drawing` |
| `SONAR_TOKEN`       | CI only     | Yes (for PR CI)         | SonarQube authentication                                        |
| `SONAR_HOST_URL`    | CI only     | Yes (for PR CI)         | SonarQube server URL                                            |

No `NEXT_PUBLIC_` variables exist. No client-side environment variables are used.

---

## 10. After Every Code Change

After making any code change, always run these two commands in order:

1. `pnpm format` — formats all files with Prettier
2. `pnpm check` — runs `type-check` + `lint` + `format:check` + `test:run` in sequence to catch any compilation errors or code quality issues

---

## 11. Quality Gates

### Pre-commit (`.husky/pre-commit`)

Runs `pnpm lint-staged`:

- `*.{ts,tsx}`: ESLint fix → Prettier write
- `*.{json,md,css}`: Prettier write

### Pre-push (`.husky/pre-push`)

Runs in sequence:

1. `pnpm lint`
2. `pnpm format:check`
3. `pnpm test:run`

### CI (`.github/workflows/ci.yml`)

Triggers on: PRs to `main` or `staging`, pushes to `main`.

Steps in order:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. `pnpm type-check`
3. `pnpm lint`
4. `pnpm format:check`
5. `pnpm test:coverage` (coverage thresholds: lines 30%, functions 30%, branches 30%)
6. SonarQube scan (`SonarSource/sonarqube-scan-action@9598b8a...`)
7. `pnpm build`

### SonarQube (`sonar-project.properties`)

- Project key: `Mainao_whatsbotheringyou`
- Organisation: `mainao`
- Sources: `src/`
- Coverage report: `coverage/lcov.info`
- Excluded from analysis: test files, config files, `src/test/**`, `src/app/layout.tsx`, `src/app/globals.css`

---

## 12. Already Built — Do Not Rebuild

Every file listed here exists and is complete. Do not recreate it.

### App

- `src/app/layout.tsx` — root layout with Quicksand + Fredoka fonts and metadata
- `src/app/page.tsx` — home page: canvas, Add Star button, modal, presence counter
- `src/app/page.test.tsx` — Home page tests
- `src/app/globals.css` — global styles, all dialog/star keyframes, Tailwind directives

### API

- `src/app/api/validate-drawing/route.ts` — POST route, Anthropic AI validation

### Components — Universe

- `src/components/universe/UniverseCanvas.tsx`
- `src/components/universe/UniverseCanvas.module.css`
- `src/components/universe/UniverseCanvas.test.tsx`
- `src/components/universe/AmbientStars.tsx`
- `src/components/universe/AmbientStars.test.tsx`
- `src/components/universe/ShootingStar.tsx`
- `src/components/universe/ShootingStar.test.tsx`
- `src/components/universe/PresenceCounter.tsx`
- `src/components/universe/PresenceCounter.test.tsx`

### Components — Add Star

- `src/components/add-star/ColourSwatch.tsx` — CVA colour picker button; used in Step 1
- `src/components/add-star/DrawingCanvas.tsx` — forwardRef canvas with ResizeObserver
- `src/components/add-star/Step1Draw.tsx` — drawing UI, AI validation, colour picker, undo/continue
- `src/components/add-star/Step2WriteText.tsx` — worry text textarea, star preview, continue button

### Components — UI

- `src/components/ui/Button.tsx` — CVA variants: primary, secondary, ghost, icon; sizes: sm, md, lg; isLoading spinner
- `src/components/ui/Button.test.tsx` — 20 tests
- `src/components/ui/Modal.tsx` — native `<dialog>` with CSS open/close animations, CLOSE_DURATION = 280ms

### Store

- `src/store/useModalStore.ts`
- `src/store/useDrawingStore.ts`

### Hooks

- `src/hooks/useDrawingCanvas.ts` — startStroke, continueStroke, endStroke, undo, clearCanvas, exportBlob, setColour, setSize

### Constants

- `src/constants/colours.ts` — STAR_COLOURS, COLOURS
- `src/constants/colours.test.ts`
- `src/constants/animation.ts` — ANIMATION timing values
- `src/constants/animation.test.ts`

### Lib

- `src/lib/cn.ts` — `cn()` utility (clsx + twMerge)
- `src/lib/cn.test.ts`

### Test

- `src/test/setup.ts` — imports `@testing-library/jest-dom`

---

## 13. Current Version and Branch

- **Version**: `0.1.0` (from `package.json`)
- **Current branch**: `feature/add-star-modal`
- **Main branch**: `main`

---

## 14. User Story Status

### Done

- **View universe canvas** — `UniverseCanvas` renders a full-screen dark star field with ambient pulsing stars (180–220) and a periodic shooting star
- **Open Add Star modal** — `Button` (variant="secondary") fixed top-right in `page.tsx` calls `useModalStore.open()`; modal appears with CSS open animation
- **Draw a star (Step 1)** — `DrawingCanvas` provides a `260px` tall canvas with mouse and touch support, multi-layer glow stroke, colour picker (`ColourSwatch`), `ResizeObserver` bitmap sync
- **Undo drawing** — Undo button calls `clearCanvas()`; disabled when canvas is blank
- **AI validate drawing** — `Step1Draw` POSTs canvas PNG blob to `/api/validate-drawing`; invalid drawings show error message and clear canvas; AbortController 8s client timeout; fails open; returns `{ valid: true }` immediately in development
- **Write worry text (Step 2)** — `Step2WriteText` shows the drawn star preview, a textarea (280-char limit with counter), and a Continue button
- **Close modal** — × button calls `handleClose` which calls `close()` + `reset()`; modal plays CSS close animation before `dialog.close()`
- **Presence counter** — `PresenceCounter` renders "N stars in the galaxy" fixed at bottom-centre; currently hardcoded to 0
- **Reusable Button** — CVA-based `Button` with variants: primary, secondary, ghost, icon; sizes: sm, md, lg; `isLoading` spinner
- **Reusable Modal** — Native `<dialog>` with open/close CSS animations, consistent `minHeight`, `open:flex` to avoid overriding browser `display:none`

### Not Yet Built

- **Step 3** — placeholder "Step 3 coming soon" in `page.tsx`
- **Star placed in universe** — no persistence or real-time updates yet; `PresenceCounter` count is hardcoded to `0`
- **Star detail view** — `src/components/star-detail/` is empty placeholder
- **Post-submit screen** — `src/components/post-submit/` is empty placeholder
- **Crisis support UI** — `src/components/crisis/` is empty placeholder
- **Real-time presence** — `src/services/` is empty placeholder

---

## 15. Do Not Section

Rules Claude Code must follow in this project:

1. **Do not use `any`** — `@typescript-eslint/no-explicit-any` is an error. Use proper types or generics.

2. **Do not use non-null assertions (`!`)** — `@typescript-eslint/no-non-null-assertion` is an error. Use optional chaining and null guards.

3. **Do not use `||` for null-coalescing** — use `??`. The rule `prefer-nullish-coalescing` is an error. Exception: when both operands are booleans and the OR semantics are intentional, wrap each side: `(a ?? false) || (b ?? false)`.

4. **Do not pass async functions directly to `onClick`** — always wrap: `onClick={() => { void handleAsyncFn(); }}`.

5. **Do not use `var`** — `no-var` is an error. Use `const` or `let`.

6. **Do not use `console.log`** — `no-console` is a warning. Only `console.error` is acceptable in API routes, preceded by `// eslint-disable-next-line no-console`.

7. **Do not use array index as React key** — `react/no-array-index-key` is an error.

8. **Do not define components inside other components' render** — `react/no-unstable-nested-components` is an error. Define helper components at the module level.

9. **Do not create circular imports** — `import/no-cycle` is an error.

10. **Do not write inline `import { type Foo }` — split into `import type { Foo }` on its own line** — required by `consistent-type-imports`.

11. **Do not use Framer Motion for modal animations** — the modal uses CSS keyframes and `setTimeout`. `framer-motion` is installed but not used for the modal.

12. **Do not add `'use client'` to components that don't need it** — `UniverseCanvas` and `PresenceCounter` are server-compatible; keep them that way.

13. **Do not call `dialog.close()` immediately on `isOpen → false`** — always let the closing animation play first. `Modal.tsx` uses `CLOSE_DURATION = 280` ms `setTimeout` before calling `dialog.close()`.

14. **Do not use `Math.random()` or `Date.now()` in component render** — only in `useEffect` or event handlers.

15. **Do not rebuild any file listed in section 12** — read the existing file first; only extend or modify it.

16. **When `pnpm check` fails, isolate the failure** — run `pnpm type-check`, `pnpm lint`, and `pnpm test:run` individually to pinpoint which step is broken rather than re-running the full suite blindly.

17. **Do not create `.md` documentation files** unless explicitly requested. This file (`CLAUDE.md`) is the single exception.

18. **Do not add comments to code** unless the logic is non-obvious. The codebase is intentionally comment-light.

19. **Do not use the `||` operator where `??` is required** and do not use `&&` for conditional rendering when a ternary is clearer for non-trivial JSX.

20. **Do not skip pre-commit hooks** (`--no-verify`). Fix the underlying lint/format issue instead.
