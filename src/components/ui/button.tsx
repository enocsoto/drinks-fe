import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--brand-primary)] text-[var(--text-on-brand)] hover:bg-[var(--brand-primary-h)] shadow-sm':
              variant === 'primary',
            'bg-[var(--sidebar-bg)] text-[var(--text-on-brand)] hover:bg-opacity-90': variant === 'secondary',
            'border border-[var(--border)] bg-transparent hover:bg-[var(--bg-surface)] text-[var(--text-primary)]':
              variant === 'outline',
            'bg-transparent hover:bg-[var(--bg-surface)] text-[var(--text-primary)]': variant === 'ghost',
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8 text-lg': size === 'lg',
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
