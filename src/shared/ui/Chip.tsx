import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  count?: React.ReactNode;
  trailing?: React.ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 rounded-pill border text-label font-bold whitespace-nowrap select-none cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-55 disabled:cursor-not-allowed';

const IDLE = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300';
const ACTIVE = 'bg-[var(--brand-soft)] border-[var(--brand-strong)] text-[var(--brand-ink)] font-extrabold';

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ children, active = false, icon, count, trailing, className = '', type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={`${BASE} ${active ? ACTIVE : IDLE} ${className}`} {...props}>
      {icon && (
        <span className="shrink-0 inline-flex [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="min-w-0 truncate">{children}</span>
      {count !== undefined && (
        <span className={`text-caption font-extrabold ${active ? 'text-[var(--brand-ink)]' : 'text-slate-500'}`}>
          {count}
        </span>
      )}
      {trailing && <span className="shrink-0 inline-flex">{trailing}</span>}
    </button>
  )
);

Chip.displayName = 'Chip';
