import { Link } from 'react-router-dom';

// Japanese Indigo ambient wash — DESIGN.md §2.2, one of the two places indigo
// is a surface treatment rather than a selected state (the other is the
// active nav pill). Shared shell for /login and /signup.
export function AuthBackdrop({ children }) {
  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-gutter py-10"
      style={{
        backgroundColor: 'var(--color-canvas)',
        backgroundImage:
          'radial-gradient(120% 70% at 50% -10%, var(--color-indigo) 0%, transparent 60%)',
      }}
    >
      <Link
        to="/"
        aria-label="Chase home"
        className="mb-8 inline-flex items-center gap-2 rounded-(--radius-sm)"
      >
        <img src="/brand/chase-mark-on-dark.svg" alt="" className="h-8 w-8" />
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
