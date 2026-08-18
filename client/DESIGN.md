# DESIGN.md — Chase Design System v2 ("The Ledger")

> **Status:** Approved 2026-08-19, supersedes v1 (approved 2026-08-17). This is the authoritative design reference for all frontend work.
>
> **Relationship to other docs:** `CLAUDE.md` governs architecture, lifecycle rules, and the approval workflow and always wins on those. This file governs everything visual and interactive. Where a phase prompt describes *what* to build, this file describes *how it should look and behave*.
>
> **Scope:** mobile-primary, with a real (not token-only) desktop presentation — see §6.3. Design for 360–430px wide as the main target; desktop gets a fixed sidebar layout at ≥960px.
>
> **Why v2 exists:** v1 (dark, Geist, Steel Teal) was rejected by the user as "very immature" and "not production-ready." v2 was designed against user-supplied reference screenshots (a light, minimal smart-home app UI; a mobile-UI spacing-system reference) and iterated twice more on direct feedback ("fonts too heavy," "looks generic," "change the colors," then a specific nav-bar/card-style correction against a third reference screenshot). The approved visual proposal was published and approved as a Claude Artifact before this document was written — this file records what was approved, not a fresh design pass.

---

## 0. The thesis (unchanged from v1)

Chase is not a todo app. It keeps the whole record — what got done, what slipped, what was dropped and why — so the patterns can be read later.

**The interface's job is to make recording the truth feel light rather than accusatory.** Every decision below serves that. When something here is ambiguous, resolve it against that sentence.

The visual expression of that thesis in v2 is literal: real ledger rules (thin hairlines) mark summary/scan rows (stat strips, settings lists), and real cards mark individual task records — the app should read as *a kept record*, not a SaaS admin dashboard.

---

## 1. Principles

| Principle | What it means in practice |
|---|---|
| **Never accuse** | `MISSED` means the deadline passed without a confirmation — nothing more. No red, no failure language, no shame iconography on that path. |
| **Calm, not corporate** | Muted, tonal color — never the stock blue/red/green/amber combo every generated dashboard defaults to. Type stays light (400–500 weight; 600 only on buttons/priority labels/active nav). Warm paper neutrals, not stark white-on-grey. |
| **Thumb-first** | Every action lives in the bottom third: bottom navigation, bottom sheets, or the card itself. |
| **Color that means something** | Priority now carries real color (v1 was intentionally monochrome; the user explicitly asked for this): Pine = low, Dusk blue = medium, Clay red = high. Status colors stay semantic and rare elsewhere. |
| **Motion confirms, never entertains** | ~200ms, transform/opacity only, gentle easing — see §5. |
| **Never color alone** | Every status carries a word; every priority carries a label. Legible in greyscale. |

---

## 2. Color

**Theme: light, single theme.** This explicitly reverses v1's "dark only" decision — the user's reference material was uniformly light, and this was confirmed with them directly before building. No dark theme in v2 scope.

### 2.1 Tokens

| Token | Value | Applied to |
|---|---|---|
| `--color-canvas` | `#F6F1E5` | App background — warm parchment |
| `--color-surface` | `#FFFDF7` | Cards, sheets, inputs, nav active capsule |
| `--color-surface-sunken` | `#EFE8D8` | Pressed states, nav track, sunken inputs, chrome |
| `--color-rule` | `rgba(36,31,24,.09)` | Ledger hairlines between rows (stat strips, settings, due-soon lists) |
| `--border-hairline` | `rgba(36,31,24,.10)` | Card borders |
| `--border-strong` | `rgba(36,31,24,.18)` | Input borders (focus/error only — see §7), dividers |
| `--color-ink` | `#241F18` | Titles, primary text — warm near-black, never pure black |
| `--color-ink-2` | `#6B6255` | Body copy, descriptions, reasons |
| `--color-ink-3` | `#99907E` | Timestamps, inactive nav, helper text |
| `--color-ink-disabled` | `#B7AF9C` | Disabled labels only |

### 2.2 Brand / priority

