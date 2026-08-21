import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Frontend test runner (Phase 16) — mirrors the backend's Vitest setup
// (server/vitest.config.js) for consistency. jsdom environment + React
// Testing Library, one global setup file that installs jest-dom matchers
// and the browser API shims components rely on (matchMedia, ResizeObserver,
// IntersectionObserver) that jsdom doesn't implement.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: false,
    restoreMocks: true,
  },
});
