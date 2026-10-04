import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'flat';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'elevated',
      interactive = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'rounded-2xl transition-all duration-200 overflow-hidden bg-white';

    const variantClasses = {
      elevated:
        'border border-slate-200/80 shadow-sm hover:shadow-md',
      outlined:
        'border border-slate-300 shadow-none',
      flat:
        'border border-transparent bg-slate-50',
    };

    const interactiveClasses = interactive
      ? 'cursor-pointer hover:border-amber-400/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-500/50'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
