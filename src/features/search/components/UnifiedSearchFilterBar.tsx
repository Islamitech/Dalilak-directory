import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Business } from '../../../types';
import { useIntegratedFilters } from '../hooks/useIntegratedFilters';
import { FilterDropdownMenu, FilterDropdownOption } from './FilterDropdownMenu';
import { getCategoryGroupById, getSubcategoryById } from '../../../shared/data/categoryTaxonomy';

export interface UnifiedSearchFilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  businesses: Business[];
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
  } = useIntegratedFilters({
    businesses,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedZone,
    onZoneChange,
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

  // Category options
  const categoryOptions = useMemo<FilterDropdownOption[]>(() => {
    const list: FilterDropdownOption[] = [{ id: 'all', label: 'الكل' }];
    for (const cat of categories) {
      const count = categoryCounts.get(cat.id);
      const isSelected = activeCategory === cat.id;
      if (businesses.length > 0 && count === 0 && !isSelected) continue;
      list.push({ id: cat.id, label: cat.shortName });
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

  const selectedCategoryItem = categories.find((c) => c.id === activeCategory);
  const parentCategoryId = getSubcategoryById(activeCategory)?.groupId || activeCategory;
  const parentWord = categories.find((c) => c.id === parentCategoryId)?.shortName
    || getCategoryGroupById(parentCategoryId)?.word;
  const categoryLabel = activeCategory === 'all'
    ? 'الكل'
    : (selectedCategoryItem?.shortName || parentWord || activeCategoryName || 'الكل');

  const zoneLabel = activeZone === 'all' ? 'المناطق' : activeZone;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`inline-flex flex-nowrap items-center gap-1 select-none font-['Cairo',sans-serif] ${className}`}
    >
      <FilterDropdownMenu
        compact
        label="نوع النشاط"
        displayValue={categoryLabel}
        options={categoryOptions}
        selectedValue={parentCategoryId}
        isOpen={openDropdown === 'category'}
        onToggle={() => setOpenDropdown((prev) => (prev === 'category' ? null : 'category'))}
        onSelect={(catId) => {
          onCategoryChange(catId);
          setOpenDropdown(null);
        }}
        ariaLabel="تصفية حسب نوع النشاط"
        menuWidthClass="w-52 sm:w-60"
        maxLabelWidthClass="max-w-14"
      />

      <FilterDropdownMenu
        compact
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
        maxLabelWidthClass="max-w-12"
      />
    </div>
  );
};
