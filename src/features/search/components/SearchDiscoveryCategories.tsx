import React from 'react';
import { DISCOVERY_CATEGORIES } from '../../../components/views/search/discoveryCategories';
import { CategoryHierarchyFilter } from '../../../components/search/CategoryHierarchyFilter';
import { Business } from '../../../types';

interface SearchDiscoveryCategoriesProps {
  categoryFilter: string;
  subcategoryFilter: string;
  onCategoryChange: (cat: string) => void;
  onSubcategoryChange: (subcat: string) => void;
  categoryScopeBusinesses: Business[];
  onShowAll: () => void;
}

export const SearchDiscoveryCategories: React.FC<SearchDiscoveryCategoriesProps> = ({
  categoryFilter,
  subcategoryFilter,
  onCategoryChange,
  onSubcategoryChange,
  categoryScopeBusinesses,
  onShowAll,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-0.5">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            ماذا تبحث عنه اليوم؟
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            خدمات يومك، في مكان واحد
          </p>
        </div>
        <button
          type="button"
          onClick={onShowAll}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>كل الأنشطة</span>
          <span>←</span>
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
        {DISCOVERY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected =
            categoryFilter === cat.groupId &&
            (!cat.subcategoryId || subcategoryFilter === cat.subcategoryId);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onCategoryChange('all');
                  onSubcategoryChange('all');
                } else {
                  onCategoryChange(cat.groupId);
                  onSubcategoryChange(cat.subcategoryId || 'all');
                }
              }}
              className={`rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 text-center transition-all cursor-pointer active:scale-95 group ${
                isSelected
                  ? 'bg-amber-50/95 border-2 border-amber-500 text-amber-950 font-black shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-900 shadow-2xs hover:shadow-sm'
              }`}
            >
              <Icon
                className={`w-7 h-7 shrink-0 transition-transform group-hover:scale-110 ${
                  isSelected ? 'text-amber-700' : 'text-[#c59b27]'
                }`}
                strokeWidth={isSelected ? 2.2 : 1.8}
              />
              <span className={`text-xs sm:text-sm leading-tight ${isSelected ? 'font-black text-amber-950' : 'font-bold text-slate-900'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      <CategoryHierarchyFilter
        businesses={categoryScopeBusinesses}
        mainCategoryId={categoryFilter}
        subcategoryId={subcategoryFilter}
        onMainCategoryChange={onCategoryChange}
        onSubcategoryChange={onSubcategoryChange}
      />
    </section>
  );
};
