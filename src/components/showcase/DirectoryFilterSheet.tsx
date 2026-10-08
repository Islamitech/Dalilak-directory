import React, { useMemo } from 'react';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import {
  filterBusinessesForMap,
  getBusinessesInZone,
} from '../../utils/hadayekZoneHelper';
import {
  matchesCategoryFilter,
  resolveCategorySelection,
} from '../../utils/categoryMatcher';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import type { Business } from '../../types';
import type { useShowcaseFilterState } from './hooks/useShowcaseFilterState';
import { INTEGRATED_FILTER_CATEGORIES } from '../../features/search';

export interface DirectoryFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  effectiveCategory: string;
  filterState: ReturnType<typeof useShowcaseFilterState>;
}

export const DIRECTORY_FILTER_CATEGORIES = INTEGRATED_FILTER_CATEGORIES;

export const formatFilterCountLabel = (n: number): string => {
  if (n === 0) return 'لا توجد نتائج مطابقة';
  if (n === 1) return 'نشاط واحد مطابق';
  if (n === 2) return 'نشاطان مطابقان';
  if (n <= 10) return `${n} أنشطة مطابقة`;
  return `${n} نشاطاً مطابقاً`;
};

/**
 * 🎛️ DirectoryFilterSheet — Visual prototype filter sheet with strict light theme
 *
 * Implements bottom sheet on mobile and centered compact floating sheet on desktop.
 * Displays zone selector from hadayekZoneHelper, active categories with counts (zero-count hidden),
 * live Arabic dual/plural match counter, and action buttons.
 */
export const DirectoryFilterSheet: React.FC<DirectoryFilterSheetProps> = ({
  isOpen,
  onClose,
  businesses,
  effectiveCategory,
  filterState,
}) => {
  const { containerRef } = useAccessibleDialog({ isOpen, onClose });
  const zone = filterState.hadayekZoneFilter;

  const activeCategories = useMemo(() => {
    const zoneBusinesses = getBusinessesInZone(businesses, zone);
    return DIRECTORY_FILTER_CATEGORIES.map((cat) => ({
      ...cat,
      count: zoneBusinesses.filter((b) => matchesCategoryFilter(b, cat.id)).length,
    })).filter((cat) => cat.count > 0);
  }, [businesses, zone]);

  const matchCount = useMemo(
    () => filterBusinessesForMap(businesses, zone || 'all', effectiveCategory || 'all', false).length,
    [businesses, zone, effectiveCategory]
  );

  const isAllActive =
    filterState.categoryFilter === 'all' &&
    (!filterState.subcategoryFilter || filterState.subcategoryFilter === 'all');

  const isCategoryActive = (catId: string): boolean => {
    if (catId === 'all') return isAllActive;
    if (filterState.categoryFilter === catId) return true;
    const resolved = resolveCategorySelection(filterState.categoryFilter);
    return resolved.mainCategoryId === catId;
  };

  if (!isOpen) return null;

  return (
    <div
      className="dl-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        tabIndex={-1}
        className="dl-sheet dl-filter-sheet"
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="dl-fh fh">
          <h2 id="filter-sheet-title">تصفية الأنشطة</h2>
          <button
            type="button"
            className="dl-fx fx"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dl-fb fb">
          {/* Zone Selector */}
          <div>
            <label htmlFor="directory-filter-zone" className="dl-fl fl">
              المنطقة
            </label>
            <select
              id="directory-filter-zone"
              value={zone}
              onChange={(e) => filterState.setHadayekZoneFilter(e.target.value)}
              className="dl-fsel"
            >
              <option value="all">كل المناطق</option>
              {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                <option key={d.id} value={d.letterAr}>
                  منطقة {d.letterAr}
                </option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div>
            <span className="dl-fl fl">نوع النشاط</span>
            <div className="dl-fc fc">
              <button
                type="button"
                data-fcat="all"
                aria-pressed={isAllActive}
                onClick={() => filterState.handleCategoryChange('all')}
              >
                الكل
              </button>
              {activeCategories.map((cat) => {
                const active = isCategoryActive(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-fcat={cat.id}
                    aria-pressed={active}
                    onClick={() => filterState.handleCategoryChange(cat.id)}
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    <span>{cat.name}</span>
                    <small>{cat.count}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Result Count & Footer Actions */}
          <div>
            <p className="dl-fn fn" aria-live="polite">
              {formatFilterCountLabel(matchCount)}
            </p>
            <div className="dl-ff ff">
              <button
                type="button"
                onClick={filterState.resetAllFilters}
                disabled={!filterState.hasActiveFilters}
                className="dl-fr fr"
              >
                مسح الفلاتر
              </button>
              <button
                type="button"
                onClick={onClose}
                className="dl-fgo fgo"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
