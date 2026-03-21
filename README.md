# WhatsBotheringYou

## What It Is

WhatsBotheringYou is a web app where users draw a star representing something that is bothering them, then release it into a shared universe. The core loop is: open a modal, draw a star shape on a canvas, let an AI validate the drawing, and watch the star appear in a live animated star field visible to everyone.

The emotional premise is simple — externalise a worry, let it go, see that others have done the same. The interface is a dark-sky aesthetic: a full-screen canvas of ambient pulsing stars and periodic shooting stars, with minimal UI that stays out of the way.

The app is built as a multi-step wizard. Step 1 is the drawing canvas with AI validation. Steps 2 and 3 (worry text, colour selection, and submission) are in progress. Persistence, real-time presence, and a live star universe are planned for v0.3.

## Live URLs

| Environment | URL                                     |
| ----------- | --------------------------------------- |
| Production  | https://whatsbotheringyou.space         |
| Staging     | https://staging.whatsbotheringyou.space |

## Tech Stack

| Layer              | Technology                | Version  |
| ------------------ | ------------------------- | -------- |
| Framework          | Next.js (App Router)      | 14.2.35  |
| UI                 | React                     | ^18      |
| Language           | TypeScript                | ^5       |
| Styling            | Tailwind CSS              | ^3.4.1   |
| State              | Zustand                   | ^5.0.11  |
| Component variants | class-variance-authority  | ^0.7.1   |
| AI validation      | @anthropic-ai/sdk         | ^0.78.0  |
| Animation          | framer-motion             | ^12.36.0 |
| Testing            | Vitest + Testing Library  | 2.1.8    |
| Linting            | ESLint                    | ^8       |
| Formatting         | Prettier                  | ^3.8.1   |
| Git hooks          | Husky + lint-staged       | ^9.1.7   |
| Commit format      | commitlint (conventional) | ^20.4.4  |
| Package manager    | pnpm                      | 9.0.0    |
| Runtime            | Node.js                   | 20.x     |

## Getting Started

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- pnpm 9.x

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Mainao/whatsbotheringyou.git
    cd whatsbotheringyou
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Copy the environment file:

    ```bash
    cp .env.example .env.local
    ```

4. Fill in the required environment variables (see below).

5. Start the development server:
    ```bash
    pnpm dev
    ```

### Environment Variables

```bash
# Database
DATABASE_URL=""

# Anthropic
ANTHROPIC_API_KEY=""

# App URLs
NEXT_PUBLIC_APP_URL=""
NEXT_PUBLIC_WS_URL=""

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_KEY=""
CLOUDFLARE_R2_BUCKET_NAME=""
CLOUDFLARE_R2_PUBLIC_URL=""
```

| Variable                      | Required | Description                                           | Where to get it          |
| ----------------------------- | -------- | ----------------------------------------------------- | ------------------------ |
| `DATABASE_URL`                | Yes      | PostgreSQL connection string                          | Your database provider   |
| `ANTHROPIC_API_KEY`           | Yes      | Authenticates Claude API calls for drawing validation | console.anthropic.com    |
| `NEXT_PUBLIC_APP_URL`         | Yes      | Public-facing app URL                                 | Your deployment platform |
| `NEXT_PUBLIC_WS_URL`          | Yes      | WebSocket server URL for real-time presence           | Your deployment platform |
| `CLOUDFLARE_R2_ACCOUNT_ID`    | Yes      | Cloudflare account ID                                 | dash.cloudflare.com      |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Yes      | R2 access key                                         | Cloudflare R2 dashboard  |
| `CLOUDFLARE_R2_SECRET_KEY`    | Yes      | R2 secret key                                         | Cloudflare R2 dashboard  |
| `CLOUDFLARE_R2_BUCKET_NAME`   | Yes      | R2 bucket for drawing storage                         | Cloudflare R2 dashboard  |
| `CLOUDFLARE_R2_PUBLIC_URL`    | Yes      | Public base URL for stored drawings                   | Cloudflare R2 dashboard  |
| `SONAR_TOKEN`                 | CI only  | SonarCloud authentication                             | sonarcloud.io            |
| `SONAR_HOST_URL`              | CI only  | SonarCloud server URL                                 | sonarcloud.io            |

## Development

### Commands

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | Start Next.js development server                             |
| `pnpm build`         | Production build                                             |
| `pnpm start`         | Start production server                                      |
| `pnpm type-check`    | TypeScript check (`tsc --noEmit`)                            |
| `pnpm lint`          | ESLint — zero warnings allowed                               |
| `pnpm lint:fix`      | ESLint with auto-fix                                         |
| `pnpm format`        | Prettier write on all files                                  |
| `pnpm format:check`  | Prettier check without writing                               |
| `pnpm test`          | Vitest in watch mode                                         |
| `pnpm test:run`      | Vitest single run                                            |
| `pnpm test:coverage` | Vitest with v8 coverage (text + lcov)                        |
| `pnpm check`         | Runs type-check + lint + format:check + test:run in sequence |

