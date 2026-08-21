# DESIGN.md — Chase Design System v3 ("Dark Navy")

**This supersedes v2 ("The Ledger") entirely — a deliberate, user-confirmed full redesign, not an incremental tweak.** No light/dark toggle exists or was added anywhere in this app: v3 is a single hard-coded dark theme, the same way v2 was a single hard-coded light theme. Where a code comment still says `DESIGN.md §x` from v2, treat this file's matching section number as the current authority — the section shapes are kept aligned to v2's on purpose so those cross-references don't go stale.

---

## 0. The thesis

Modern, minimal, premium dark-mode productivity app. The UI should feel focused, calm, precise, premium, modern, clean, productive. Avoid generic SaaS gradients/glow, excessive color, heavy shadow, over-rounded everything, and visual clutter. Navy dominates; ocean blue is the one brand accent; every other color (success/warning/danger/info) communicates meaning only, never decoration.

---

## 1. Principles

- **Navy first.** The app background, surfaces, and most chrome are dark navy. Color is reserved for meaning: brand actions, status, priority.
- **One brand color.** `#1683F7` ocean blue is the only accent — links, focus rings, the primary button, the FAB, selected nav state. It never doubles as a status color.
- **Priority is colored, status is colored — never conflated.** Priority uses Low=green/Medium=blue/High=red on the task-card rail. Status uses its own five-way palette (Active=brand blue, Completed=green, Needs review=amber, Not done=muted slate, Deleted=dimmer slate). Both stay legible in grayscale (word + color together, never color alone).
- **No gradients on functional chrome.** The FAB and buttons are flat fills. A soft radial glow is still fine as an ambient page backdrop (Landing, auth screens) — that's atmosphere, not a component skin.
- **Minimal shadow.** Hierarchy comes from surface contrast (canvas → surface → elevated surface), not heavy drop shadows.

---

## 2. Color

### 2.1 Tokens (`client/src/styles/tokens.css`)

| Token | Value | Role |
|---|---|---|
| `--color-canvas` | `#06111B` | App background |
| `--color-surface` | `#0B1A27` | Cards, sheets, inputs |
| `--color-surface-sunken` | `#102235` | Elevated surface (nav bars, panels) |
| `--color-surface-hover` | `#142A40` | Hover/pressed surface |
| `--color-ink` | `#F2F6FA` | Primary text |
| `--color-ink-2` | `#A7B5C2` | Secondary text |
| `--color-ink-3` | `#6F8190` | Muted text, inactive nav, timestamps |
| `--color-ink-disabled` | `#4A5A68` | Disabled labels only |
| `--border-hairline` | `#1B344A` | Default border |
| `--border-strong` | `#254761` | Strong/focused border |
| `--color-brand` | `#1683F7` | Primary ocean blue |
| `--color-brand-hover` | `#0874E5` | Primary hover/press |
| `--color-brand-soft` | `#0D2C4A` | Brand tint background |

### 2.2 Brand / priority

`--color-pine`/`--color-pine-press`/`--color-pine-tint` are kept as stable alias names (repointed to brand/brand-hover/brand-soft) so the ~15 files that already reference "pine" by name — `BottomNav`, `Sidebar`, `ResolveSheet`, `clerkAppearance.js`'s badge, the auth backdrop glow — resolve to the new brand blue with zero code changes. Treat "pine" and "brand" as the same token family going forward.

