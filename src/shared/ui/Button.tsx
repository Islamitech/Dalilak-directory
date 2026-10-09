import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

interface ButtonContentProps {
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  loading?: boolean;
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions & ButtonContentProps;
export type ButtonLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleOptions & ButtonContentProps;

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-pill border font-bold whitespace-nowrap select-none cursor-pointer no-underline transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100 aria-disabled:opacity-55 aria-disabled:pointer-events-none';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-label',
  md: 'min-h-[42px] px-4 text-label',
  lg: 'min-h-12 px-5 text-body',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand)] border-[var(--brand)] text-white hover:bg-[var(--brand-hover)] hover:border-[var(--brand-hover)]',
  secondary:
    'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900',
  ghost: 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:border-rose-700',
  icon: 'w-11 h-11 min-h-11 p-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
};

export function buttonClassName({ variant = 'primary', size = 'md', fullWidth = false }: ButtonStyleOptions = {}): string {
  const sizeClass = variant === 'icon' ? '' : SIZES[size];
  return `${BASE} ${sizeClass} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''}`.trim();
}

const ButtonContent: React.FC<ButtonContentProps & { children?: React.ReactNode }> = ({
  leadingIcon,
  trailing,
  loading,
  children,
}) => (
  <>
    {loading ? (
      <span
        className="w-4 h-4 border-2 border-current border-t-transparent rounded-pill animate-spin shrink-0"
        aria-hidden="true"
      />
    ) : (
      leadingIcon && (
        <span className="inline-flex shrink-0 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
          {leadingIcon}
        </span>
      )
    )}
    {children !== undefined && children !== null && children !== false && (
      <span className="min-w-0 truncate">{children}</span>
    )}
    {trailing && <span className="shrink-0 text-caption font-bold opacity-80 tabular-nums">{trailing}</span>}
  </>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, size, fullWidth, leadingIcon, trailing, loading = false, className = '', disabled, type = 'button', children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClassName({ variant, size, fullWidth })} ${className}`}
      {...props}
    >
      <ButtonContent leadingIcon={leadingIcon} trailing={trailing} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  )
);

Button.displayName = 'Button';

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant, size, fullWidth, leadingIcon, trailing, loading = false, className = '', children, ...props }, ref) => (
    <a ref={ref} className={`${buttonClassName({ variant, size, fullWidth })} ${className}`} {...props}>
      <ButtonContent leadingIcon={leadingIcon} trailing={trailing} loading={loading}>
        {children}
      </ButtonContent>
    </a>
  )
);

ButtonLink.displayName = 'ButtonLink';
