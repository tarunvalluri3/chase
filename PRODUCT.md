# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual knowledge workers tracking their own personal work and tasks, used almost entirely on a phone (~95% of use, per `CLAUDE.md`) with occasional desktop use. Single-tenant per account (Clerk auth, one person's own task history) — not a team/shared-workspace tool in this scope.

## Product Purpose

Chase is a personal work & productivity tracker — more than a todo app. It exists to preserve the *whole* record of what happened to a task: completed, missed (with reason), deleted (with reason) are all kept as history rather than erased, so patterns become visible over time. The arc: plan work → execute → record what happened → understand why → identify patterns → improve.

## Positioning

Most todo apps treat a missed deadline as silent failure or delete the task and move on. Chase treats a passed deadline as a pending question, not a verdict — `MISSED` is a checkpoint the user must explicitly resolve to either `INCOMPLETE` (with their own reason) or `COMPLETED`. Nothing is ever destructively deleted without a kept reason. This "keep the ledger, never accuse" mechanism is the product's real differentiator, not a UI style.

## Operating Context

Used in short, frequent bursts throughout the day — checking what's due, marking things complete, occasionally reviewing what slipped and why. The Insights/analytics view is a lower-frequency "look back at my own history" moment. No multi-user collaboration, no notifications/reminders system in current scope.

## Capabilities and Constraints

- Task lifecycle: `ACTIVE → COMPLETED`, `ACTIVE → DELETED` (reason required), `ACTIVE → MISSED` (automatic only, deadline-driven, never client-initiated), `MISSED → INCOMPLETE` (reason required) or `MISSED → COMPLETED`, both via one `resolve-missed` action. All terminal states except `MISSED` (the one pending/non-terminal state) are final.
- Stack: React + Vite (client), Tailwind, Framer Motion; Node + Express + Supabase (server, out of scope for this redesign — **no backend or behavior changes**).
- This redesign is visual/interaction only: colors, type, spacing, component styling, navigation chrome, and micro-interactions. No new features, no changed data model, no changed API contracts.
- Existing components/pages to restyle, not rebuild functionally: Home (dashboard), Tasks (5 status-filtered lists), Task detail, Create/Edit task form, Insights (analytics/charts), Profile, bottom navigation, auth screens (Landing/Login/Signup).
- Two pages need to be designed essentially from scratch visually per this request: a complete Profile page and a real Home page (current versions are minimal/placeholder-grade).
- Desktop: the app is mobile-first/mobile-primary, but must also present a clean, professional, non-broken layout on desktop widths (centering/max-width treatment, not a from-scratch desktop IA).

## Brand Commitments

No existing brand name/logo commitments beyond the product name "Chase". Prior design system (`client/DESIGN.md` v1 — dark charcoal/teal, Geist typeface) exists but is explicitly being replaced per this request ("very immature design," "can't send it into production") — treated as anti-reference/evidence of what to move away from, not as a constraint to preserve.

## Evidence on Hand

User supplied 13 reference screenshots (Instagram saved-post screenshots of UI design accounts) showing: light, minimal smart-home app UI (rounded cards, soft shadows, blue accent, floating bottom nav with a bordered pill + separate red/coral FAB), and a "mobile UI spacing system" carousel (4–16px micro-spacing rules for margins, card gaps, button/tab padding) plus a teal/orange/neutral color-palette swatch (Midnight Green `#005151`, Cinnabar `#E84528`, Passive `#898A80`, Black `#191815`, Ancient `#FAF0F5`, Gray `#484A4C` — offered as color-direction inspiration, not necessarily literal hex values to copy verbatim). These establish direction (light, minimal, clean, soft-rounded, generous but systematic spacing, restrained accent color use) rather than literal specs to clone.

## Product Principles

- **The ledger, not the checklist.** Every screen should read as keeping an honest record, not just listing todos — history (missed/incomplete/deleted) stays visible and legible, never hidden or styled as failure.
- **Never accuse.** No red/alarm treatment on the resting `MISSED` or `DELETED` states; red (if used at all) stays bound to an active destructive action button, never a passive state.
- **Thumb-first, mobile-primary.** Primary actions live in easy thumb reach; desktop is a clean secondary presentation, not a redesigned second product.
- **Minimal, systematic, restrained.** One clear accent color family, a real spacing scale, calm typography — "senior designer" quality means restraint and consistency, not maximal decoration.
- **Motion confirms, it doesn't perform.** Micro-interactions should communicate state change and add polish/life, but stay quick and purposeful.

## Accessibility & Inclusion

Existing app already meets WCAG AA contrast, 44×44 tap targets, reduced-motion support, and "never color alone" (status/priority always carry a text label too) — these standards carry forward unchanged into the redesign; the new palette and components must be re-verified against them.
