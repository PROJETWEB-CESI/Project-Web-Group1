'use client';

import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { 
    label, 
    error, 
    id, 
    type = 'text', 
    className = '', 
    ...props 
  }, 
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-[var(--color-text)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-lg border px-4 py-2.5 text-base transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-muted)]
          ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-border)]'}
          ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="error-message mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
