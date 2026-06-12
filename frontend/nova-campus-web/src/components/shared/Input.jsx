'use client';

import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

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
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full rounded-lg border px-4 py-2.5 text-base transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-muted)]
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-[var(--color-border)]'}
            ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="error-message mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
