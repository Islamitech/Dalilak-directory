import React, { useId } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon' | 'badge' | 'watermark';
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
  lightText = false,
}) => {
  const rawId = useId().replace(/:/g, '');
  const goldId = `dl-gold-${rawId}`;
  const silverId = `dl-silver-${rawId}`;
  const inkId = `dl-ink-${rawId}`;

  const iconDimensions = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-13 h-13 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-18 sm:h-18',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  const titleSize = {
    sm: 'text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
    '2xl': 'text-4xl sm:text-5xl',
  }[size];

  const subtitleSize = {
    sm: 'text-caption',
    md: 'text-caption',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base',
    '2xl': 'text-base sm:text-lg',
  }[size];

  const wordColor = lightText ? 'text-[var(--logo-gold-0)]' : 'text-[var(--brand-deep)]';

  const Mark = (
    <svg viewBox="0 0 100 100" fill="none" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-gold-0)" />
          <stop offset="42%" stopColor="var(--logo-gold-1)" />
          <stop offset="100%" stopColor="var(--logo-gold-3)" />
        </linearGradient>
        <linearGradient id={silverId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-silver-0)" />
          <stop offset="48%" stopColor="var(--logo-silver-1)" />
          <stop offset="100%" stopColor="var(--logo-silver-2)" />
        </linearGradient>
        <linearGradient id={inkId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-ink-0)" />
          <stop offset="100%" stopColor="var(--logo-ink-2)" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="94" height="94" rx="24" fill={`url(#${inkId})`} />
      <rect x="3" y="3" width="94" height="94" rx="24" fill="none" stroke={`url(#${goldId})`} strokeWidth="3" />
      <path
        d="M50 18C35 18 24 29 24 43c0 13 15 26 26 36 11-10 26-23 26-36 0-14-11-25-26-25z"
        fill={`url(#${goldId})`}
      />
      <circle cx="50" cy="41" r="15" fill="var(--logo-ink-core)" />
      <path d="M39 51c4-2.4 18-2.4 22 0v2c-4-2.2-18-2.2-22 0z" fill={`url(#${silverId})`} />
      <path d="M41 50V42l4.5-3.2V49z" fill={`url(#${silverId})`} />
      <path d="M46.5 49V34L51.5 30l4 2.6V49z" fill={`url(#${silverId})`} />
      <path d="M46.5 34L51.5 30l4 2.6" stroke="var(--logo-silver-0)" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M56.5 49.5V42l4.5 1.6v6.4z" fill={`url(#${silverId})`} />
    </svg>
  );

  const IconElement = (
    <span className={`relative ${iconDimensions} inline-flex shrink-0 items-center justify-center`}>
      {Mark}
    </span>
  );

  if (variant === 'icon' || variant === 'watermark') {
    return (
      <span className={variant === 'watermark' ? `pointer-events-none opacity-5 select-none ${className}` : className}>
        {variant === 'watermark' ? Mark : IconElement}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-3 rounded-lg border border-amber-500/30 bg-[var(--bg-surface)]/95 p-2.5 shadow-md backdrop-blur-md select-none sm:p-3 ${className}`}>
        {IconElement}
        <div className="flex flex-col text-start">
          <div className="flex items-center gap-1.5">
            <span className="font-['Cairo'] text-sm font-extrabold leading-none text-[var(--text-primary)] sm:text-base">دليلك</span>
            <span className="rounded-pill border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-caption font-extrabold text-amber-700">
              منظومة معتمدة
            </span>
          </div>
          <span className="mt-1 text-caption font-bold text-[var(--text-muted)]">
            المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات — مصر
          </span>
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 select-none sm:gap-2 ${className}`}>
      {IconElement}
      <span className="flex flex-col justify-center text-start">
        <span className={`font-['Cairo'] font-extrabold leading-none tracking-tight ${titleSize} ${wordColor}`}>
          دليلك
        </span>
        {showSubtitle && (
          <span className={`mt-1 hidden font-bold leading-tight sm:block ${subtitleSize} ${lightText ? 'text-[var(--logo-gold-0)]' : 'text-[var(--text-secondary)]'}`}>
            دليل الأنشطة والخدمات الميدانية
          </span>
        )}
      </span>
    </span>
  );
};
