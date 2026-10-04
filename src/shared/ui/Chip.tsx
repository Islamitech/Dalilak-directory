import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'default' | 'gold' | 'success' | 'warning';
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      children,
      active = false,
      variant = 'default',
      icon,
      onClear,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-full text-xs font-bold transition-all duration-200 select-none cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';

    const getVariantClasses = () => {
      if (active) {
        return 'bg-amber-500 text-white border-amber-600 shadow-xs';
      }
      switch (variant) {
        case 'gold':
          return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
        case 'success':
          return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
        case 'warning':
          return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
        case 'default':
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80';
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseClasses} ${getVariantClasses()} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {onClear && (
          <span
            role="button"
            tabIndex={0}
            aria-label="إزالة التصفية"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onClear();
              }
            }}
            className="ms-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
          >
            ✕
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';
