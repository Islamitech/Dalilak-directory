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
  truncateLabel?: boolean;
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions & ButtonContentProps;
export type ButtonLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleOptions & ButtonContentProps;

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-pill border font-bold whitespace-nowrap select-none cursor-pointer no-underline transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100 aria-disabled:opacity-55 aria-disabled:pointer-events-none';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-label',
  md: 'min-h-[42px] px-4 text-label',
  lg: 'min-h-12 px-5 text-body',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand)] border-[var(--brand-strong)] text-[var(--logo-ink-core)] hover:bg-[var(--brand-strong)] hover:border-[var(--brand-deep)] shadow-xs hover:shadow-sm',
  secondary:
    'bg-[var(--logo-silver-1)] border-[var(--logo-silver-2)] text-[var(--logo-ink-0)] hover:bg-[var(--logo-silver-0)] hover:border-[var(--logo-silver-3)]',
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
  truncateLabel = true,
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
      <span className={truncateLabel ? 'min-w-0 truncate' : undefined}>{children}</span>
    )}
    {trailing && <span className="shrink-0 text-caption font-bold opacity-80 tabular-nums">{trailing}</span>}
  </>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, size, fullWidth, leadingIcon, trailing, loading = false, truncateLabel = true, className = '', disabled, type = 'button', children, ...props },
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
      <ButtonContent leadingIcon={leadingIcon} trailing={trailing} loading={loading} truncateLabel={truncateLabel}>
        {children}
      </ButtonContent>
    </button>
  )
);

Button.displayName = 'Button';

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant, size, fullWidth, leadingIcon, trailing, loading = false, truncateLabel = true, className = '', children, ...props }, ref) => (
    <a ref={ref} className={`${buttonClassName({ variant, size, fullWidth })} ${className}`} {...props}>
      <ButtonContent leadingIcon={leadingIcon} trailing={trailing} loading={loading} truncateLabel={truncateLabel}>
        {children}
      </ButtonContent>
    </a>
  )
);

ButtonLink.displayName = 'ButtonLink';
