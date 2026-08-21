import { SignUp, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { AuthBackdrop } from '../../components/auth/AuthBackdrop';

export default function Signup() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthBackdrop>
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </AuthBackdrop>
  );
}
