import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

// DESIGN.md v3 §7 — destructive is a Clay outline that fills Clay-tint on
// hover, never a solid red fill: red stays reserved and quiet even on its
// own action.
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    type = 'button',
    to,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  if (to) {
    return (
      <Link ref={ref} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} disabled={isDisabled} aria-busy={loading || undefined} {...props}>
      {loading && <span aria-hidden="true" />}
      {children}
    </button>
  );
});
