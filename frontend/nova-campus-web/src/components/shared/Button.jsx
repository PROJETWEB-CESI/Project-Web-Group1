'use client';

import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  { 
    children, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    loading = false, 
    className = '', 
    type = 'button',
    ...props 
  }, 
  ref
) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.985]';

  const variants = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] focus-visible:ring-[var(--color-primary)]',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/40 focus-visible:ring-[var(--color-primary)]',
    ghost: 'text-[var(--color-primary)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-primary)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-on-primary)] border-t-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
