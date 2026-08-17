# Phase 9 — Frontend Foundation

> ⚠️ Do not start this phase until the user has explicitly approved it (e.g. "Approved — build Phase 9"). On completion, update `STATE.md` and stop — do not proceed to Phase 10 without separate approval.

## Goal
Stand up the React + Vite frontend skeleton: project scaffolding, core dependencies, routing, a typed API client pointed at the backend, base Clerk provider wiring (not full auth UI yet), global app structure, and a minimal Tailwind-based UI foundation — mobile-first.

## In scope
- Initialize a Vite + React project inside `client/` (replacing the placeholder `.gitkeep`).
- Install core deps: React Router (or the user's preferred router), Tailwind CSS, Framer Motion, Clerk's React SDK, and an HTTP client approach (native `fetch` wrapper is fine — avoid adding a heavy library unless needed).
- Configure Tailwind for mobile-first usage (base styles target small viewports; larger breakpoints are additive later, if ever — treat as mobile-only per `CLAUDE.md`).
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

## Files/areas to create or change
- `client/package.json`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js` (or Vite's Tailwind plugin equivalent).
- `client/src/main.jsx`, `client/src/App.jsx`.
- `client/src/routes/` (route definitions, minimal placeholder page).
- `client/src/lib/apiClient.js` (fetch wrapper reading `VITE_API_BASE_URL`).
- `client/src/lib/clerk.js` or inline `ClerkProvider` setup in `main.jsx`/`App.jsx`.
- `client/index.html`.

## Acceptance criteria
- [ ] `client/` has a working Vite + React project; `npm run dev` starts the dev server without errors.
- [ ] Tailwind is configured and a basic styled element renders correctly, mobile-first.
- [ ] Routing is set up with at least one working placeholder route.
- [ ] `ClerkProvider` wraps the app, configured from `VITE_CLERK_PUBLISHABLE_KEY`, without errors even before login UI exists.
- [ ] API client module exists, reads `VITE_API_BASE_URL` from env, and can successfully call the backend's `/api/health` endpoint as a smoke test.
- [ ] No task-specific or auth-flow UI built yet — scope stays at scaffolding.
- [ ] `STATE.md` updated: Phase 9 marked `Done`, next phase noted, decisions logged (router choice, HTTP client approach).
