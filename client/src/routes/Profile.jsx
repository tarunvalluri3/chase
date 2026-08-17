import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

// Real route per DESIGN.md §6 nav table (Profile → /profile). Full account/
// preferences UI lands with the nav shell in Phase 11 — this phase only
// needs a genuine protected destination and a working sign-out.
export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = () => signOut(() => navigate('/', { replace: true }));

  return (
    <main className="flex min-h-dvh flex-col gap-6 px-gutter pt-10">
      <div>
        <p className="text-meta text-ink-3">Profile</p>
        <h1 className="mt-1 text-title text-ink">{user?.primaryEmailAddress?.emailAddress ?? 'Your account'}</h1>
      </div>

      <Button variant="secondary" onClick={handleSignOut} className="w-full">
        Sign out
      </Button>
    </main>
  );
}
