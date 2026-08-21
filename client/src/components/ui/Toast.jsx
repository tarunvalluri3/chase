import { useToast } from '../../lib/toastStore';

// DESIGN.md §7 — bottom, above the nav, aria-live="polite", one at a time.
// Sits above BottomNav's 56px + safe-area bar with a small gap.
export function ToastViewport() {
  const { toast } = useToast();

  return (
    <div aria-live="polite" role="status">
      {toast && <div key={toast.id}>{toast.message}</div>}
    </div>
  );
}
