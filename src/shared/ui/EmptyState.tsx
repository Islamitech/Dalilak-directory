import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🔍',
  title,
  description,
  actionLabel,
  actionIcon,
  actionVariant = 'primary',
  onAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`empty flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto ${className}`}
    >
      <div className="empty-icon w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-4 border border-amber-200/50 shadow-xs">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed font-medium">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant={actionVariant} size="sm" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};
