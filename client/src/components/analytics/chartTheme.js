// Shared recharts styling — DESIGN.md §12. Grid/axis stay recessive
// (hairline + ink-3); numeral/count labels use the app's one typeface
// (Inter) with tabular-nums for alignment — no separate mono face. Every
// value here is a token reference, never a literal hex.
export const CHART_GRID_COLOR = 'var(--color-chart-grid)';
export const CHART_AXIS_COLOR = 'var(--color-chart-axis-label)';

export const axisTickStyle = {
  fontFamily: 'var(--font-sans)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 11,
  fill: CHART_AXIS_COLOR,
};

export const tooltipContentStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  color: 'var(--color-ink)',
  padding: '8px 10px',
};

export const tooltipLabelStyle = {
  color: 'var(--color-ink-3)',
  marginBottom: 4,
};

export const legendTextStyle = {
  fontFamily: 'var(--font-sans)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 11,
  color: 'var(--color-ink-2)',
  paddingTop: 8,
};
