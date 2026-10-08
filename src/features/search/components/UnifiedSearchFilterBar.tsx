import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Business } from '../../../types';
import { useIntegratedFilters } from '../hooks/useIntegratedFilters';
import { FilterDropdownMenu, FilterDropdownOption } from './FilterDropdownMenu';

export interface UnifiedSearchFilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  businesses: Business[];
  matchingCount: number;
  onResetAll?: () => void;
  variant?: 'list' | 'map';
  className?: string;
  // Optional props for backward compatibility
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  placeholder?: string;
}

/**
 * 🏷️ UnifiedSearchFilterBar — Two simple dropdown filters (Category & Zone)
 */
export const UnifiedSearchFilterBar: React.FC<UnifiedSearchFilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  businesses,
  matchingCount,
  onResetAll,
  className = '',
  searchQuery = '',
  onSearchChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'category' | 'zone' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    categories,
    categoryCounts,
    zones,
    activeCategory,
    activeZone,
    activeCategoryName,
    resetAll,
  } = useIntegratedFilters({
    businesses,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedZone,
    onZoneChange,
    onResetAll,
  });

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!openDropdown) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [openDropdown]);

  const hasFilterSelected = activeCategory !== 'all' || activeZone !== 'all';

  // Category options
  const categoryOptions = useMemo<FilterDropdownOption[]>(() => {
    const list: FilterDropdownOption[] = [{ id: 'all', label: 'كل الأنشطة والتصنيفات' }];
    for (const cat of categories) {
      const count = categoryCounts.get(cat.id);
      const isSelected = activeCategory === cat.id;
      if (businesses.length > 0 && count === 0 && !isSelected) continue;
      list.push({ id: cat.id, label: cat.name });
    }
    return list;
  }, [categories, categoryCounts, activeCategory, businesses.length]);

  // Zone options
  const zoneOptions = useMemo<FilterDropdownOption[]>(() => {
    const list: FilterDropdownOption[] = [{ id: 'all', label: 'كل مناطق حدائق الأهرام' }];
    for (const z of zones) {
      list.push({ id: z, label: `منطقة ${z}` });
    }
    return list;
  }, [zones]);

  const categoryLabel = searchQuery.trim()
    ? 'نوع النشاط'
    : activeCategory === 'all'
      ? 'نوع النشاط'
      : (categories.find((c) => c.id === activeCategory)?.name || activeCategoryName || 'نوع النشاط');

  const zoneLabel = activeZone === 'all' ? 'كل المناطق' : `منطقة ${activeZone}`;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`inline-flex flex-wrap items-center justify-center gap-1.5 select-none font-['Cairo',sans-serif] ${className}`}
    >
      {/* 1. Category Dropdown */}
      <FilterDropdownMenu
        label="نوع النشاط"
        displayValue={categoryLabel}
        options={categoryOptions}
        selectedValue={activeCategory}
        isOpen={openDropdown === 'category'}
        onToggle={() => setOpenDropdown((prev) => (prev === 'category' ? null : 'category'))}
        onSelect={(catId) => {
          onCategoryChange(catId);
          setOpenDropdown(null);
        }}
        ariaLabel="تصفية حسب نوع النشاط"
        menuWidthClass="w-52 sm:w-60"
        maxLabelWidthClass="max-w-[110px]"
      />

      {/* 2. Zone Dropdown */}
      <FilterDropdownMenu
        label="المنطقة"
        displayValue={zoneLabel}
        options={zoneOptions}
        selectedValue={activeZone}
        isOpen={openDropdown === 'zone'}
        onToggle={() => setOpenDropdown((prev) => (prev === 'zone' ? null : 'zone'))}
        onSelect={(zoneId) => {
          onZoneChange(zoneId);
          setOpenDropdown(null);
        }}
        ariaLabel="تصفية حسب المنطقة"
        menuWidthClass="w-48 sm:w-52"
        maxLabelWidthClass="max-w-[95px]"
      />

      {/* 3. Active Filters Reset & Count Pill */}
      {hasFilterSelected && (
        <div className="inline-flex items-center gap-1 animate-fade-in">
          <span className="text-caption font-bold text-slate-500 px-0.5">
            {matchingCount} نتيجة
          </span>
          <button
            type="button"
            onClick={resetAll}
            className="h-10 px-3 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-caption font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200 active:scale-95 shadow-xs"
            aria-label="مسح الفلاتر المحددة"
            title="إعادة تعيين الفلاتر"
          >
            <X size={12} />
            <span>مسح</span>
          </button>
        </div>
      )}
    </div>
  );
};
