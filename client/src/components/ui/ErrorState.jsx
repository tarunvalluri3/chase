import { Button } from './Button';

// DESIGN.md §7.1/§7.2 — plain explanation + Retry, never a raw API message.
export function ErrorState({
  title = "Couldn't load your tasks.",
  description = 'Check your connection and try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-gutter pt-16 text-center">
      <p className="font-serif text-section text-ink">{title}</p>
      <p className="max-w-xs text-body text-ink-2">{description}</p>
      <Button size="sm" variant="secondary" onClick={onRetry} className="mt-1">
        Retry
      </Button>
    </div>
  );
}
