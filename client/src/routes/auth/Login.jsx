import { SignIn, useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthBackdrop } from '../../components/auth/AuthBackdrop';
import { clerkAppearance } from '../../lib/clerkAppearance';

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (isLoaded && isSignedIn) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  return (
    <AuthBackdrop>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl={location.state?.from ?? '/'}
        appearance={clerkAppearance}
      />
    </AuthBackdrop>
  );
}
