import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  isPushSupported,
  getPushPermissionState,
} from '../../lib/pushClient';
import { useToast } from '../../lib/toastStore';

// Profile's durable notifications control (PHASE_18.md §5) -- paired with
// the one-time Home banner (NotificationsBanner). Reproduces Profile.jsx's
// own SettingsRow markup (not exported from there) rather than introducing
// a new row shape into the settings list.
export function NotificationsSettingsRow() {
  const { showToast } = useToast();
  const [state, setState] = useState('checking'); // checking | on | off | unsupported | denied
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!isPushSupported()) {
        if (!cancelled) setState('unsupported');
        return;
      }
      if (getPushPermissionState() === 'denied') {
        if (!cancelled) setState('denied');
        return;
      }
      const subscribed = await isSubscribed();
      if (!cancelled) setState(subscribed ? 'on' : 'off');
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    if (state !== 'on' && state !== 'off') return;
    setBusy(true);
    try {
      if (state === 'on') {
        await unsubscribeFromPush();
        setState('off');
        showToast('Notifications off');
      } else {
        await subscribeToPush();
        setState('on');
        showToast('Notifications on');
      }
    } catch {
      showToast('Could not update notifications');
    } finally {
      setBusy(false);
    }
  }

  const valueText = {
    checking: '…',
    on: 'On',
    off: 'Off',
    unsupported: 'Not supported',
    denied: 'Blocked',
  }[state];

  const disabled = state === 'checking' || state === 'unsupported' || state === 'denied' || busy;

  const content = (
    <span className="flex min-h-(--size-tap-min) w-full items-center gap-3 px-4 py-3 text-left">
      <Bell size={18} strokeWidth={1.8} aria-hidden="true" style={{ color: 'var(--color-ink-3)' }} />
      <span className="flex-1 text-body text-ink">Notifications</span>
      <span
        className="text-meta"
        style={{ color: disabled && state !== 'checking' ? 'var(--color-ink-disabled)' : 'var(--color-ink-3)' }}
      >
        {valueText}
      </span>
    </span>
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className="block opacity-60">
        {content}
      </span>
    );
  }

  return (
    <button type="button" onClick={toggle} className="block w-full transition-colors hover:bg-surface-sunken">
      {content}
    </button>
  );
}