Priority: **Low → green, Medium → blue, High → red.** Low priority deliberately aliases `--color-moss` (success green), **not** brand blue — brand identity and "this is a low-priority task" are unrelated concepts in v3 (v2's pine served both roles; that coupling is gone).

| Priority | Rail/label color | Tint |
|---|---|---|
| Low | `--color-moss` `#52D273` | `#103522` |
| Medium | `--color-dusk` `#3B9CFF` | `#0B2943` |
| High | `--color-clay` `#FF6262` | `#3A171C` |

### 2.3 Status

| Status | Chip label | Color | Tint |
|---|---|---|---|
| ACTIVE | Active | `--color-brand` `#1683F7` | — |
| COMPLETED | Completed | `--color-moss` `#52D273` | `#103522` |
| MISSED | Needs review | `--color-ochre` `#F2B84B` | `#382A12` |
| INCOMPLETE | Not done | `--color-sand` `#8FA1B3` | `#14212C` |
| DELETED | Deleted | `--color-stone` `#6B7A89` | `#101A22` |

The brief only defines four semantic colors (success/warning/danger/info); the app has five statuses. `INCOMPLETE`/`DELETED` deliberately get their own **muted neutral** tones rather than reusing warning or danger — a confirmed-not-done task or a deleted one shouldn't visually imply the same severity as an active warning or a destructive action. `MISSED` reads "Needs review" and `INCOMPLETE` reads "Not done" — unchanged wording from v2, only colors moved (see CLAUDE.md's MISSED-is-a-checkpoint rule, still binding).

Chip background is a 16% `color-mix()` of the status color over `--color-surface`, computed live in `StatusChip.jsx` — not a separate `-tint` token — so it always tracks the surface color correctly.

### 2.4 Contrast

Every text/background pairing above (primary text `#F2F6FA` on canvas `#06111B`, secondary `#A7B5C2` on surface `#0B1A27`, etc.) clears WCAG AA at body-text sizes. Status/priority colors on their own tint backgrounds clear AA for large/bold text (chip and badge use).

---

## 3. Typography

**Inter is the only typeface** (self-hosted via `@fontsource-variable/inter`, no CDN). No serif anywhere — v2's Literata is gone, and so is the separate JetBrains Mono face; numerals that need fixed-width alignment use Inter's own tabular figures via the `.font-tabular` utility (`font-variant-numeric: tabular-nums`) instead of a second font file.

### 3.1 Scale (`--text-*` tokens, same names as v2, values remapped)

| Token | Size / line-height | Weight | Tracking | Role |
|---|---|---|---|---|
| `--text-display` | 40px / 44px | 600 | 0 | Large KPI |
| `--text-title` | 32px / 38px | 600 | 0 | Screen title |
| `--text-section` | 20px / 28px | 600 | 0 | Page-section header ("Due soon", sheet titles) |
| `--text-task` | 17px / 24px | 600 | 0 | Card/task title |
| `--text-body` | 16px / 24px | 400 | 0 | Body copy |
| `--text-meta` | 14px / 20px | 400 | 0 | Secondary text, form labels |
| `--text-micro` | 12px / 16px | 600 | 0.06em | Labels/badges/uppercase section labels |

