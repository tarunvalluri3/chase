# Chase — Mobile UI Spec (Sizing, Spacing, Icons, Buttons)

Extracted from `src/styles/tokens.css` (DESIGN.md v3 "Dark Navy") and actual component usage. **Colors intentionally excluded** — this covers only typography sizes, icon sizes, button sizes, gaps, padding, radii, and tap targets, as used on mobile/small-device viewports.

---

## 1. Typography Scale

All font sizes are defined as design tokens (`--text-*`) in `tokens.css` and consumed via Tailwind utilities (`text-display`, `text-title`, etc.). Font family: **Inter Variable** (self-hosted).

| Token | Font size | Line height | Letter spacing | Weight | Used for |
|---|---|---|---|---|---|
| `text-display` | 2.5rem (40px) | 2.75rem (44px) | 0em | 600 | Large KPI numbers |
| `text-title` | 2rem (32px) | 2.375rem (38px) | 0em | 600 | Screen title (AppBar `<h1>`) |
| `text-section` | 1.25rem (20px) | 1.75rem (28px) | 0em | 600 | Section headers ("Due soon", Sidebar brand label) |
| `text-task` | 1.0625rem (17px) | 1.5rem (24px) | 0em | 600 | Card / task title (`TaskCard <h3>`), Button `lg` label |
| `text-body` | 1rem (16px) | 1.5rem (24px) | 0em | 400 | Body copy, Button `md` label |
| `text-meta` | 0.875rem (14px) | 1.25rem (20px) | 0em | 400 | Secondary text, nav tab labels, Button `sm` label |
| `text-micro` | 0.75rem (12px) | 1rem (16px) | 0.06em | 600 | Labels, badges, section-labels (uppercase-mono feel) |
| `text-stat` | 1.5rem (24px) | 1.75rem (28px) | 0em | 700 | Home stat-row numerals (StatTile count) |

---

## 2. Icon Sizes

Two systems: **display/glyph size** (the icon itself) and **tap-target floor** (min hit area, see §5). Never conflate the two.

| Token / literal | Size | Where used |
|---|---|---|
| `--size-icon-sm` | 1rem (16px) | Inline icons, chevrons |
| `--size-icon-md` | 1.25rem (20px) | Nav icons (generic token) |
| Literal `size={13}` | 13px | Checkmark inside TaskCard's completed circle |
| Literal `size={18}` | 18px | StatTile icon (inside 32px badge bubble), `strokeWidth={1.8}` |
| Literal `size={24}` | 24px | Bottom nav tab icons (`strokeWidth={1.8}`), Create-task FAB plus icon (`strokeWidth={2}`) |
| Sidebar brand mark | 1.5rem (24px, `h-6 w-6`) | Sidebar logo |
| Back-button chevron area | 44px hit area (`h-11 w-11`), icon itself unscaled | AppBar back button |

**Icon badge/bubble sizes** (colored circle container behind an icon, not the icon itself):

| Token | Size | Used for |
|---|---|---|
| `--size-badge-sm` | 2rem (32px) | Stat-row icon circles (StatTile) |
| `--size-badge-md` | 2.5rem (40px) | Due-soon / activity row icon circles |

---

## 3. Button Sizes

`Button` component (`src/components/ui/Button.jsx`) — three sizes, all with a shared `min-h-(--size-tap-min)` (44px) floor regardless of visual height:

| Size | Height | Horizontal padding | Text size |
|---|---|---|---|
| `sm` | 2.25rem (36px, `h-9`) | 0.75rem (12px, `px-3`) | `text-meta` (14px) |
| `md` (default) | 2.75rem (44px, `h-11`) | 1rem (16px, `px-4`) | `text-body` (16px) |
| `lg` | 3.25rem (52px) — primary-CTA height spec | 1.5rem (24px, `px-6`) | `text-task` (17px) |

- Border radius: `--radius-md` (12px) on all button sizes.
- Internal gap between icon/spinner and label: `gap-2` (8px).
- Loading spinner: 16px (`h-4 w-4`), 2px border.
- Variants (shape/border only, no color detail here): `primary` (solid fill), `secondary` (bordered), `ghost` (borderless), `destructive` (bordered outline).

**Other interactive circular buttons (not the shared Button component):**

| Element | Size |
|---|---|
| Create-task FAB (BottomNav) | 3.5rem (56px, `h-14 w-14`), pill radius |
| AppBar back button | 2.75rem (44px, `h-11 w-11`) |
| FilterRow icon toggle | 2.25rem (36px, `h-9 w-9`) |
| TaskCard checkbox circle | 1.25rem (20px, `h-5 w-5`), 2px border |

