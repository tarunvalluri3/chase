import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { subscribeToPush, isPushSupported, getPushPermissionState } from '../../lib/pushClient';
import { useToast } from '../../lib/toastStore';

const DISMISSED_KEY = 'chase.notificationsBannerDismissed';

// PHASE_18.md §5 -- the one-time proactive nudge, paired with the durable
// Profile toggle (NotificationsSettingsRow). Shown once on Home after first
// sign-in; "shown before" is tracked in localStorage (a device-local
// concern, not a DB field) so it never nags twice on the same device, and
// never shown at all if push is unsupported or the user already
// granted/denied the OS permission some other way (e.g. via the Profile
// toggle).
export function NotificationsBanner() {
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(() => {
    if (!isPushSupported()) return true;
    if (getPushPermissionState() !== 'default') return true;
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });
  const [enabling, setEnabling] = useState(false);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  async function handleEnable() {
    setEnabling(true);
    try {
      await subscribeToPush();
      showToast('Notifications on');
    } catch {
      showToast('Could not enable notifications');
    } finally {
      setEnabling(false);
      dismiss();
    }
  }

  if (dismissed) {
    return null;
  }

  return (
    <div>
      <div>
        <p>Get notified even when Chase is closed</p>
        <p>
          Enable notifications to hear about deadlines and task updates in real time.
        </p>
        <div>
          <Button size="sm" onClick={handleEnable} loading={enabling}>
            Enable
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} disabled={enabling}>
            Not now
          </Button>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
