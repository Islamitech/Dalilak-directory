import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Strictly required for WCAG accessibility
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'secondary',
      size = 'md',
      icon,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-full transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95';

    // All sizes enforce WCAG minimum touch target of 44x44px
    const sizeClasses = {
      sm: 'w-11 h-11 min-w-[44px] min-h-[44px] text-sm',
      md: 'w-11 h-11 min-w-[44px] min-h-[44px] text-base',
      lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-lg',
    };

    const variantClasses = {
      primary:
        'bg-amber-500 hover:bg-amber-600 text-white shadow-sm border border-amber-400/30',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
      success:
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