To run a single test file:

```bash
pnpm vitest run src/components/ui/Button.test.tsx
```

### Branch Strategy

| Branch      | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `main`      | Production only — always deployable                              |
| `staging`   | Pre-production — all features tested here before merging to main |
| `feature/*` | One branch per feature — merges to staging                       |
| `fix/*`     | Bug fixes — merges to staging                                    |
| `chore/*`   | Maintenance tasks — merges to staging                            |

PRs go to `staging`, not `main`. `main` receives merges from `staging` only.

### Commit Convention

Conventional commits are enforced by commitlint on every commit.

```
feat: add drawing canvas
fix: correct canvas dpr scaling
chore: update dependencies
docs: add readme
test: add unit tests for cn utility
refactor: extract Button to shared component
```

## Quality Gates

**Pre-commit** (automatic on `git commit`):

- `lint-staged` runs ESLint fix + Prettier on staged `.ts`/`.tsx` files
- Prettier on staged `.json`, `.md`, `.css` files
- `commitlint` validates the commit message format

**Pre-push** (automatic on `git push`):

- `pnpm lint`
- `pnpm format:check`
- `pnpm test:run`

**CI pipeline** (automatic on every PR to `main` or `staging`, and on pushes to `main`):

1. Install dependencies (`--frozen-lockfile`)
2. Type check
3. Lint
4. Format check
5. Tests with coverage (thresholds: 30% lines, functions, branches)
6. SonarCloud quality gate
7. Build

## Project Structure

```
src/
  app/              — Next.js App Router: root layout, home page, API routes
    api/            — Server-side API routes (drawing validation via Claude)
  components/
    universe/       — Full-screen animated star field: ambient stars, shooting star, vignette, presence counter
    add-star/       — Multi-step "Add Star" modal: drawing canvas, step UI, step indicator
    ui/             — Reusable primitives: Button (CVA variants) and Modal (native <dialog>)
    star-detail/    — Placeholder (not yet built)
    post-submit/    — Placeholder (not yet built)
    crisis/         — Placeholder (not yet built)
  hooks/            — useDrawingCanvas: all canvas drawing logic (strokes, undo, export)
  store/            — Zustand stores: modal lifecycle (useModalStore), drawing submission data (useDrawingStore)
  services/         — Placeholder for real-time presence and data services (not yet built)
  types/            — Placeholder for shared TypeScript types (not yet built)
  lib/              — cn() utility (clsx + tailwind-merge)
  constants/        — Animation timing values (ANIMATION) and colour tokens (STAR_COLOURS, COLOURS)
  styles/           — Placeholder (not yet built)
  test/             — Vitest setup file
```

## Architecture Decisions

**Next.js App Router** — SSR and API routes in one framework with no separate backend process. API routes (`/api/validate-drawing`) run server-side, keeping the Anthropic API key off the client.

**Native Canvas API** — The drawing canvas uses `HTMLCanvasElement` directly via a custom hook (`useDrawingCanvas`). No drawing library was introduced to keep the bundle small and avoid opinionated stroke rendering.

**Zustand over Redux** — Two small, focused stores (`useModalStore`, `useDrawingStore`) with minimal boilerplate. Zustand v5 with TypeScript requires the `create<T>()()` double-call pattern.

**Native `<dialog>` for Modal** — The browser's built-in dialog element provides focus trapping, backdrop, and ESC handling for free. Animations are CSS keyframes with a `setTimeout` for the close transition rather than Framer Motion.

**Anthropic for AI validation** — `claude-haiku-4-5-20251001` validates whether a canvas drawing looks like a star. The route fails open (returns `valid: true`) on any error or timeout to avoid blocking users.

**Cloudflare R2 for drawing storage** — Canvas drawings are PNG blobs. R2 provides S3-compatible object storage with zero egress fees, suited for serving user-generated images at scale.

**pnpm over npm** — Strict dependency isolation via symlinked `node_modules`, faster installs with a content-addressable store, and enforced engine constraints via the `engines` field in `package.json`.

## Roadmap

| Version | What                                | Status         |
| ------- | ----------------------------------- | -------------- |
| v0.1.0  | Foundation and universe canvas      | ✅ Done        |
| v0.2.0  | Drawing canvas and worry submission | 🔄 In Progress |
| v0.3.0  | Database and live universe          | 📋 Planned     |
| v0.4.0  | Angel replies and moderation        | 📋 Planned     |
| v1.0.0  | MVP Launch                          | 📋 Planned     |

## Contributing

This is a solo project. To contribute:

1. Clone the repo
2. Create a feature branch from `staging`
3. Follow the conventional commit format
4. Open a PR to `staging` (not `main`)
5. Wait for the CI pipeline and CodeRabbit review to pass
6. All checks must be green before merging

## License

MIT
