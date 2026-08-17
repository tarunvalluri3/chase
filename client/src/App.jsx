import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { MotionConfig } from 'framer-motion';
import { AppRoutes } from './routes';
import { CLERK_PUBLISHABLE_KEY } from './lib/clerk';
import { setAuthTokenGetter } from './lib/apiClient';
import { TasksProvider } from './lib/tasksStore';
import { ToastProvider } from './lib/toastStore';

// Bridges Clerk's session token into the plain-fetch API client, which can't
// call the useAuth() hook itself.
function ApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ApiAuthBridge />
      <ToastProvider>
        <TasksProvider>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </MotionConfig>
        </TasksProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
