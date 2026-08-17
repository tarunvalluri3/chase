import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { pressVariants } from '../../lib/motion';

const MotionLink = motion.create(Link);

const VARIANT_CLASSES = {
  primary: 'bg-accent-solid text-canvas hover:bg-accent-press',
  secondary: 'bg-raised text-ink border border-(--border-strong) hover:bg-overlay',
  ghost: 'bg-transparent text-ink hover:bg-overlay',
  destructive: 'bg-danger text-canvas hover:brightness-95',
};

const SIZE_CLASSES = {
  sm: 'h-9 px-3 text-meta',
  md: 'h-11 px-4 text-body',
  lg: 'h-12 px-5 text-task',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    className = '',
    type = 'button',
    to,
    ...props
  },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const sharedClassName = [
    'inline-flex min-h-(--size-tap-min) items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ].join(' ');
  const sharedStyle = {
    transitionDuration: 'var(--dur-fast)',
    transitionTimingFunction: 'var(--ease-out)',
  };

  if (to) {
    return (
      <MotionLink
        ref={ref}
        to={to}
        className={sharedClassName}
        style={sharedStyle}
        {...pressVariants(reducedMotion)}
        {...props}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={sharedClassName}
      style={sharedStyle}
      {...pressVariants(reducedMotion)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </motion.button>
  );
});
