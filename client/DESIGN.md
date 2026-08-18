# DESIGN.md — Chase Design System v1

> **Status:** Approved 2026-08-17. This is the authoritative design reference for all frontend work (Phases 9–16).
>
> **Relationship to other docs:** `CLAUDE.md` governs architecture, lifecycle rules, and the approval workflow and always wins on those. This file governs everything visual and interactive — color, type, space, motion, navigation, component behavior, copy, and accessibility. Where a phase prompt describes *what* to build, this file describes *how it should look and behave*.
>
> **Scope:** mobile-only. Per `CLAUDE.md`, ~95% of use is on a phone. There are no desktop breakpoints in v1. Design for 360–430px wide; anything wider just centers with a max width.

---

## 0. The thesis

Chase is not a todo app. It keeps the whole record — what got done, what slipped, what was dropped and why — so the patterns can be read later.

**The interface's job is to make recording the truth feel light rather than accusatory.** Every decision below serves that. When something here is ambiguous, resolve it against that sentence.

---

## 1. Principles

| Principle | What it means in practice |
|---|---|
| **Never accuse** | `MISSED` means the deadline passed without a confirmation — nothing more. No red, no failure language, no shame iconography on that path. The interface asks what happened; it doesn't decide. |
| **Thumb-first** | Every action lives in the bottom third: bottom navigation, bottom sheets, or the card itself. Nothing critical is parked in a top-right corner. |
| **One accent, few hues** | Steel Teal is the only decorative color. Green, amber, and red are semantic and rare — they appear only when they mean something, which is what makes them legible when they do. |
| **Motion confirms, never entertains** | Animation exists to show that state changed and where it went. ~200ms, transform and opacity only, one signature moment in the whole app. |
| **Never color alone** | Every status carries a word; every priority carries a label. Color is reinforcement, not the channel. The app must be legible in greyscale. |

---

## 2. Color

### 2.1 Source ramps

Taken directly from the approved palette. Six values in each ramp are exact; the middle step (marked ⬦) is derived to complete the scale.

**Charcoal** — ground and surfaces
`#353535` · `#2C2C2C` · `#232323` · ⬦`#1A1A1A` · `#111111` · `#090909` · `#000000`

**Japanese Indigo** — ambient brand
`#285C70` · `#255468` · `#224D5F` · ⬦`#1F4657` · `#1C3E4E` · `#193746` · `#16303D`

**Steel Teal** — interactive accent
`#3F5A66` · `#486675` · `#517380` · ⬦`#5A8090` · `#60899B` · `#6692A4` · `#6C9BAD`

**Mid Grey** — receded / archival
`#757575` · `#7E7E7E` · `#808080` · ⬦`#909090` · `#989898` · `#A1A1A1` · `#AAAAAA`

**Foggy** — warm neutral
`#9E9C8A` · `#A8A692` · `#B1AF9A` · ⬦`#BAB8A2` · `#C4C2AA` · `#CDCAB2` · `#D6D3BA`

**Star Dust** — ink
`#CECAC8` · `#D8D3D1` · `#E2DDDA` · ⬦`#EBE5E2` · `#F2EDEA` · `#F9F3F1` · `#FFFAF8`

### 2.2 What each ramp is for

The palette has two cool families and two warm-neutral families. That tension is the identity: **cool for the system, warm for the person.** Anything the app computed or is asking about is cool. Anything the user said, wrote, or is reading is warm.

- **Charcoal** — the ground and every surface. Depth comes from luminance layering, not shadow.
- **Japanese Indigo** — ambient only: selected states, the active nav pill, the auth backdrop wash. **Never a button fill** — it sits too close to the ground to carry an affordance on its own.
- **Steel Teal** — the single interactive accent. Primary buttons, links, focus rings, the create action.
- **Mid Grey** — what has receded: deleted tasks, disabled controls, secondary metadata.
- **Foggy** — warm-neutral, two specific jobs: it marks `INCOMPLETE`, and it sets every micro-label in the app. The "human handwriting" tone.
- **Star Dust** — ink. Primary text, and the fill of a HIGH-priority rail.

### 2.3 Surface & ink tokens

