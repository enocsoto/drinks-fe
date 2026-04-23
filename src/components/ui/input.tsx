import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const NATIVE_PICKER_TYPES = new Set(['date', 'datetime-local', 'time']);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const isNativeDateLike = type != null && NATIVE_PICKER_TYPES.has(String(type));
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] ring-offset-[var(--bg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        /* `display:flex` en type=date rompe el cromo nativo (WebKit/Chrome) */
        isNativeDateLike
          ? 'input-native-date block pr-2'
          : 'flex file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';
