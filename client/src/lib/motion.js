// Shared Framer Motion variants + reduced-motion helpers — DESIGN.md §5.

export const EASE_OUT = [0.22, 0.61, 0.36, 1];
export const EASE_ENTER = [0.16, 1, 0.3, 1];
export const EASE_EXIT = [0.4, 0, 1, 1];

export const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 };

export const DURATION = {
  instant: 0.09,
  fast: 0.14,
  base: 0.2,
  slow: 0.28,
  sheet: 0.32,
};

// Route cross-fade + 8px Y — never a horizontal slide (§5.5).
export function routeVariants(reducedMotion) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.12 } },
      exit: { opacity: 0, transition: { duration: 0.12 } },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_ENTER } },
    exit: { opacity: 0, y: 8, transition: { duration: DURATION.base, ease: EASE_EXIT } },
  };
}

// List entry — 28ms stagger, first six items only, then instant (§5.5).
export function listContainerVariants(reducedMotion) {
  return {
    animate: {
      transition: reducedMotion ? {} : { staggerChildren: 0.028, delayChildren: 0 },
    },
  };
}

export function listItemVariants(reducedMotion, index) {
  const staggered = !reducedMotion && index < 6;
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.12 } },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: staggered
        ? { duration: DURATION.base, ease: EASE_ENTER }
        : { duration: 0, delay: 0 },
    },
  };
}

// Press feedback — 90ms scale-to-0.97 (§9 "tap feel").
export function pressVariants(reducedMotion) {
  if (reducedMotion) return {};
  return {
    whileTap: { scale: 0.97, transition: { duration: DURATION.instant, ease: EASE_OUT } },
  };
}