---

## 4. Spacing Scale (8px base grid)

Defined as `--spacing-*` tokens, consumed as Tailwind spacing utilities.

| Token | Value |
|---|---|
| `spacing-1` | 0.25rem (4px) |
| `spacing-2` | 0.5rem (8px) |
| `spacing-3` | 0.75rem (12px) |
| `spacing-4` | 1rem (16px) |
| `spacing-5` | 1.25rem (20px) |
| `spacing-6` | 1.5rem (24px) |
| `spacing-7` | 2rem (32px) |
| `spacing-8` | 2.5rem (40px) |
| `spacing-9` | 3rem (48px) |
| `spacing-10` | 4rem (64px) |

**Named spacing tokens:**

| Token | Value | Purpose |
|---|---|---|
| `--spacing-gutter` | 1.5rem (24px) | Screen horizontal padding (`px-gutter`) |
| `--spacing-stack-gap` | 0.75rem (12px) | Gap between stacked cards in a list |

**Observed gaps/padding in components:**

| Location | Value |
|---|---|
| TaskCard outer padding | `p-5` (20px) |
| TaskCard internal flex gap (icon ↔ content) | `gap-3` (12px) |
| TaskCard content column gap | `gap-2` (8px) |
| TaskCard action-row gap (Complete/Delete buttons) | `gap-2` (8px), `pt-1` (4px) top offset |
| AppBar header padding | `px-gutter` (24px), `pt-6` (24px), `pb-4` (16px) |
| AppBar title/back-button gap | `gap-3` (12px) outer, `gap-1` (4px) inner |
| LedgerStrip (stat row container) padding | `px-3 py-4` (12px / 16px) |
| LedgerStrip inter-cell gap | `gap-3` (12px) |
| StatTile internal gap (icon → number → label) | `gap-2` (8px) |
| BottomNav row padding | `px-4 pb-3` (16px / 12px), pill bar `px-1.5` (6px) |
| BottomNav pill-to-FAB gap | `gap-2.5` (10px) |
| BottomNav tabs internal gap | `gap-1` (4px) |
| Sidebar logo row | `mb-6` (24px), `gap-2` (8px), `px-2 pt-2` |

---

## 5. Tap Targets

| Token | Value | Purpose |
|---|---|---|
| `--size-tap-min` | 2.75rem (44px) | Absolute floor for any tappable element (WCAG-style minimum) |
| `--size-tap-nav` | 3rem (48px) | Minimum height specifically for bottom-nav tab items |

---

## 6. Border Radius (shape scale)

| Token | Value | Typical use |
|---|---|---|
| `--radius-sm` | 0.5rem (8px) | Small controls (back button, filter toggle) |
| `--radius-md` | 0.75rem (12px) | Buttons, nav-tab active chip, nav-tab hit area |
| `--radius-lg` | 1rem (16px) | Cards (TaskCard, LedgerStrip) |
| `--radius-xl` | 1.25rem (20px) | Bottom-nav pill bar |
| `--radius-xxl` | 1.5rem (24px) | Larger panels/sheets |
| `--radius-pill` | 999px | Fully round (FAB, checkbox circle, badge dot, icon bubbles) |

---

## 7. Elevation (shadows — shape/spread only, not color)

| Token | Blur/spread profile |
|---|---|
| `--shadow-card` | `0 1px 2px` + `0 4px 10px` |
| `--shadow-card-hover` | `0 2px 4px` + `0 8px 20px` |
| `--shadow-panel` | `0 1px 2px` + `0 6px 16px` |
| `--shadow-nav-pill` | `0 4px 16px` |
| `--shadow-fab` | `0 6px 18px` |
| `--shadow-sheet` | `0 -12px 40px` |
| `--shadow-toast` | `0 6px 24px` |

---

## 8. Motion (durations/easing, included for completeness)

| Token | Value |
|---|---|
| `--dur-instant` | 90ms |
| `--dur-fast` | 150ms |
| `--dur-base` | 200ms |
| `--dur-slow` | 260ms |
| `--dur-sheet` | 280ms |

Easing curves: `--ease-out`, `--ease-enter`, `--ease-exit` (cubic-bezier, see `tokens.css`).

---

*Source files: `src/styles/tokens.css`, `src/components/ui/Button.jsx`, `src/components/nav/AppBar.jsx`, `src/components/nav/BottomNav.jsx`, `src/components/nav/FilterRow.jsx`, `src/components/nav/Sidebar.jsx`, `src/components/tasks/TaskCard.jsx`, `src/components/dashboard/StatTile.jsx`.*