| Token | Value | Role |
|---|---|---|
| `--color-pine` | `#24473E` | Brand accent · `ACTIVE` status · **Low priority** · primary buttons, links, focus ring, active nav capsule text |
| `--color-pine-press` | `#1A342D` | Primary button pressed/hover |
| `--color-pine-tint` | `#E4EBE6` | 14% tint background for Pine-colored chips/pills |
| `--color-dusk` | `#4F6E85` | **Medium priority.** No other job — this is the one place blue appears. |
| `--color-dusk-tint` | `#E7EDF1` | Medium priority chip/pill background |
| `--color-clay` | `#AD5133` | **High priority** + the only destructive-action color (delete button, delete-account row). Never used for a resting status. |
| `--color-clay-tint` | `#F5E7DF` | High priority / danger chip/pill background |

### 2.3 Status (unchanged roles from v1, new values)

| Status | Color | Chip label | Tint |
|---|---|---|---|
| `ACTIVE` | `--color-pine` `#24473E` | Active | `--color-pine-tint` |
| `COMPLETED` | `--color-moss` `#62793F` | Completed | `--color-moss-tint` `#EBEEE0` |
| `MISSED` | `--color-ochre` `#A87A2E` | **Needs review** | `--color-ochre-tint` `#F3EADA` |
| `INCOMPLETE` | `--color-sand` `#8E7A4F` | Not done | `--color-sand-tint` `#F0EAD9` |
| `DELETED` | `--color-stone` `#8B8474` | Deleted | `--color-stone-tint` `#ECE9DE` |
| *danger (action only)* | `--color-clay` `#AD5133` | — | `--color-clay-tint` |

**The most important rule carries over unchanged from v1: red (`--color-clay`) is bound to the destructive action and to HIGH priority — never to the resting `DELETED` or `MISSED` state.** `MISSED` stays ochre, `DELETED` stays stone grey.

### 2.4 Contrast

Every ink/status/priority color above is a dark, muted tone against the `#F6F1E5` canvas or `#FFFDF7` surface — re-verify AA (4.5:1 body / 3:1 large-UI) against both grounds before shipping each token; re-check whenever a value changes. `--color-ink-disabled` and any tint background are decorative/disabled-only, never body text.

---

## 3. Typography

