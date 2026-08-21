import { Button } from './Button';

// DESIGN.md §7.1/§7.2 — plain explanation + Retry, never a raw API message.
export function ErrorState({
  title = "Couldn't load your tasks.",
  description = 'Check your connection and try again.',
  onRetry,
}) {
  return (
    <div>
      <p>{title}</p>
      <p>{description}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
