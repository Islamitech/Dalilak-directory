import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'تعذر تحميل البيانات',
  description = 'حدث خطأ أثناء جلب البيانات المطلوبة. يرجى المحاولة مرة أخرى.',
  onRetry,
  retryLabel = 'إعادة المحاولة',
  icon,
  className = '',
  children,
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 bg-[var(--bg-card)] rounded-3xl border border-red-500/20 shadow-xs max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl mb-4 border border-red-500/20 shadow-xs">
        {icon || <AlertCircle className="w-8 h-8" />}
      </div>
      <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed font-medium">
          {description}
        </p>
      )}
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} icon={<RotateCcw className="w-3.5 h-3.5" />}>
          {retryLabel}
        </Button>
      )}
      {children}
    </div>
  );
};