**Three faces, one job each.** Self-hosted via `@fontsource` packages (not a CDN `<link>`, consistent with v1's self-hosting principle — see §10.1).

- **Literata** (serif) — headings and numerals only: `display`, `title`, `section` scale roles. Weight 500 only, never 600+. This is the one deliberately warm, literary touch in the system — used sparingly.
- **Manrope** (sans) — everything else: body, task titles, buttons, labels, nav. Weights 400/500/600. **600 is reserved for buttons, priority labels/pills, and the active nav item — nothing else goes bold.**
- **JetBrains Mono** — anything the app is keeping a record of: deadlines, timestamps, counts, durations, micro-labels. Weights 400/500.

```
Sans fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Serif fallback: Georgia, "Times New Roman", serif
Mono fallback: ui-monospace, "SF Mono", Menlo, Consolas, monospace
```

### 3.1 Scale

| Role | Size / line-height | Weight | Tracking | Face | Used for |
|---|---|---|---|---|---|
| `display` | 38/44 | 500 | -0.015em | Literata | Dashboard/profile stat numerals |
| `title` | 27/34 | 500 | -0.01em | Literata | Screen titles |
| `section` | 19/26 | 500 | -0.008em | Literata | Section headings, sheet titles |
| `task` | 16/23 | 600 | -0.006em | Manrope | Task titles |
| `body` | 15.5/25 | 400 | 0 | Manrope | Descriptions, reasons, helper text |
| `meta` | 12.5/18 | 400 | 0 | Mono | Deadlines, timestamps, counts |
| `micro` | 10.5/14 | 500 | 0.09em, uppercase | Mono | Status chips, priority labels, eyebrows |

### 3.2 Type rules (unchanged from v1 — still correct)

- 16px minimum on every input (prevents iOS auto-zoom).
- `font-variant-numeric: tabular-nums` globally on mono.
- Task titles clamp to two lines; full title in detail view.
- Reasons never truncated in detail view; clamp to three lines in a list.
- Sizes in `rem`, not `px`.
- 10.5px is the floor, uppercase mono labels only.

### 3.3 Voice — unchanged from v1

Carries over verbatim: never say "Failed"/"You missed this"/etc.; the missed prompt, resolve-option copy, reason-field copy, button/toast copy, and error copy from v1 §3.3 all still apply. No copy changes in this redesign.

---

## 4. Space, shape, elevation

| Token | Value | Used for |
|---|---|---|
| `space-1 … space-10` | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 | All gaps and padding |
| `gutter` | 16px | Screen edge inset |
| `card-gap` | 9–10px | Between task cards in a list |
| `radius-sm` | 10px | Chips, inputs, small controls |
| `radius-md` | 14px | Buttons, form inputs, segmented-control track |
| `radius-lg` | 18px | Task cards, form panels, stat/profile panels |
| `radius-pill` | 999px | Nav pill, filter chips, avatars, segmented options |
| `tap-min` | 44×44px | Absolute floor. 48×48 in the bottom nav. |

### 4.1 Two list treatments — this is the key structural decision in v2

- **Real elevated cards** — `--color-surface` background, `radius-lg`, 1px `--border-hairline`, soft warm shadow (`0 1px 2px rgba(36,31,24,.03), 0 8px 18px rgba(36,31,24,.045)`), 4px priority-colored left rail, `card-gap` between them — used for **every task list** (Home's Recent Activity, all five Tasks sections). This is what "cards of tasks" refers to.
- **Ledger rules** — thin `--color-rule` hairlines between rows, no card chrome — used for **summary/scan content**: the Home/Profile stat strip, Due Soon, and every Profile settings row. These are read as a list, not individually acted on the way a task card is.

Do not mix the two within one section. A hover/press state exists only on real cards (translateY(-2px) lift on hover, scale(.985) on press) — ledger rows are static.

### 4.2 Elevation

Flat + hairline is still the default. Real shadow (soft, warm-toned, never a hard corporate drop shadow) appears on: task cards, the bottom nav pill, the FAB, bottom sheets, toasts, and form panels. Nothing else casts a shadow.

---

## 5. Motion

Unchanged mechanism from v1 (transform/opacity only, `MotionConfig reducedMotion="user"`, the one signature completion moment at §5.4 of v1 — not repeated here, still in force), with one adjustment:

- **Easing is gentler.** Default transitions use `cubic-bezier(.25,.7,.4,1)` (was `.22,.61,.36,1`) and durations lean slightly longer where it reads calmer (card hover/press ~180–220ms). Nothing becomes slow or laggy — this is a tone adjustment, not a new motion language.
- All v1 duration/easing tokens (`--dur-instant` 90ms, `--dur-fast` 140ms, `--dur-base` 200ms, `--dur-slow` 280ms, `--dur-sheet` 320ms, the completion-moment choreography) carry forward unchanged in mechanism; only the default ease curve shifts as above.

---

## 6. Navigation

### 6.1 Bottom nav — new spec, replaces v1 §6.1 entirely

Built to match the user's reference screenshot exactly:

- **Pill track**: `--color-surface-sunken` background, 999px radius, ~56px tall, ~5px internal padding, soft shadow, sits centered-left in a flex row.
- **Four items inside the track**: Home, Tasks, Insights, Profile. **No spacer, no FAB inside the track.**
- **Active item** renders as a smaller white (`--color-surface`) capsule containing icon + visible text label, with a subtle shadow; it grows (`flex: 2` vs `flex: 1` for inactive) — animate with a Framer `layout` transition.
- **Inactive items** show icon only, no label, `--color-ink-3`, centered in their flex slot.
- **FAB is a fully separate element**, a sibling of the pill track in the same flex row, with a visible gap (~10px) between them — never overlapping or merged into the pill. 52px circle, radial-gradient Clay fill (`radial-gradient(circle at 32% 28%, #C36A46, var(--color-clay) 72%)`), white plus glyph, soft clay-tinted shadow, `scale(.93)` on press.
- Icons: Lucide, 19–20px, 1.8px stroke (carried from v1).
- Safe-area padding under the whole nav-wrap, same as v1.

### 6.2 AppBar — unchanged structure from v1 §6.2

Title (Literata `title` scale) + mono uppercase context line. At most one trailing action. No back chevron on tab roots (task detail keeps its chevron, per v1).

### 6.3 Desktop (new — v1 had no desktop treatment)

At `≥960px`: a fixed 220px left sidebar (logo + four nav items, vertical, active item gets a `--color-pine-tint` background pill) replaces the bottom nav; content renders in a centered column with `max-width` matching the mobile design intent scaled up, generous padding. No new desktop-only features or IA — same four destinations, same components, just more room and a sidebar instead of a bottom bar. Below 960px, the mobile bottom-nav layout is authoritative.

### 6.4 Routes — unchanged from v1 §6

Same five-status-behind-one-Tasks-tab model, same six real routes (`/`, `/tasks/active|missed|completed|incomplete|deleted`), same sheet-based Create. No IA changes in this redesign.

---

## 7. Components

| Component | Spec |
|---|---|
| `Button` | primary (Pine fill) / secondary (bordered) / ghost / destructive (Clay outline, fills Clay-tint on hover — **not** a solid red fill; red stays reserved and quiet even on its own action) · sm/md/lg · 44px min height |
| `TaskCard` | Real card per §4.1 — priority rail, title, meta row, status/priority chip, conditional action row (same lifecycle-affordance rules as v1 §7.3, unchanged) |
| `StatusChip` | Five variants per §2.3, 14% tint background, mono micro label |
| `PriorityLabel` / priority pill | **Now colored** (this reverses v1 §2.5's "monochrome only" rule, explicitly approved): a dot + label in Pine/Dusk/Clay per priority, 14% tint pill background |
| `FilterRow` | Pills, unfilled outline by default, solid Pine when selected — otherwise unchanged from v1 |
| `TaskForm` | Fields grouped inside one `--color-surface` panel (`radius-lg`, hairline border, soft shadow) — **not** loose fields on the canvas. Inputs are borderless, `--color-surface-sunken` background, focus adds a Pine border + surface background. Priority is a segmented pill control on a sunken track (selected option gets a white pill + soft shadow, colored text per priority) — replaces v1's three-bordered-box layout. |
| `Sheet` / `Toast` / `Skeleton` / `EmptyState` / `ErrorState` | Same mechanics as v1 §7, retokenized to v2 colors only — no behavior change |
| `StatTile` → **ledger strip** | Replaces v1's bordered 2-up KPI-tile grid. A flex row of cells separated by thin vertical rule dividers, Literata numerals, mono micro labels underneath, no card chrome. Used on Home and Profile. |
| `RecentActivity` / task lists | Real `TaskCard`s per §4.1, not rows |
| `DueSoon` | Ledger rows per §4.1 (summary content, not individually-actioned cards) |
| Profile settings rows | Ledger rows, icon + label left, value/chevron right, grouped under mono uppercase section labels (Account / Preferences / Your data / Session) |
| Chart primitives | Unchanged from v1 §7.4/§12 in mechanism — retokenize the color references only (status/priority tokens moved, series-palette *logic* did not) |

### 7.1–7.3 States, empty copy, lifecycle affordances

Unchanged from v1 §7.1–§7.3 verbatim — four states per list/detail view, the same empty-state copy table, the same per-status action-rendering rules. This redesign does not touch behavior or copy.

---

## 8. Profile — new, built out from a placeholder

v1 shipped Profile as a one-line placeholder with only sign-out. v2 builds it in full, using the **ledger-strip + settings-rows** pattern from §7:

- **Header**: avatar (Literata initials on a Pine gradient circle), name, email.
- **Ledger strip**: Completed count, on-time rate — same component as Home's stat strip.
- **Account** section: Name & email, Change password, Two-factor authentication, Active sessions.
- **Preferences** section: Notifications, Time zone.
- **Your data** section: Export your history.
- **Session** section: Sign out, Delete account (the one row using `--color-clay` — the danger-row treatment).

**Implementation note — no new backend, per the explicit "no backend or behavior changes" instruction:** Change password, Two-factor authentication, and Active sessions are **not new custom flows**. Clerk's `<UserProfile />` component already provides all three (password change, TOTP/2FA management, active-session listing) against the existing Clerk account with zero backend work. These rows open that existing Clerk-managed surface (as a modal via `openUserProfile()` from `useClerk()`, or route to a `/profile/account` catch-all rendering `<UserProfile />`) rather than being built from scratch. Notifications and Time zone are static/display-only in this pass (no preferences backend exists) — show current values, no persistence, same "acceptable placeholder, not a lie" standard v1 used for stubbed counts. Export your history and Delete account are UI affordances only in this pass with no wired behavior (no export/account-deletion endpoint exists yet) — they render but should visibly indicate "not yet available" (e.g. a disabled/soon state) rather than silently doing nothing, so as not to imply a working feature that isn't. Confirm scope for these two specifically before wiring any real behavior in a later phase.

---

## 9. Home — rebuilt from placeholder-grade to real

Structure (unchanged data/logic from Phase 14 — `useDashboardTasks`, `lib/taskStats.js` — only presentation changes):

1. AppBar: "Home" + today's date context line.
2. Ledger strip: Active / Completed / Needs review / Deleted counts.
3. Due Soon: ledger rows, ochre amber timing, never red.
4. Recent Activity: real `TaskCard`s (this is the one place v1 used a plain row; v2 upgrades it to match the Tasks list).

Loading/empty/error states unchanged in structure from Phase 14, retokenized.

---

## 10. Accessibility & mobile checklist

Unchanged from v1 §8–§9 verbatim: contrast, 44/48px tap targets, never-color-alone, focus ring (now Pine-colored, 2px, canvas-offset), sheet semantics, live regions, card semantics, text scaling to 200%, reduced motion, viewport/safe-area/`100dvh`/tap-feel/offline/installable/UTC-time rules. Re-verify contrast numbers against the new palette (§2.4) before closing whichever phase touches each surface — the checklist items themselves don't change, only the color values being checked.

---

## 11. Implementation

### 11.1 Fonts — self-hosted via npm, not a CDN link

```
npm install @fontsource/literata @fontsource-variable/manrope @fontsource/jetbrains-mono
```

Import the specific weights needed (Literata 500; Manrope 400/500/600; JetBrains Mono 400/500) in `main.jsx` or `globals.css`, consistent with v1's self-hosting principle — no `fonts.googleapis.com` runtime dependency.

### 11.2 Tokens are still the only source of color

Same rule as v1 §10.1 — no component writes a hex, everything through `tokens.css` `@theme`. Replace v1's token values with §2/§3/§4 of this document; **priority tokens change from monochrome to the Pine/Dusk/Clay values in §2.2** — every consumer of the old `--color-priority-*` tokens (`PriorityRail`, `PriorityLabel`, `priorityConfig.js`, `TaskForm`'s segmented control) must be updated together since the rename isn't 1:1 (three greyscale values become three hued ones with tint pairs).

### 11.3 Where things live

Unchanged from v1 §10.2 — no new directories needed; `components/dashboard/` gains the ledger-strip pattern, `routes/Profile.jsx` gets built out in place.

### 11.4 Impeccable

Unchanged from v1 §10.3 — run the detector before closing out this redesign work, treat findings as blocking.

---

## 12. Approved decisions (v2)

Supersedes v1 §11 in full.

| Decision | Outcome |
|---|---|
| Theme | **Light only**, reversing v1's dark-only decision. Confirmed directly with the user before implementation. |
| Typefaces | **Literata** (serif, headings/numerals, 500 only) + **Manrope** (UI, 400/500/600) + **JetBrains Mono** (data), all self-hosted via `@fontsource`. Replaces Geist entirely. |
| Priority color | **Reverses v1's "monochrome only" rule.** Priority is now colored: Pine low / Dusk blue medium / Clay red high, per explicit user request. |
| Palette | Muted/tonal "Ledger" palette (§2) replaces v1's Charcoal/Steel-Teal/Indigo system entirely. |
| List treatment | Two-tier: real elevated cards for task lists, ledger-rule rows for summary/scan content (§4.1) — new in v2. |
| Bottom nav | Pill track (4 icon slots, one labeled active capsule) + fully separate FAB circle — replaces v1's five-slot single-bar design. |
| Desktop | Real sidebar layout at ≥960px — new in v2, v1 had no desktop treatment. |
| Red | Still bound to destructive action only, **plus** now also HIGH priority — never a resting status. Extends, doesn't reverse, v1's rule. |
| MISSED copy | Unchanged — chip reads "Needs review," section stays "Missed." |
| Navigation IA | Unchanged — five statuses behind one Tasks tab, six real routes. |
