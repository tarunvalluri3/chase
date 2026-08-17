import { Routes, Route } from 'react-router-dom';
import Root from './Root';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Profile from './Profile';
import Insights from './Insights';
import Active from './tasks/Active';
import Missed from './tasks/Missed';
import Completed from './tasks/Completed';
import Incomplete from './tasks/Incomplete';
import Deleted from './tasks/Deleted';
import TaskDetailPage from './tasks/TaskDetailPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';

// Public: "/" (Landing for signed-out, Home for signed-in — see Root.jsx),
// "/login/*", "/signup/*" (wildcard: Clerk's path-routed SignIn/SignUp own
// their own sub-steps, e.g. /login/factor-one).
// Protected: everything behind ProtectedRoute redirects to /login, and
// shares the AppLayout shell (AppBar + BottomNav) added in Phase 11.
// DESIGN.md §6: five statuses live behind one Tasks tab as /tasks/:status,
// but all five stay real, deep-linkable routes.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/tasks/active" element={<Active />} />
          <Route path="/tasks/missed" element={<Missed />} />
          <Route path="/tasks/completed" element={<Completed />} />
          <Route path="/tasks/incomplete" element={<Incomplete />} />
          <Route path="/tasks/deleted" element={<Deleted />} />
          <Route path="/tasks/:status/:id" element={<TaskDetailPage />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}
