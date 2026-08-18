import { useState } from 'react';
import { X } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

// DESIGN.md §9 "Offline" — a dismissible bar above the nav, verbatim copy.
// Real gap found during the Phase 16 mobile-checklist audit: no prior phase
// had ever wired up an online/offline signal at all. Dismissible per the
// checklist's own wording; reappears automatically if the connection drops
// again later, since dismissal only clears local state for the current
// offline stretch (re-armed once `online` flips true).
export function OfflineBar() {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (online) {
    if (dismissed) setDismissed(false);
    return null;
  }
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 z-40 flex items-center justify-between gap-3 px-gutter py-2 text-meta"
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
        backgroundColor: 'color-mix(in srgb, var(--color-review) 16%, var(--color-surface))',
        color: 'var(--color-review)',
        borderTop: '1px solid color-mix(in srgb, var(--color-review) 30%, transparent)',
      }}
    >
      <span>You're offline. Changes will fail until you reconnect.</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-(--radius-sm)"
      >
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
