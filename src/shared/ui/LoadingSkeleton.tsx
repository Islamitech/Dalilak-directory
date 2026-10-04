import React from 'react';
import { Skeleton } from './Skeleton';

export interface LoadingSkeletonProps {
  variant?: 'grid' | 'list' | 'detail' | 'map';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'grid',
  count = 6,
  className = '',
}) => {
  if (variant === 'detail') {
    return (
      <div className={`p-6 space-y-6 max-w-2xl mx-auto animate-fade-in ${className}`}>
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={64} height={64} />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </div>
        </div>
        <Skeleton variant="rectangular" height={180} />
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton variant="text" width="75%" height={16} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton variant="rectangular" height={44} />
          <Skeleton variant="rectangular" height={44} />
          <Skeleton variant="rectangular" height={44} />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-4 py-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={`skel-list-${i}`} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
            <Skeleton variant="rectangular" width={56} height={56} className="shrink-0 !rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="50%" height={18} />
              <Skeleton variant="text" width="30%" height={14} />
            </div>
            <Skeleton variant="rectangular" width={72} height={32} className="!rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div className={`w-full h-full min-h-[400px] relative bg-slate-100 dark:bg-slate-900 flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-slate-200/40 dark:bg-slate-800/40 animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جارٍ تحميل الخريطة التفاعلية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skel-grid-${i}`} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          <Skeleton variant="rectangular" height={140} className="w-full !rounded-xl" />
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="45%" height={14} />
          <div className="flex justify-between items-center pt-2">
            <Skeleton variant="text" width="30%" height={14} />
            <Skeleton variant="circular" width={28} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
};