`--text-section` is Chase's own page-header role (sentence case, not the brief's uppercase "Section label" concept) — it covers "Due soon"/"Recent activity"/sheet titles, which read as plain headers in the reference screenshots, not tracked eyebrow labels. `--text-micro` covers both small badges (StatusChip, PriorityLabel) and uppercase section eyebrows (Profile's "ACCOUNT"/"PREFERENCES") — one token, two visually-compatible uses, same as v2.

### 3.2 Type rules

- 16px minimum on every input (`text-base` in `TaskForm.jsx`'s `inputClassName`) — prevents iOS auto-zoom.
- `rem`, never `px`.
- Task titles clamp to 2 lines (`line-clamp-2`); reasons (missed/incomplete/deletion) are never truncated in the detail view.
- Numerals that need alignment (stat counts, chart axis labels, filter/tab counts, timestamps, durations) get `.font-tabular`.

### 3.3 Voice — unchanged from v2

Non-accusatory, past-tense confirmations ("Completed" / "Deleted" / "Saved"), never a raw API error message surfaced to the user, MISSED framed as a checkpoint never a verdict.

---

## 4. Space, shape, elevation

### 4.1 Space

The 8px scale itself is unchanged from v2 (4/8/12/16/20/24/32/40/48/64px — `--spacing-1` through `--spacing-10`) — only two usage conventions moved: `--spacing-gutter` (screen horizontal padding) is now 24px (was 16px), and `--spacing-stack-gap` (inter-card gap) is now 12px (was 9px). Card padding is 20px (`p-5`, `--spacing-5`) — bumped from v2's `p-4`/16px on `TaskCard` and form panels.

### 4.2 Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Chips, small controls |
| `--radius-md` | 12px | Buttons, form inputs, segmented tracks |
| `--radius-lg` | 16px | Task cards, form panels, stat panels |
| `--radius-xl` | 20px | Sheet top corners |
| `--radius-xxl` | 24px | Reserved for hero-scale surfaces |
| `--radius-pill` | 999px | Nav pills, filter chips, avatars, switches |

### 4.3 List treatment

Unlike v2's two-tier "elevated cards vs. ledger rows" split, v3 uses **one consistent card treatment** everywhere a list of individually-actioned records appears (task lists, Recent activity, Due soon) — dark surface, 1px hairline border, 16px radius, minimal shadow, 4px priority rail. Summary/settings rows (Profile's account/preferences sections) still use hairline-divided rows with no per-row card chrome, since that's scan content, not individually-actioned records — same distinction v2 drew, just no longer branded as "ledger rows" specifically.

### 4.4 Elevation

Shadows are flat, low-alpha black (`rgba(0,0,0,...)`), not the warm-brown-tinted recipes v2 used on its light background — `--shadow-card`, `--shadow-panel`, `--shadow-sheet`, `--shadow-toast` in `tokens.css`. The one exception is `--shadow-fab`, tinted brand blue (`rgba(22,131,247,.35)`) to match the FAB's own fill color.

---

## 5. Motion

Subtle and purposeful only. Micro-interaction ~150ms, standard transition ~200ms, sheets/modals ~250–300ms, `ease-out` default (`client/src/lib/motion.js`'s `DURATION`/`EASE_*` constants). `BottomNav`'s active-tab indicator changed from v2's `layoutId` capsule-morph (a growing pill that hid inactive labels) to a simple opacity-fade static background chip behind an always-visible icon+label — less motion, not more, per the brief's "no gratuitous animation" rule.

---

## 6. Navigation

### 6.1 Bottom nav — replaces v2 §6.1

A dark, rounded, bordered bar (`bg-surface-sunken`, `--radius-xl`) holding **four always-visible icon+label slots** — no growing/morphing capsule, no hidden inactive labels. The active item gets brand-blue icon/label color plus a subtle static `--color-brand-soft` background chip sized to content. The Create FAB is a fully separate 56×56px circle, flat `--color-brand` fill (no gradient), a sibling of the bar in the same row.

### 6.2 AppBar — unchanged structure from v2

Screen title (`title` scale) + a context line beneath it (e.g. the weekday/date on Home, the current status filter on Tasks). At most one trailing action (the notification bell). No back chevron on tab roots.

### 6.3 Desktop (≥960px)

Unchanged mechanism from v2: a fixed 220px left `Sidebar` replaces the bottom nav entirely at this breakpoint. Same four destinations, active item gets a `--color-brand-soft` background pill — this was already the "always-visible label + static colored background" pattern the bottom nav was brought in line with, so no structural change was needed here, only token repoints.

### 6.4 Routes — unchanged from v2

Five statuses behind one Tasks tab, six real routes (`/tasks/:status`, `/tasks/:status/:id`). No navigation/IA changes in v3.

### 6.5 Tasks-list toolbar — new in v3

Beneath the status filter pills, a sort control (Due soon / Priority / Newest) and a list/grid view toggle — both purely client-side (re-sorts/re-lays-out the already-fetched section list; no new API parameter, no persisted server state). State lives in `TasksProvider` (`sortBy`/`viewMode`), read by both `FilterRow` (the controls) and `TaskList` (the effect). `viewMode` persists to `localStorage` as a convenience; `sortBy` resets each session.

---

## 7. Components

### 7.1 Cards

Dark navy surface, 1px hairline border, 16px radius, minimal shadow (surface-contrast carries hierarchy, not shadow depth). `TaskCard` additionally carries a 4px priority-colored left rail and a decorative leading checkbox circle (unfilled for ACTIVE, filled + check for COMPLETED) — purely a visual status indicator, not a second tap target; the existing Complete/Delete text buttons remain the only way to actually trigger a lifecycle action, so there's no risk of a duplicate/conflicting completion path.

### 7.2 Inputs

Dark surface, subtle border, brand-blue border on focus, muted placeholders. 44px tap-target floor everywhere; primary CTA buttons are ~52px tall.

### 7.3 Buttons

- **Primary** — `#1683F7` fill, white text, 12px radius, ~52px height for CTA-scale usage (44px for `size="md"`, 36px for `size="sm"`). No gradient.
- **Secondary** — transparent/dark surface, subtle border, secondary text color.
- **Ghost** — transparent, no border.
- **Destructive** — a red outline that fills a red tint on hover, never a solid red fill; red stays reserved and quiet even on its own action (unchanged rule from v2).

### 7.4 FAB

56×56px circle, flat `#1683F7`, white icon, brand-tinted glow shadow. No gradient (v2's radial clay gradient is gone).

### 7.5 Badges / chips

`StatusChip` (5 status variants) and `PriorityLabel` (3 priority variants) both use a `color-mix()`-derived tint background over `--color-surface` at the component's own base color, computed live rather than from a separate `-tint` token — this is unchanged mechanics from v2, just new underlying colors.

### 7.6 Stat tiles — restructured in v3

`StatTile`/`LedgerStrip` (`components/dashboard/StatTile.jsx`) moved from v2's thin-rule-divided ledger strip (a big serif numeral + small colored label, no icon) to a **card with an optional colored icon bubble** per cell — a lucide icon in a `color-mix()`-tinted circle, above a bold numeral, above a muted label, no divider rules between cells. Used by Home's 5-cell status row (`StatusCounts`, with icons) and Profile's 2-cell stat row (`KpiRow`/Profile, without icons — a plain numeral suffices there). `computeStatusCounts`/`STATUS_ORDER` (`lib/taskStats.js`) are unchanged; this was a render-layer restructure only.

### 7.7 Sheets / toast / skeleton / empty / error states

Same mechanics as v2 (`Sheet.jsx`'s drag-to-dismiss + focus trap, `Toast.jsx`'s single-at-a-time `aria-live` viewport, `Skeleton.jsx`'s shimmer sweep), retokenized for dark surfaces. The shimmer sweep now cycles `--color-surface` → `--color-surface-hover` (was `--color-surface` → `--color-surface-sunken` in v2, since `-sunken` is now the *elevated* surface role, not a dimmer one).

### 7.8 Task creation form — Reminder/Repeat added in v3

`TaskForm.jsx` gained two new real (backend-wired, not decorative) fields beyond v2's Title/Description/Deadline/Priority:

- **Reminder** — a switch (`role="switch"`), `reminder_enabled` on the task. Opts the task into the *existing* global deadline-reminder sweep (`DEADLINE_REMINDER_HOURS_BEFORE`, unchanged from Phase 17) rather than introducing a second, per-task custom offset — the toggle is a filter on top of infrastructure that already existed, not a new notification mechanism.
- **Repeat** — a 4-option segmented control (Does not repeat / Daily / Weekly / Monthly, `repeat_rule`), styled identically to the existing Priority segmented control. Completing a repeating task spawns a brand-new `ACTIVE` task (never mutates the completed one) with its deadline advanced from the **original** deadline by one interval — see `server/src/services/recurrenceService.js`. This never introduces a new task-lifecycle transition; it's a side effect appended after `completeTask`/`resolveMissedTask`'s existing `COMPLETED` write, the same pattern `notificationService` already uses.

A static blue "Tip" callout (`--color-brand-soft` background, no data binding) closes out the form, matching the reference screenshot.

---

## 8. Profile

Unchanged structure from v2 (avatar header, a 2-cell stat row, grouped settings sections with uppercase mono-adjacent section labels and hairline-divided rows) — v3 adds an explicit "Edit profile" button next to the avatar (calls the same `openUserProfile()` Clerk handler the "Name & email" row already used) and flattens the avatar's v2 radial-gradient fill to a flat `--color-brand` circle, matching the FAB's no-gradient rule.

---

## 9. Home

Unchanged structure from v2 (greeting, notifications banner, status counts, Due soon, Recent activity) — only `StatusCounts`' stat-tile rendering changed (§7.6 above); `DueSoon`/`RecentActivity` are pure token restyles.

---

## 10. Accessibility & mobile checklist

Unchanged from v2 and re-verified against the new palette: `:focus-visible` uses `var(--color-accent)` (now brand blue) at 2px with a 2px offset; every status/priority pairing carries both a color and a word so grayscale legibility holds; 44px tap-target floor (48px in the bottom nav) unchanged; safe-area insets, `100dvh`, `overscroll-behavior-y: contain`, and reduced-motion handling are all unchanged mechanisms, just running against new token values.

---

## 11. Implementation

### 11.1 Fonts

Self-hosted via `@fontsource-variable/inter`, imported once in `client/src/styles/globals.css`. No CDN link. v2's three-package font stack (`@fontsource/literata`, `@fontsource-variable/manrope`, `@fontsource/jetbrains-mono`) was removed from `client/package.json` entirely.

### 11.2 Tokens are still the only source of color

No component may write a literal hex value — confirmed via `grep -rnE "#[0-9a-fA-F]{3,8}" src` returning zero matches outside `tokens.css` itself. Every color is a `var(--color-*)` reference.

### 11.3 Where things live

`client/src/styles/tokens.css` (all tokens), `client/src/styles/globals.css` (font import, base reset, `.font-tabular`/`.shimmer` utilities), `client/src/lib/motion.js` (shared Framer Motion timing).

### 11.4 No theme toggle

Confirmed via a full-repo search: no light/dark switching mechanism exists anywhere in the client. v3 is a single, hard-coded dark theme, same as v2 was a single hard-coded light theme — this was not introduced as part of the redesign and is out of scope unless separately requested.

---

## 12. Approved decisions (v3, supersedes v2 §12)

| Decision | Outcome |
|---|---|
| Theme | Dark only (reverses v2's light-only decision) |
| Typeface | Inter only, self-hosted; replaces Literata + Manrope + JetBrains Mono entirely |
| Numeral alignment | `.font-tabular` (Inter's own tabular figures) replaces the separate JetBrains Mono face |
| Palette | Dark navy / ocean-blue system replaces v2's warm-parchment "Ledger" palette |
| Brand vs. Low priority | Decoupled — Low priority is green (success), brand is blue; v2's pine served both roles, v3's does not |
| INCOMPLETE / DELETED color | Two distinct muted neutrals (not a reuse of warning/danger) — the app has 5 statuses but the brief only defines 4 semantic colors |
| FAB / avatar | Flat fills, no gradients — reverses v2's radial-gradient FAB and avatar |
| List treatment | One consistent elevated-card treatment for actioned lists; hairline rows remain for scan/settings content — simplifies v2's two-tier split without changing its underlying logic |
| Bottom nav | Always-visible icon+label per tab, static colored background on the active item — replaces v2's label-hides-until-active capsule-morph |
| Desktop sidebar | Unchanged from v2 — already matched the "always-visible label" pattern the bottom nav was brought in line with |
| Stat tiles | Icon-bubble cards replace v2's divider-rule ledger strip |
| TaskCard checkbox | Added as a decorative status indicator only, not a second tap target — Complete/Delete buttons remain the sole lifecycle-action affordance |
| Sort + grid/list view | New, real, client-side-only Tasks-list controls (no backend change) |
| Reminder (per-task) | New, real, backend-wired — an opt-in filter on the existing global deadline-reminder sweep, not a new per-task offset mechanism |
| Repeat (recurring tasks) | New, real, backend-wired — spawns a new task on completion, anchored to the original deadline; never mutates the state machine or the completed task itself |
| Notifications feed tabs | New, real, client-side-only All/Tasks/Reminders/System filter over the existing feed data |
| Theme toggle | Not added — still a single hard-coded theme, confirmed via full-repo search before concluding so |
