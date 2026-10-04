import { useDirectoryLoad } from '../../contexts/DirectoryLoadContext';
import React, { useState, useEffect } from 'react';
import { Business } from '../../types';
import { UnifiedBusinessCard as BusinessCard } from '../../features/business-details';
import { Search, RotateCcw, Sparkles } from 'lucide-react';
import { EmptyState, Skeleton, Button, ErrorState, LoadingSkeleton } from '../../shared/ui';

export interface BusinessCardGridProps {
  businesses: Business[];
  loading?: boolean;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onResetFilters: () => void;
  onOpenVideoModal?: (biz: Business) => void;
  pageSize?: number;
}

export const BusinessCardGrid: React.FC<BusinessCardGridProps> = ({
  businesses,
  loading = false,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onResetFilters,
  onOpenVideoModal,
  pageSize = 12,
}) => {
  const directoryLoad = useDirectoryLoad();
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const prevBusinessesRef = React.useRef<Business[]>(businesses);

  useEffect(() => {
    const prev = prevBusinessesRef.current;
    prevBusinessesRef.current = businesses;

    const prevIds = new Set(prev.map((b) => b.id));
    const isCatalogSync =
      businesses.length > 0 &&
      prev.length > 0 &&
      (businesses.every((b) => prevIds.has(b.id)) || prev.every((b) => businesses.some((nb) => nb.id === b.id)));

    if (isCatalogSync) {
      setVisibleCount((current) => Math.min(Math.max(current, pageSize), Math.max(businesses.length, pageSize)));
    } else {
      setVisibleCount(pageSize);
    }
  }, [businesses, pageSize]);

  const visibleList = businesses.slice(0, visibleCount);
  const hasMore = visibleCount < businesses.length;

  // 1. Loading Skeleton
  if (loading && businesses.length === 0) {
    return <LoadingSkeleton variant="grid" count={6} />;
  }

  // 2. Error State with Retry (No Blank Screen)
  if (!businesses.length && directoryLoad.error) {
    return (
      <ErrorState
        title="تعذر تحميل قائمة الأنشطة"
        description={directoryLoad.error}
        onRetry={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
      />
    );
  }

  // 2. Empty State
  if (!loading && businesses.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-7 h-7 text-amber-600" />}
        title="لم نجد أنشطة مطابقة لخيارات بحثك"
        description="جرّب توسيع النطاق الجغرافي، أو تغيير التصنيف المختار، أو إزالة بعض الفلاتر."
      >
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-2.5 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط كافة الفلاتر</span>
        </button>
      </EmptyState>
    );
  }

  // 3. Grid View
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {visibleList.map((biz) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            onOpenBusiness={onOpenBusiness}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(biz.id)}
            userCoords={userCoords}
            onOpenVideoModal={onOpenVideoModal}
          />
        ))}
      </div>

      {/* Pagination / Load More Status */}
      <div className="pt-2 pb-4 flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-slate-500 font-bold bg-white border border-slate-200/80 shadow-xs rounded-full px-3.5 py-1.5">
          عرض {visibleList.length} من أصل {businesses.length} نشاطاً
        </p>

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + pageSize)}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-8 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span>تحميل المزيد ({businesses.length - visibleList.length} متبقي)</span>
          </button>
        )}
      </div>
    </div>
  );
};
