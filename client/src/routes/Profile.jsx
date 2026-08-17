import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

// Real route per DESIGN.md §6 nav table (Profile → /profile), rendered
// inside AppLayout (Phase 11) — the title comes from the AppBar, this only
// needs account info and a working sign-out.
export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = () => signOut(() => navigate('/', { replace: true }));

  return (
    <div className="flex flex-col gap-6 px-gutter">
      <p className="text-body text-ink-2">{user?.primaryEmailAddress?.emailAddress ?? 'Your account'}</p>

      <Button variant="secondary" onClick={handleSignOut} className="w-full">
        Sign out
      </Button>
    </div>
  );
}
