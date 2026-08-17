import { Routes, Route } from 'react-router-dom';
import Root from './Root';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Profile from './Profile';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Public: "/" (Landing for signed-out, Home for signed-in — see Root.jsx),
// "/login/*", "/signup/*" (wildcard: Clerk's path-routed SignIn/SignUp own
// their own sub-steps, e.g. /login/factor-one).
// Protected: everything behind ProtectedRoute redirects to /login.
// /tasks/:status, /insights land when Phase 11+ builds the screens they render.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
