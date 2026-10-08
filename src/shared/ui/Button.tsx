import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'start',
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const sizeClasses = {
      sm: 'text-xs min-h-[44px] px-3.5 py-2 rounded-xl gap-1.5',
      md: 'text-sm min-h-[44px] px-5 py-2.5 rounded-2xl gap-2',
      lg: 'text-base min-h-[48px] px-6 py-3 rounded-2xl gap-2.5',
    };

    const variantClasses = {
      primary:
        'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
      ghost:
        'bg-transparent hover:bg-slate-100/80 text-slate-700 border border-transparent',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/30',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 border border-rose-500/30',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {!isLoading && icon && iconPosition === 'start' && (
          <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && icon && iconPosition === 'end' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