| Token | Value | Applied to |
|---|---|---|
| `--color-canvas` | `#0D0D0D` | App ground, behind everything |
| `--color-surface` | `#161616` | Task cards, stat tiles, list rows |
| `--color-raised` | `#1E1E1E` | Bottom sheets, dialogs, inputs |
| `--color-overlay` | `#262626` | Pressed states, drag handle, popovers |
| `--border-hairline` | `rgba(108,155,173,.14)` | Card and section borders — teal-tinted, not neutral white alpha |
| `--border-strong` | `rgba(108,155,173,.26)` | Input borders, dividers under headers |
| `--color-ink` | `#F2EDEA` | Task titles, headings, button labels |
| `--color-ink-2` | `#A6A6A6` | Body copy, descriptions, reasons |
| `--color-ink-3` | `#898989` | Timestamps, inactive nav, helper text |
| `--color-ink-disabled` | `#5C5C5C` | Disabled labels only — never real content |

Borders carry a whisper of the accent rather than neutral white alpha. It's a small thing that stops a dark UI reading as grey-on-grey.

### 2.4 Status colors

**The most important rule in the palette: red is bound to the destructive _action_, never to the resting `DELETED` _state_.** A deleted task is archived history, not an alarm. Red only ever appears on a button the user is about to press — at most once per screen.

| Status | Color | Chip label | Rationale |
|---|---|---|---|
| `ACTIVE` | `#6C9BAD` | Active | Brand-forward. The working state deserves the accent. |
| `COMPLETED` | `#4FA97A` | Completed | Muted sage green, desaturated to sit with the palette — not a stock success green. |
| `MISSED` | `#E0A64E` | **Needs review** | Amber reads *attention*, not *failure*. Correct for a pending checkpoint. |
| `INCOMPLETE` | `#B1AF9A` | Not done | Foggy — settled, honest, warm. The user's own verdict, recorded without judgement. |
| `DELETED` | `#898989` | Deleted | Receded grey. Archived, not alarming. |
| *danger (action only)* | `#D9635E` | — | Delete button and destructive confirms only. |

Status chips use the color as text on a **14% alpha tint** of the same color over the surface.

> **The `MISSED` chip reads "Needs review", not "Missed."**
> The API status stays `MISSED` and the section is still labelled Missed for navigability, but the chip on the card states the action required rather than passing a verdict. This is `CLAUDE.md`'s lifecycle rule made visible: a passed deadline is a question, not an answer.

### 2.5 Priority is monochrome

Priority gets **no hue**. If it did, a high-priority missed task would show amber against orange against red and mean nothing.

Priority is expressed as a **3px left rail on the card plus a text label** — brighter is more urgent. It never competes with status color, it survives greyscale, and it never relies on color alone.

| Priority | Rail | Label color | Treatment |
|---|---|---|---|
| `HIGH` | `#F2EDEA` | `#F2EDEA` | Full-brightness rail, label at full ink |
| `MEDIUM` | `#B1AF9A` | `#B1AF9A` | Foggy rail |
| `LOW` | `#757575` | `#898989` | Grey rail, quietest |

### 2.6 Contrast — verified, not estimated

WCAG AA requires 4.5:1 for body text, 3:1 for large text and UI boundaries. Re-verify this table whenever a color changes.

| Foreground | On | Ratio | Result |
|---|---|---|---|
| `#F2EDEA` ink | `#0D0D0D` | 16.7:1 | AAA |
| `#A6A6A6` secondary | `#0D0D0D` | 7.99:1 | AAA |
| `#898989` tertiary | `#161616` | 5.18:1 | AA |
| `#6C9BAD` accent | `#0D0D0D` | 6.41:1 | AA |
| `#4FA97A` completed | `#0D0D0D` | 6.74:1 | AA |
| `#E0A64E` needs review | `#0D0D0D` | 9.01:1 | AAA |
| `#B1AF9A` not done | `#0D0D0D` | 8.77:1 | AAA |
| `#D9635E` danger | `#0D0D0D` | 5.46:1 | AA |
| `#0D0D0D` ink | `#60899B` button | 5.14:1 | AA |
| `#757575` | `#161616` | 3.78:1 | **Large / decorative only** |

> **`#757575` is the one guardrail.** It fails AA for body text. Permitted only as the LOW-priority rail and for disabled controls — never for readable content. Anything a user must read uses `#898989` or lighter.

### 2.7 Theme

**Dark only in v1.** The palette is unmistakably dark-first, and shipping one theme beautifully beats two adequately. Tokens are structured so a light theme is a swap of one block later — Foggy and Star Dust already provide a foundation. Do not add a light theme without explicit approval.

---

## 3. Typography

**One family, two cuts, three weights. That is the entire type system.**

