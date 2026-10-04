import React, { useMemo, useEffect } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { Business } from '../../../types';
import { getBusinessesInZone } from '../../../utils/hadayekZoneHelper';
import { useAccessibleDialog } from '../../../hooks/useAccessibleDialog';
import { Button } from '../../../shared/ui';
import { computeCategoryCounts } from '../model/filterModel';
import { LocationFilterSection } from './LocationFilterSection';
import { CategoryFilterSection } from './CategoryFilterSection';
import { QuickTogglesSection } from './QuickTogglesSection';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allBusinesses?: Business[];
  selectedGov: string;
  onGovChange: (gov: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  resultsCount: number;
  onResetAll: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  allBusinesses = [],
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  resultsCount,
  onResetAll,
}) => {
  const isHadayek = selectedCity.includes('حدائق الأهرام');
  const isZoneScoped = isHadayek && selectedZone !== 'all';

  const zoneBusinesses = useMemo(() => {
    if (!isZoneScoped || !allBusinesses || allBusinesses.length === 0) return null;
    return getBusinessesInZone(allBusinesses, selectedZone);
  }, [allBusinesses, isZoneScoped, selectedZone]);

  const categoryBusinesses = zoneBusinesses || allBusinesses;
  const categoryCounts = useMemo(() => computeCategoryCounts(categoryBusinesses), [categoryBusinesses]);

  useEffect(() => {
    if (isZoneScoped && categoryFilter !== 'all') {
      if ((categoryCounts.groups.get(categoryFilter) || 0) === 0) {
        onCategoryChange('all');
        onSubcategoryChange('all');
      } else if (subcategoryFilter !== 'all' && (categoryCounts.children.get(subcategoryFilter) || 0) === 0) {
        onSubcategoryChange('all');
      }
    }
  }, [isZoneScoped, categoryFilter, subcategoryFilter, categoryCounts, onCategoryChange, onSubcategoryChange]);

  const { containerRef } = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ direction: 'rtl' }}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:end-0 sm:start-auto sm:w-full sm:max-w-md z-10 flex flex-col justify-end sm:justify-start pointer-events-none">
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-drawer-title"
          className="w-full bg-[var(--bg-card)] border-t sm:border-t-0 sm:border-inline-start border-[var(--border-color)] rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col max-h-[90vh] sm:h-full pointer-events-auto animate-slide-up sm:animate-slide-left"
        >
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
            <div className="w-12 h-1 bg-slate-300 rounded-full" />
          </div>

          <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 id="filter-drawer-title" className="font-black text-slate-900 text-sm sm:text-base">تصفية الأنشطة</h3>
                <p className="text-[11px] text-slate-500 font-bold">خصص نتائج البحث بما يناسبك</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
            <LocationFilterSection
              selectedGov={selectedGov}
              onGovChange={onGovChange}
              selectedCity={selectedCity}
              onCityChange={onCityChange}
              selectedZone={selectedZone}
              onZoneChange={onZoneChange}
            />

            <CategoryFilterSection
              categoryFilter={categoryFilter}
              onCategoryChange={onCategoryChange}
              subcategoryFilter={subcategoryFilter}
              onSubcategoryChange={onSubcategoryChange}
              isZoneScoped={isZoneScoped}
              selectedZone={selectedZone}
              zoneBusinessesCount={zoneBusinesses?.length || 0}
              categoryCounts={categoryCounts}
            />

            <QuickTogglesSection
              openNowOnly={openNowOnly}
              onToggleOpenNow={onToggleOpenNow}
              hasRatingOnly={hasRatingOnly}
              onToggleHasRating={onToggleHasRating}
              hasVideoOnly={hasVideoOnly}
              onToggleHasVideo={onToggleHasVideo}
              sortBy={sortBy}
              onSortChange={onSortChange}
            />
          </div>

          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border-color)] bg-slate-50 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetAll}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 shrink-0"
            >
              إعادة ضبط
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onClose}
              className="flex-1 text-center"
            >
              عرض {resultsCount} نشاطاً
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
