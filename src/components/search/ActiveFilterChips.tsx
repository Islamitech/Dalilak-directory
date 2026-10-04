import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Chip } from '../../shared/ui';

export interface ActiveFilterChipsProps {
  categoryFilter: string;
  categoryLabel?: string;
  subcategoryFilter?: string;
  subcategoryLabel?: string;
  onClearCategory: () => void;
  onClearSubcategory?: () => void;
  selectedGov: string;
  onClearGov: () => void;
  selectedCity: string;
  onClearCity: () => void;
  openNowOnly: boolean;
  onClearOpenNow: () => void;
  hasVideoOnly?: boolean;
  onClearHasVideo?: () => void;
  sortBy: string;
  onClearSort: () => void;
  onResetAll: () => void;
  hasActiveFilters: boolean;
  hideResetButton?: boolean;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  categoryFilter,
  categoryLabel,
  subcategoryFilter = 'all',
  subcategoryLabel,
  onClearCategory,
  onClearSubcategory,
  selectedGov,
  onClearGov,
  selectedCity,
  onClearCity,
  openNowOnly,
  onClearOpenNow,
  hasVideoOnly = false,
  onClearHasVideo,
  sortBy,
  onClearSort,
  onResetAll,
  hasActiveFilters,
  hideResetButton = false,
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
      <span className="text-[11px] font-bold text-slate-500 me-1">الفلاتر المطبقة:</span>

      {categoryFilter !== 'all' && (
        <Chip
          variant="gold"
          onClear={onClearCategory}
          aria-label={`إلغاء فلتر التصنيف: ${categoryLabel || categoryFilter}`}
        >
          التصنيف: {categoryLabel || categoryFilter}
        </Chip>
      )}

      {subcategoryFilter !== 'all' && (
        <Chip
          variant="default"
          onClear={onClearSubcategory}
          aria-label={`إلغاء فلتر النوع: ${subcategoryLabel || subcategoryFilter}`}
        >
          النوع: {subcategoryLabel || subcategoryFilter}
        </Chip>
      )}

      {selectedGov !== 'all' && (
        <Chip
          variant="default"
          onClear={onClearGov}
          aria-label={`إلغاء فلتر المحافظة: ${selectedGov}`}
        >
          المحافظة: {selectedGov}
        </Chip>
      )}

      {selectedCity !== 'all' && (
        <Chip
          variant="default"
          onClear={onClearCity}
          aria-label={`إلغاء فلتر المنطقة: ${selectedCity}`}
        >
          المنطقة: {selectedCity}
        </Chip>
      )}

      {openNowOnly && (
        <Chip
          variant="success"
          onClear={onClearOpenNow}
          aria-label="إلغاء فلتر مفتوح الآن"
        >
          مفتوح الآن
        </Chip>
      )}

      {hasVideoOnly && (
        <Chip
          variant="default"
          onClear={onClearHasVideo}
          aria-label="إلغاء فلتر يحتوي على فيديو"
        >
          يحتوي على فيديو
        </Chip>
      )}

      {sortBy !== 'default' && (
        <Chip
          variant="default"
          onClear={onClearSort}
          aria-label="إلغاء الترتيب المخصص"
        >
          ترتيب:{' '}
          {sortBy === 'nearest'
            ? 'الأقرب أولاً'
            : sortBy === 'newest'
            ? 'الأحدث'
            : sortBy === 'open_now'
            ? 'المفتوح أولاً'
            : sortBy}
        </Chip>
      )}

      {!hideResetButton && (
        <button
          type="button"
          onClick={onResetAll}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>إعادة ضبط الكل</span>
        </button>
      )}
    </div>
  );
};
