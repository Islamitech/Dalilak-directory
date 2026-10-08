import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface OfflineStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  banner?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  title = 'أنت غير متصل بالإنترنت',
  description = 'نعرض حالياً البيانات المحفوظة محلياً. تحقق من الاتصال لتحديث أحدث الأنشطة والخرائط.',
  onRetry,
  retryLabel = 'إعادة المحاولة',
  banner = false,
  className = '',
  children,
}) => {
  if (banner) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in ${className}`}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">{description}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-bold text-amber-800 hover:underline shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 bg-[var(--bg-card)] rounded-3xl border border-amber-500/20 shadow-xs max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl mb-4 border border-amber-500/20 shadow-xs">
        <WifiOff className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed font-medium">
          {description}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          {retryLabel}
        </Button>
      )}
      {children}
    </div>
  );
};
