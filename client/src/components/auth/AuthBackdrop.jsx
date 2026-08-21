import { Link } from 'react-router-dom';

// Pine ambient wash — DESIGN.md §2.2, a soft brand tint rather than a
// selected state. Shared shell for /login and /signup.
export function AuthBackdrop({ children }) {
  return (
    <main>
      <Link to="/" aria-label="Chase home">
        <img src="/brand/chase-mark-on-dark.svg" alt="" />
      </Link>

      <div>{children}</div>
    </main>
  );
}
