import { Routes, Route } from 'react-router-dom';
import Home from './Home';

// Route definitions only — real screens land in Phase 11+ (§6 nav table).
// /tasks/:status, /insights, /profile are added when those phases build the
// screens they render; this phase proves routing works end to end.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