- **Geist Sans** — everything.
- **Geist Mono** — anything the app is keeping a record of: deadlines, timestamps, counts, durations, status/priority micro-labels.

That split isn't decorative. Chase's premise is preserving a ledger, so the ledger gets a ledger's typeface — a glance at any screen tells you which numbers are data and which are chrome.

Geist is variable, open-licensed, self-hosted as a subset `.woff2` from `client/public/fonts/` (~90KB total), and holds up at 11px on a 3x display. **Weights used: 400, 500, 600.** No 700, no 800 — hierarchy comes from size and color, which is what "minimal typography" actually means.

```
Sans fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Mono fallback: ui-monospace, "SF Mono", Menlo, Consolas, monospace
```

### 3.1 Scale

Mobile, `rem`-based on a 16px root.

| Role | Size / line-height | Weight | Tracking | Face | Used for |
|---|---|---|---|---|---|
| `display` | 32 / 36 | 600 | -0.03em | Mono | Dashboard stat numerals |
| `title` | 24 / 30 | 600 | -0.025em | Sans | Screen titles |
| `section` | 18 / 24 | 600 | -0.012em | Sans | Section headings, sheet titles |
| `task` | 16 / 22 | 500 | -0.008em | Sans | Task titles |
| `body` | 15 / 22 | 400 | 0 | Sans | Descriptions, reasons, helper text |
| `meta` | 13 / 18 | 400 | 0 | Mono | Deadlines, timestamps, counts |
| `micro` | 11 / 14 | 600 | 0.11em, uppercase | Mono | Status chips, priority labels, eyebrows |

### 3.2 Non-negotiable type rules

- **16px minimum on every input.** Anything smaller triggers iOS Safari's auto-zoom on focus and breaks the layout.
- **`font-variant-numeric: tabular-nums`** globally on mono. Counts, dates, and durations must not jitter when they update.
- **Task titles clamp to two lines** (`-webkit-line-clamp: 2`); the full title shows in detail view. Never truncate mid-word on a single line.
- **Reasons are never truncated in detail view.** They are the product's real payload. Clamp to three lines in a list, full text on the task page.
- **Sizes in `rem`, not `px`,** so the layout survives OS text scaling to 200%.
- **11px is the floor**, and only for uppercase mono labels where cap height keeps it legible.

### 3.3 Voice

Copy is design material here more than in most apps, because the product's hardest moment is asking someone to account for something that slipped.

| Context | Rule |
|---|---|
| **Never say** | "Failed" · "You missed this" · "Overdue and incomplete" · "Why didn't you finish?" · any exclamation mark |
| **Missed prompt** | *"The deadline passed before this was confirmed. What actually happened?"* |
| **Resolve options** | *"I completed this"* and *"I didn't complete this"* — parallel, equal weight, **neither pre-selected**. Both are legitimate answers. |
| **Reason fields** | Label: *"What got in the way?"* Helper: *"This is kept as history — it's what makes the patterns readable later."* Never *"Reason (required)"*. |
| **Buttons** | Say what happens: *Complete* · *Delete task* · *Save changes*. The toast confirms in past tense: *Completed* · *Deleted* · *Saved*. |
| **Errors** | What broke, then the fix. *"This task was already resolved somewhere else. Pull to refresh."* No apology, no error code shown to the user. |

---

## 4. Space, shape, elevation

| Token | Value | Used for |
|---|---|---|
| `space-1 … space-10` | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 | All gaps and padding. Nothing off-grid. |
| `gutter` | 16px | Screen edge inset, every screen |
| `stack-gap` | 10px | Between task cards in a list |
| `radius-sm` | 8px | Chips, inputs, small controls |
| `radius-md` | 12px | Buttons, segmented control items |
| `radius-lg` | 16px | Task cards, stat tiles |
| `radius-xl` | 22px | Bottom sheets (top corners only) |
| `radius-pill` | 999px | Nav pill, filter chips, avatars |
| `tap-min` | 44×44px | Absolute floor. 48×48 in the bottom nav. |

Use flex/grid `gap` for sibling spacing — not per-element margins that collapse or double.

### 4.1 Elevation without shadow

On a near-black ground, drop shadows read as smudge. Depth comes from **surface luminance plus a 1px teal-tinted hairline**. Shadow is permitted in exactly three places, where a real occlusion is happening:

