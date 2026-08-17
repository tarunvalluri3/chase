import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { MotionConfig } from 'framer-motion';
import { AppRoutes } from './routes';
import { CLERK_PUBLISHABLE_KEY } from './lib/clerk';
import { setAuthTokenGetter } from './lib/apiClient';

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
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MotionConfig>
    </ClerkProvider>
  );
}
