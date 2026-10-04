import React, { useMemo } from 'react';
import { Drawer } from '../../shared/ui';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { MAP_QUICK_CATEGORIES } from '../map/constants/mapConstants';
import {
  filterBusinessesForMap,
  getAvailableQuickCategoriesInZone,
} from '../../utils/hadayekZoneHelper';
import type { Business } from '../../types';
import type { useShowcaseFilterState } from './hooks/useShowcaseFilterState';

export interface DirectoryFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  effectiveCategory: string;
  filterState: ReturnType<typeof useShowcaseFilterState>;
}

const formatCountLabel = (n: number): string => {
  if (n === 0) return 'لا توجد أنشطة مطابقة';
  if (n === 1) return 'نشاط واحد مطابق';
  if (n === 2) return 'نشاطان مطابقان';
  if (n <= 10) return `${n} أنشطة مطابقة`;
  return `${n} نشاطاً مطابقاً`;
};

/**
 * 🎛️ DirectoryFilterSheet — global filter surface for /map and /search
 *
 * Follows the global maps convention: a bottom sheet on phones and a compact
 * centered panel on desktop. Changes apply live; the sheet never blocks the
 * whole page like the old inline map panel.
 */
export const DirectoryFilterSheet: React.FC<DirectoryFilterSheetProps> = ({
  isOpen,
  onClose,
  businesses,
  effectiveCategory,
  filterState,
}) => {
  const zone = filterState.hadayekZoneFilter;

  const categories = useMemo(
    () => getAvailableQuickCategoriesInZone(businesses, zone, MAP_QUICK_CATEGORIES),
    [businesses, zone]
  );

  const matchCount = useMemo(
    () => filterBusinessesForMap(businesses, zone || 'all', effectiveCategory || 'all', false).length,
    [businesses, zone, effectiveCategory]
  );

  const isAllActive = filterState.categoryFilter === 'all' && filterState.subcategoryFilter === 'all';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="تصفية الأنشطة"
      aria-label="تصفية الأنشطة"
      className="sm:left-1/2 sm:right-auto sm:w-[400px] sm:-translate-x-1/2 sm:bottom-5 sm:rounded-3xl sm:max-h-[75dvh]"
      contentClassName="p-4 sm:p-5 space-y-5"
    >
      <div>
        <label htmlFor="directory-filter-zone" className="block text-xs font-black text-slate-500 mb-1.5">
          المنطقة
        </label>
        <select
          id="directory-filter-zone"
          value={zone}
          onChange={(e) => filterState.setHadayekZoneFilter(e.target.value)}
          className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">كل المناطق</option>
          {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
            <option key={d.id} value={d.letterAr}>
              منطقة {d.letterAr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-xs font-black text-slate-500 mb-1.5">نوع النشاط</span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = cat.id === 'all' ? isAllActive : filterState.categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => filterState.handleCategoryChange(cat.id)}
                className={`min-h-11 px-3 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <span aria-hidden="true">{cat.icon}</span>
                <span>{cat.name}</span>
                {typeof cat.count === 'number' && cat.count > 0 && (
                  <span className="text-[11px] font-black text-slate-400">{cat.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-1 space-y-2.5">
        <p className="text-xs font-bold text-slate-500" aria-live="polite">
          {formatCountLabel(matchCount)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={filterState.resetAllFilters}
            disabled={!filterState.hasActiveFilters}
            className="min-h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-black hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            مسح الفلاتر
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-sm font-black cursor-pointer shadow-xs transition-all"
          >
            {matchCount > 0 ? `عرض النتائج (${matchCount})` : 'عرض النتائج'}
          </button>
        </div>
      </div>
    </Drawer>
  );
};