- Bottom navigation — `0 -1px 0 var(--border-hairline)` plus a blurred backdrop.
- Bottom sheets — `0 -12px 40px rgba(0,0,0,.55)` over a scrim.
- Toasts — `0 6px 24px rgba(0,0,0,.45)`.

Everything else — cards, tiles, inputs, chips — is flat with a hairline. This is what keeps a dense list calm rather than lumpy.

---

## 5. Motion

**Transform and opacity only.** Never `height`, `top`, `left`, or `width` — those cause layout thrash on mid-range Android and are the fastest way to make a mobile app feel cheap.

### 5.1 Easing tokens

| Token | Value | Used for |
|---|---|---|
| `--ease-out` | `cubic-bezier(.22,.61,.36,1)` | Default. Presses, fades, color changes. |
| `--ease-enter` | `cubic-bezier(.16,1,.3,1)` | Things arriving: cards, sheets, toasts. |
| `--ease-exit` | `cubic-bezier(.4,0,1,1)` | Things leaving. Accelerates out — no lingering. |
| spring (sheets) | `{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }` | Framer Motion: sheets, nav pill, drag-release. |

### 5.2 Duration tokens

| Token | ms | Applied to |
|---|---|---|
| `--dur-instant` | 90 | Press feedback |
| `--dur-fast` | 140 | Chip selection, focus, icon swap |
| `--dur-base` | 200 | Route transitions, card enter/exit, toasts |
| `--dur-slow` | 280 | Complete sweep, list reflow after an action |
| `--dur-sheet` | 320 | Bottom sheet in/out (spring-driven) |

### 5.3 Travel distances

**Micro 4px** (press) · **small 8px** (page transition, list entry) · **medium 12px** (toast). Sheets travel their own height. Nothing else moves more than 12px, ever.

### 5.4 The one signature moment

Completing a task is the only place the app allows itself a flourish, because it's the only moment worth celebrating. ~620ms end to end:

1. **0–90ms** — card scales to `0.97`; light haptic (`navigator.vibrate(10)` where supported).
2. **90–290ms** — a green wash sweeps left→right via `transform: scaleX` on a pseudo-element.
3. **200–440ms** — the checkmark draws itself with an SVG `pathLength` animation.
4. **380–620ms** — the card fades and the list closes the gap via a Framer `layout` transition. Toast slides up: *Completed*.

**Delete gets no flourish** — sheet dismisses, card fades over 200ms, list closes. Sober, because deletion should feel deliberate rather than fun.

**Resolving a missed task** uses the completion sequence when resolved as `COMPLETED`, and the sober treatment when resolved as `INCOMPLETE`. The animation itself tells the user which record was written.

### 5.5 Everything else

- **Route transitions** — cross-fade + 8px Y, 200ms. Never horizontal slide; it implies a hierarchy a tab bar doesn't have.
- **Bottom nav indicator** — Framer `layoutId` on the indigo pill so it travels between tabs. The app's most-seen animation; worth getting right.
- **List entry** — 28ms stagger, first six items only, then instant. Staggering a 40-item list is a lag, not an animation.
- **Needs-review rail** — pulses opacity twice over 1.2s on first paint of the section, then rests permanently. Attention, once.
- **Skeletons** — a 1.4s shimmer sweep, not pulsing opacity.

### 5.6 Reduced motion — implemented, not merely respected

A single `<MotionConfig reducedMotion="user">` at the root plus a `useReducedMotion()` check in the complete sequence. Under reduced motion:

- All travel becomes opacity-only at 120ms
- Springs become linear
- Stagger is zero
- The rail pulse never runs
- The shimmer becomes a static tint

The app stays fully usable and every state change is still visible.

---

## 6. Navigation

**A five-slot bottom bar. No hamburger, no drawer, no top-level menu anywhere in the app.**

Chase has seven destinations but a bottom bar tolerates five. The resolution: **the five task statuses are not five destinations — they are five filters on one destination.** Nobody thinks "I'll go to Deleted"; they think "let me look at my tasks, and now show me the deleted ones."

| Slot | Route | Holds |
|---|---|---|
| Home | `/` | Dashboard — counts, due soon, needs review, recent activity |
| Tasks | `/tasks/:status` | The list, with a scrollable filter row: Active · Needs review · Completed · Not done · Deleted |
| Create | *(sheet)* | Raised center action. Opens the create sheet over the current screen; never a route change. |
| Insights | `/insights` | Phase 15 analytics. Ships as a styled, locked placeholder until then. |
| Profile | `/profile` | Clerk account, sign out, preferences |

