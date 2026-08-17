# Chase brand mark

Source: Claude Design project "Chase Logo Design Brief" (`2815f836-e30f-4866-9dd8-7b9b2df141e5`), file `Chase Logo Final.dc.html`, re-imported via the `claude_design` MCP after the original assets were lost during Phase 9's `create-vite --overwrite` scaffolding.

A `-9°` leaning hourglass, Star Dust top / Steel Teal bottom bulb. Every color is verbatim from `client/DESIGN.md`: `#F2EDEA`/`#6C9BAD` on dark, `#1A1A1A`/`#517380` on light, `#0D0D0D` favicon badge.

## Files

- `chase-mark-on-dark.svg` / `chase-mark-on-light.svg` — standalone icon, no wordmark.
- `chase-lockup-on-dark.svg` / `chase-lockup-on-light.svg` — mark + "Chase" wordmark.
- `../favicon.svg` (one level up, served from the site root) — mark on a `#0D0D0D` rounded badge, scaled to the same ~72%-of-badge proportion the source brief's 64/40/28/20/16px legibility check used.

`-on-dark` / `-on-light` names the **background** the asset is meant to sit on, not the artwork's own palette.

## Known caveats

- The lockup's "Chase" wordmark is live `<text>` (Geist Sans 600), not outlined paths — it renders correctly wherever Geist Sans is loaded (the app self-hosts it per `DESIGN.md` §3), but will fall back to the system sans-serif in a font-uncontrolled context (e.g. pasted into a doc). Export a PNG if you need it to render correctly with no font control.
- Raster fallbacks (`favicon.ico`, `apple-touch-icon.png`, maskable PWA icons) haven't been generated yet.
