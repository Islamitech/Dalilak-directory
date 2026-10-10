import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Strictly required for WCAG accessibility
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon: React.ReactNode;
}

const BASE =
  'inline-flex items-center justify-center rounded-pill border transition-colors duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95';

// All sizes enforce the WCAG minimum touch target of 44x44px.
const SIZES = {
  sm: 'w-11 h-11 min-w-[44px] min-h-[44px] text-sm',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-base',
  lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-lg',
};

const VARIANTS = {
  primary: 'bg-[var(--brand)] border-[var(--brand-strong)] text-[var(--logo-ink-core)] hover:bg-[var(--brand-strong)] hover:border-[var(--brand-deep)]',
  secondary: 'bg-[var(--logo-silver-1)] border-[var(--logo-silver-2)] text-[var(--logo-ink-0)] hover:bg-[var(--logo-silver-0)] hover:border-[var(--logo-silver-3)]',
  ghost: 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 'aria-label': ariaLabel, variant = 'secondary', size = 'md', icon, className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
);

IconButton.displayName = 'IconButton';
