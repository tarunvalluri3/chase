import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these — Framer Motion (useReducedMotion) and
// Recharts (ResponsiveContainer) both touch them at render time.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Recharts' ResponsiveContainer measures its parent via getBoundingClientRect
// and renders nothing until it sees a non-zero size — jsdom always reports
// 0x0, so stub a real size for any element under test.
if (!Element.prototype.__chaseGetBoundingClientRectPatched) {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      width: 390,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 390,
      x: 0,
      y: 0,
      toJSON() {},
    };
  };
  Element.prototype.__chaseGetBoundingClientRectPatched = true;
}