**All six section routes stay real and deep-linkable** — `/tasks/active`, `/tasks/missed`, `/tasks/completed`, `/tasks/incomplete`, `/tasks/deleted`, plus `/`. Only the *presentation* is consolidated behind one tab.

### 6.1 Bar specification

- **Height** 56px + `env(safe-area-inset-bottom)`, clearing the iPhone home indicator.
- **Background** `rgba(13,13,13,.86)` with `backdrop-filter: blur(20px) saturate(140%)`; solid `#0D0D0D` fallback where unsupported.
- **Icons** 22px Lucide, 1.75px stroke. Active `#F2EDEA`, inactive `#898989`.
- **Labels stay.** Instagram can drop them because its five icons are learned; Chase's are not, and a task app is used under time pressure. 10px, weight 500.
- **Active indicator** — indigo `#1F4657` pill behind the icon, animated between tabs with `layoutId`.
- **Create** — a 40px Steel Teal `#517380` rounded square with a `#0D0D0D` plus glyph. Emphasised by color and fill rather than by protruding above the bar, which suits the restrained palette better than a floating circle.
- **Needs-review badge** — an amber dot on the Tasks icon when the count is above zero. A dot, not a number; the number lives on the filter chip.
- **Always visible.** No hide-on-scroll. It disappears only when a sheet or the keyboard is open.

### 6.2 AppBar

Screen title (`title` scale) plus a mono uppercase date/context line beneath. At most one trailing action. **No back chevron on tab roots** — the tab bar is the back affordance.

---

## 7. Components

Built in the order the phases need them. Anything not on this list needs a conversation before it appears in the codebase.

| Component | Phase | Notes |
|---|---|---|
| `Button` | 9 | primary / secondary / ghost / destructive · sm md lg · loading + disabled states · 44px min height |
| `AppBar` | 11 | Title + mono date line + optional single trailing action |
| `BottomNav` | 11 | Five slots, `layoutId` pill, safe-area padding, amber badge |
| `FilterRow` | 11 | Horizontally scrollable pills with counts; scroll-snap; selected pill scrolls into view on mount |
| `TaskCard` | 12 | Priority rail + two-line title + meta row + conditional action row |
| `PriorityRail` / `PriorityLabel` | 12 | Monochrome per §2.5; label always present |
| `StatusChip` | 12 | Five variants, 14% alpha tint background |
| `DeadlineDisplay` | 12 | Relative under 48h ("in 2h", "2d overdue"), absolute beyond. UTC in, local out, mono, tabular. |
| `TaskForm` | 12 | Shared create/edit. Native `datetime-local`; priority as a three-way segmented control. |
| `Sheet` | 12 | Bottom sheet: drag handle, drag-to-dismiss, scrim, focus trap, keyboard-aware |
| `Skeleton` / `EmptyState` / `ErrorState` | 12 | One of each per list and detail view — not optional |
| `ReasonField` | 13 | Textarea; trims before validating; submit disabled while empty; live character count past 120 |
| `ResolveSheet` | 13 | Two equal-weight options, neither pre-selected; reason step only on the "didn't complete" branch |
| `DeleteSheet` | 13 | Reason required; destructive red confirm — the only red button in the app |
| `Toast` | 13 | Bottom, above the nav, 3.2s, `aria-live="polite"`, one at a time |
| `StatTile` / `RecentActivity` | 14 | Mono display numerals, tabular, 2-up grid |
| Chart primitives (`ChartCard`, trend/reason/priority charts, `UnresolvedMissed`) | 15 | See §12. Recharts, fully retokenized — no chart ships a literal hex. |

### 7.1 States are part of the component

Every list and detail view ships **four** states before it is considered done:

- **Loading** — three skeleton cards at real card dimensions. Never a centered spinner.
- **Empty** — see §7.2.
- **Error** — a line of plain explanation plus a Retry button. **Never a raw message from the API.**
- **Loaded**

### 7.2 Empty-state copy

| Section | Copy |
|---|---|
| Active | **"Nothing on deck."** — Add a task to get moving. `[ New task ]` |
| Needs review | **"Nothing to review."** — Tasks land here when a deadline passes before you've confirmed them. |
| Completed | **"No completed tasks yet."** — They'll collect here as you go. |
| Not done | **"Nothing here."** — Tasks you've confirmed weren't done will show up here, with your notes. |
| Deleted | **"Nothing deleted."** — Deleted tasks are kept here with the reason you gave. |
| Error (any list) | **"Couldn't load your tasks."** — Check your connection and try again. `[ Retry ]` |

