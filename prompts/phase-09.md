# Phase 9 — Frontend Foundation

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 9"). On completion, update `STATE.md` and stop — do not proceed to Phase 10 without separate approval.

## Goal
Stand up the React + Vite frontend skeleton: project scaffolding, core dependencies, routing, a typed API client pointed at the backend, base Clerk provider wiring (not full auth UI yet), global app structure, and the **design-token foundation from `client/DESIGN.md`** — mobile-first.

> **`client/DESIGN.md` is the authoritative design reference for this and every later frontend phase.** Read it in full before starting. It governs color, typography, space, motion, navigation, component behavior, copy, and accessibility. Where this prompt says *what* to build, `DESIGN.md` says how it must look and behave. Its §11 "Approved decisions" are settled — do not relitigate them mid-phase.

## In scope
- Initialize a Vite + React project inside `client/` (replacing the placeholder `.gitkeep`).
- **Run `npx impeccable install` inside `client/` immediately after the Vite scaffold exists** (it needs a `package.json`, so it cannot run before scaffolding). Per `DESIGN.md` §10.3 it is a design-quality gate, not a component library — its findings are blocking acceptance criteria at the close of every frontend phase, including this one.
- Install core deps: React Router (or the user's preferred router), Tailwind CSS, Framer Motion, Clerk's React SDK, and an HTTP client approach (native `fetch` wrapper is fine — avoid adding a heavy library unless needed).
- **Implement the full token set from `DESIGN.md` §10.1** in `client/src/styles/tokens.css` — colors (§2.3–2.5), type scale (§3.1), spacing/radii (§4), and motion tokens (§5.1–5.2). Every token in that section, not a subset.
- **Use Tailwind v4 with CSS-first `@theme`**, per `DESIGN.md` §11 — not a v3-shaped `tailwind.config.js`. Putting tokens in CSS is what makes the "no component ever writes a hex" rule enforceable.
- Self-host **Geist Sans + Geist Mono** subset `.woff2` in `client/public/fonts/` and wire them via `@font-face` with the fallback stacks in `DESIGN.md` §3. No font CDN.
- Set up `client/src/styles/globals.css`: reset, `env(safe-area-inset-*)` handling, the focus-ring treatment (`DESIGN.md` §8), and the mobile hygiene rules from §9 that belong at the document level (`100dvh`, `-webkit-tap-highlight-color`, `touch-action`, `overscroll-behavior`).
- Set the viewport and `theme-color` meta tags in `index.html` exactly as specified in `DESIGN.md` §9.
- Configure Tailwind for mobile-only usage (base styles target small viewports; there are no desktop breakpoints in v1 per `DESIGN.md`).
- Set up basic routing structure (route definitions only — actual pages/screens are later phases, e.g. Phase 11+). A minimal placeholder home route is fine to prove routing works.
- Create an API client module that reads `VITE_API_BASE_URL` from env and wraps calls to the backend's `/api` routes (no `/v1`), including attaching the Clerk session token to requests once available.
- Wire the Clerk React provider (`ClerkProvider`) using `VITE_CLERK_PUBLISHABLE_KEY` from env, without yet building login/signup UI (that's Phase 10) — just the provider wrapping the app so auth state is available.
- Set up `client/.env` expectations documented via the root `example.env` (already covers `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`).
- Establish a minimal global app shell file structure (e.g. `src/main.jsx`, `src/App.jsx`, `src/routes/`, `src/components/`, `src/lib/apiClient.js`) without building out real feature UI yet.

## Out of scope
- No login/signup/logout UI (Phase 10).
- No real application layout/navigation (Phase 11).
- No task UI (Phase 12+).
- No 21st.dev MCP component usage yet beyond what's strictly needed to prove the scaffold renders — save real component work for later phases.
- Only the `Button` component from `DESIGN.md` §7 is in scope here; every other component belongs to Phase 11+.

## Files/areas to create or change
- `client/package.json`, `client/vite.config.js`, `client/postcss.config.js` (or Vite's Tailwind v4 plugin equivalent).
- `client/src/styles/tokens.css`, `client/src/styles/globals.css`.
- `client/public/fonts/` — Geist Sans + Geist Mono subsets.
- `client/src/main.jsx`, `client/src/App.jsx`.
- `client/src/routes/` (route definitions, minimal placeholder page).
- `client/src/components/ui/Button.jsx`.
- `client/src/lib/apiClient.js` (fetch wrapper reading `VITE_API_BASE_URL`).
- `client/src/lib/motion.js` (shared Framer variants + `useReducedMotion` helpers per `DESIGN.md` §5.6), `client/src/lib/datetime.js` (UTC → local formatting per §9).
- `client/src/lib/clerk.js` or inline `ClerkProvider` setup in `main.jsx`/`App.jsx`.
- `client/index.html`.

## Acceptance criteria
- [ ] `client/` has a working Vite + React project; `npm run dev` starts the dev server without errors.
- [ ] `npx impeccable install` has been run in `client/` and its check passes (or every finding is fixed) before the phase is marked Done.
- [ ] Every token in `DESIGN.md` §10.1 exists in `client/src/styles/tokens.css` and is reachable as a Tailwind utility.
- [ ] Geist Sans and Geist Mono load from `client/public/fonts/` with no network request to a font CDN, and the fallback stacks match `DESIGN.md` §3.
- [ ] Tailwind is configured and a basic styled element renders correctly on a mobile viewport using tokens only — **no hex value appears in any component file**.
- [ ] `Button` is implemented with all four variants and three sizes from `DESIGN.md` §7, meets the 44px tap-target floor, and has a visible focus ring per §8.
- [ ] Routing is set up with at least one working placeholder route.
- [ ] `ClerkProvider` wraps the app, configured from `VITE_CLERK_PUBLISHABLE_KEY`, without errors even before login UI exists.
- [ ] API client module exists, reads `VITE_API_BASE_URL` from env, and can successfully call the backend's `/api/health` endpoint as a smoke test.
- [ ] `<MotionConfig reducedMotion="user">` wraps the app and the reduced-motion path is verified with the OS setting enabled.
- [ ] No task-specific or auth-flow UI built yet — scope stays at scaffolding.
- [ ] `STATE.md` updated: Phase 9 marked `Done`, next phase noted, decisions logged (router choice, HTTP client approach, Tailwind v4 confirmation, font subsetting approach).