### 7.3 Lifecycle action affordances

Defense in depth alongside the backend's own enforcement (`CLAUDE.md` §Lifecycle Rules):

| Status | Actions rendered |
|---|---|
| `ACTIVE` | Complete · Edit · Delete |
| `MISSED` | Resolve (two outcomes) — **nothing else** |
| `COMPLETED` / `INCOMPLETE` / `DELETED` | None |

**There is no "mark as missed" control anywhere in the UI.** `MISSED` only ever arises automatically.

Missed, Incomplete, and Deleted tasks display their reasons and timestamps. A task resolved `MISSED → COMPLETED` still shows its missed history alongside its completion. An `INCOMPLETE` task shows **both** the auto-generated `missed_reason` and the user's own `incomplete_reason` — they are distinct records and both are surfaced.

### 7.4 Data visualization (Phase 15)

Charts are read-only analysis over history that's already being kept (`CLAUDE.md`'s "nothing gets deleted" guarantee), so this section is about making that history legible, not about inventing a new visual language. Every rule below extends §2's tokens; nothing here introduces a color, weight, or motion timing that doesn't already exist elsewhere in the app.

**Series palette.** The source palette (§2.1) is a deliberately low-chroma, muted set — that's the whole identity, not an oversight — so it does not behave like a standard vivid categorical chart palette, and a generic multi-hue categorical scheme would fight it rather than extend it. Instead:

- **Status trends stay status-colored.** A completions chart is green (`--color-completed`), a not-done chart is Foggy (`--color-notdone`), a deleted chart is Mid Grey (`--color-deleted`) — the same hues already carrying those meanings on every `StatusChip` in the app. A reader who already knows the chip colors reads the chart for free.
- **Two-path series share one hue, split by treatment, not by a second color.** Completions have two paths — completed on time, or confirmed complete after passing through `MISSED` first — and both are still "completed," so they're encoded as the same green at two opacities (`--color-completed` solid vs. `--color-chart-completed-resolved`, a 55%-mix of the same hue) rather than a second categorical color that would imply a different outcome. Always legended, never color-alone.
- **Priority stays monochrome in charts too.** §2.5's rule ("priority gets no hue") isn't just a task-card rule — the priority breakdown chart reuses `PriorityRail`'s exact rail colors (Star Dust / Foggy / Mid Grey) instead of a chart-only categorical set. Only three categories, so every bar is direct-labeled and needs no legend.
- **Ranked reason bars use one flat hue** — the bar's own status color (Foggy for incomplete reasons, Mid Grey for deleted reasons). Bar length already encodes magnitude (these are ranked lists, not a scale needing a light→dark ramp), so a single hue is enough.
- **Red never appears in a chart.** It stays bound to the destructive action only (§2.4) — deletion volume is shown in receded grey, the same as the resting `DELETED` status everywhere else.
- **Unresolved `MISSED` is amber, and is never a trend line.** Per `CLAUDE.md`, `MISSED` is a pending checkpoint the user hasn't resolved yet, not a terminal outcome — charting it over time would imply it's a verdict. It's surfaced instead as a live count + oldest-first list (`UnresolvedMissed`), same amber as the `MISSED` chip, explicitly not on the same visual axis as the completed/incomplete/deleted trend charts.

These tokens live in `tokens.css`: `--color-chart-grid` (= `--border-hairline`), `--color-chart-axis-label` (= `--color-ink-3`), `--color-chart-completed-resolved` (a `color-mix()` of `--color-completed`, not a new hex). Every other chart color is an existing status/priority token used as-is.

**Axes & grid.** Gridlines are horizontal only (`--color-chart-grid`) — vertical gridlines add clutter without adding information on a narrow mobile chart. Axis lines and tick marks are otherwise hidden; only the labels remain, recessive against the surface. No dual-axis chart anywhere — a second measure gets its own chart, never a second y-scale.

**Labels & numerals.** Split follows §2.2/§3's existing cool-vs-warm, mono-vs-sans rule: axis ticks, counts, and percentages are **Geist Mono** at `micro`-adjacent size (11px) with `tabular-nums`, since they're numbers the app is keeping a record of. Reason-breakdown category labels (the user's own free-typed text) are **Geist Sans** — they're something the user said, not something the app computed. Tooltips reuse `--color-raised` + `--border-hairline`, matching every other floating surface in the app (sheets, popovers).

**Empty & loading states.** Every chart gets its own compact empty state (a bordered `--color-surface` panel with one line of plain copy, e.g. *"No completions yet. They'll show up here as you go."*) rather than hiding the section — consistent with §7.1's "empty is a real state, not an absence." Loading is the same shimmer sweep (§5.5) as every other skeleton, sized to the chart it's standing in for. Never a spinner.

**Reduced motion.** Chart entry has no built-in animation in this phase (Recharts' default mount transitions are disabled) — the data is simply present on first paint. This sidesteps §5.6 entirely rather than needing a reduced-motion branch: nothing here was worth the one signature-moment budget (§5.4) already spent on task completion, and an un-animated chart is fully legible immediately, which matters more for a "read your own history" view than for a moment of delight.

**Mobile layout.** Charts stack vertically, one per section, full-width (`ResponsiveContainer` at `width: 100%`) — never a cramped multi-chart grid. Each chart's `ResponsiveContainer` sits inside its own `overflow-x-auto` wrapper per §9's "no chart causes the page body to scroll horizontally" rule, even though none of Phase 15's charts (8 weekly buckets, or ≤6 ranked reason bars) actually overflow a 360px viewport in practice — the wrapper is defensive, not currently load-bearing.

**Library.** Recharts, chosen over hand-rolled SVG for this phase — see `STATE.md`'s Phase 15 decisions log for the trade-off. Every chart is retokenized in the same commit it's built in, same rule as §10.4 applies to 21st.dev output: nothing ships with Recharts' own default colors.

---

## 8. Accessibility

Treated as acceptance criteria, not polish. A phase is not done if any of these fail.

- **Contrast** — every pair in §2.6, re-verified whenever a color changes.
- **Tap targets** — 44×44 floor, 48×48 in the bottom nav, 8px minimum between adjacent targets.
- **Never color-only** — every status chip has a word, every priority rail has a label. Verify by screenshotting in greyscale.
- **Focus** — 2px `#6C9BAD` ring with a 2px canvas-colored offset, visible on keyboard focus everywhere. Never `outline: none` without a replacement.
- **Sheets** — `role="dialog"`, `aria-modal="true"`, focus trapped inside, Escape and drag both close, focus returns to the trigger.
- **Live regions** — toasts and post-action list changes announce via `aria-live="polite"`: *"Completed. Ship the Q3 pricing memo moved to Completed."*
- **Card semantics** — each card is an `<article>` with an accessible name reading *"Ship the Q3 pricing memo, high priority, due in 2 hours, active."*
- **Labels** — every input has a real `<label>`. Placeholders are examples, never the label.
- **Text scaling** — layout survives 200% OS text size without clipping or overlap. Test before closing each phase.
- **Reduced motion** — per §5.6. Implemented, then verified with the OS setting on.

---

## 9. Mobile production checklist

The difference between a responsive web page and something that feels like an app. Most are one line each; all are noticed when missing.

| Concern | Requirement |
|---|---|
| **Viewport** | `viewport-fit=cover` plus `interactive-widget=resizes-content`, so sheets lift above the keyboard instead of hiding behind it. |
| **Safe areas** | `env(safe-area-inset-*)` on the nav bar, sheets, and toasts. Nothing sits under the notch or home indicator. |
| **Viewport units** | `100dvh`, never `100vh`. On mobile Safari `100vh` exceeds the visible viewport and pushes the nav off-screen. |
| **Theme color** | `<meta name="theme-color" content="#0D0D0D">` so browser chrome matches the ground. |
| **Tap feel** | `-webkit-tap-highlight-color: transparent` with a real 90ms scale-to-0.97 press state instead. `touch-action: manipulation` to kill the 300ms delay. |
| **No accidental zoom** | Inputs at 16px minimum. **Never `user-scalable=no`** — that breaks pinch-zoom for people who need it. |
| **Scroll containment** | `overscroll-behavior-y: contain` on sheets and scrollable lists. |
| **Pull to refresh** | On every task list. Its absence is the first thing that makes a web app feel like a web app. |
| **Optimistic updates** | Complete, delete, and resolve update the UI immediately and roll back with a toast if the server rejects. Biggest perceived-speed win on a slow connection. |
| **Offline** | A dismissible bar above the nav: *"You're offline. Changes will fail until you reconnect."* Actions disable rather than silently failing. |
| **Installable** | Web app manifest with `display: standalone`, maskable icons, `#0D0D0D` background and theme color. |
| **Time** | API is UTC throughout. Client formats to local with `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` — no date library needed for this scope. |

---

## 10. Implementation

### 10.1 Tokens are the only source of color

Every value above lands in one file as CSS custom properties, mapped into Tailwind. **No component ever writes a hex.** That rule is what keeps the system intact across eight phases instead of drifting into forty shades of grey.

Tailwind **v4** with CSS-first `@theme` (not a v3 `tailwind.config.js`) — putting tokens in CSS is what makes the no-hex rule enforceable.

```css
/* client/src/styles/tokens.css */
@theme {
  /* ground */
  --color-canvas:   #0D0D0D;
  --color-surface:  #161616;
  --color-raised:   #1E1E1E;
  --color-overlay:  #262626;

  /* ink */
  --color-ink:      #F2EDEA;
  --color-ink-2:    #A6A6A6;
  --color-ink-3:    #898989;
  --color-ink-disabled: #5C5C5C;

  /* accent */
  --color-accent:       #6C9BAD;
  --color-accent-solid: #60899B;
  --color-accent-press: #517380;
  --color-indigo:       #1F4657;
  --color-foggy:        #B1AF9A;

  /* semantic */
  --color-completed: #4FA97A;
  --color-review:    #E0A64E;
  --color-notdone:   #B1AF9A;
  --color-deleted:   #898989;
  --color-danger:    #D9635E;

  /* borders */
  --border-hairline: rgba(108,155,173,.14);
  --border-strong:   rgba(108,155,173,.26);

  /* motion */
  --ease-out:   cubic-bezier(.22,.61,.36,1);
  --ease-enter: cubic-bezier(.16,1,.3,1);
  --ease-exit:  cubic-bezier(.4,0,1,1);
  --dur-instant: 90ms;
  --dur-fast:    140ms;
  --dur-base:    200ms;
  --dur-slow:    280ms;
  --dur-sheet:   320ms;
}
```

### 10.2 Where things live

```
client/
  DESIGN.md                ← this document
  public/fonts/            Geist Sans + Geist Mono subset woff2
  src/
    styles/
      tokens.css           colors, type, space, motion
      globals.css          reset, safe areas, focus ring
    components/
      ui/                  Button, Sheet, Toast, Skeleton, Chip…
      nav/                 BottomNav, AppBar, FilterRow
      tasks/               TaskCard, TaskForm, ResolveSheet, DeleteSheet…
      dashboard/
    lib/
      apiClient.js
      motion.js            shared variants + reduced-motion helpers
      datetime.js          UTC → local formatting
```

### 10.3 Impeccable

`npx impeccable install` in `client/` installs design skills and an anti-pattern detector that runs against built markup and CSS. It is a **quality gate, not a component library** — it doesn't produce UI, it catches the things that make an interface look generated.

- Run it **before closing every frontend phase**, and treat findings as **blocking acceptance criteria** for that phase rather than a backlog item.
- It needs a `package.json`, so the install belongs **immediately after the Vite scaffold at the start of Phase 9** — not before it.

### 10.4 21st.dev MCP

Used to source component *structure* — sheet mechanics, segmented controls, form patterns — which is where it saves real time.

> **Hard rule: nothing from 21st.dev ships with its own colors, radii, spacing, or type.** Every generated component is retokenized against `tokens.css` in the same commit it arrives in. If a component can't be expressed in these tokens, that's a signal the token set needs extending — which is a decision to raise, not a default to accept.

The 21st.dev MCP server must be connected before Phase 12.

---

## 11. Approved decisions

Settled 2026-08-17. Changing any of these requires a new conversation, not a judgement call mid-phase.

| Decision | Outcome |
|---|---|
| Theme | **Dark only in v1.** Tokens structured for a later light swap. |
| Typeface | **Geist Sans + Geist Mono**, self-hosted subset woff2. |
| Navigation | **Five statuses behind one Tasks tab** with a filter row; all six routes remain real and deep-linkable. |
| Tailwind | **v4 with CSS-first `@theme`**, superseding the original v3-shaped `tailwind.config.js` wording (since corrected in `prompts/phase-09.md`). |
| MISSED copy | **Chip reads "Needs review."** Section keeps the name Missed. |
| Red | **Bound to the destructive action only** — never to the `DELETED` status. |
| Priority | **Monochrome rail + label** — no hue of its own. |
