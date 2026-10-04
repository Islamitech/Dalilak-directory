import React from 'react';
import { Layers } from 'lucide-react';
import { CATEGORY_TAXONOMY, getCategoryGroupById } from '../../../data/categoryTaxonomy';
import { CategoryCounts } from '../model/filterModel';

interface CategoryFilterSectionProps {
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (subcat: string) => void;
  isZoneScoped: boolean;
  selectedZone: string;
  zoneBusinessesCount: number;
  categoryCounts: CategoryCounts;
}

export const CategoryFilterSection: React.FC<CategoryFilterSectionProps> = ({
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  isZoneScoped,
  selectedZone,
  zoneBusinessesCount,
  categoryCounts,
}) => {
  const selectedCategoryGroup = getCategoryGroupById(categoryFilter);

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>فئة النشاط والخدمة</span>
        </h4>
        {isZoneScoped && (
          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            نطاق: {selectedZone} ({zoneBusinessesCount})
          </span>
        )}
      </div>

      {isZoneScoped && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-2 text-[11px] text-amber-900 flex items-center justify-between">
          <span>📍 الأنشطة المتوفرة فعلياً في {selectedZone} فقط</span>
          {categoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => {
                onCategoryChange('all');
                onSubcategoryChange('all');
              }}
              className="text-amber-800 font-bold underline text-[10.5px] cursor-pointer"
            >
              عرض كل أنشطة {selectedZone}
            </button>
          )}
        </div>
      )}

      <select
        value={categoryFilter}
        onChange={(e) => {
          onCategoryChange(e.target.value);
          onSubcategoryChange('all');
        }}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
      >
        <option value="all">
          {isZoneScoped ? `كافة أنشطة ${selectedZone} (${zoneBusinessesCount} مكان)` : 'كافة الفئات والأنشطة'}
        </option>
        {CATEGORY_TAXONOMY.filter((group) => !isZoneScoped || (categoryCounts.groups.get(group.id) || 0) > 0).map((group) => (
          <option key={group.id} value={group.id}>
            {group.icon} {group.label} ({categoryCounts.groups.get(group.id) || 0})
          </option>
        ))}
      </select>

      {selectedCategoryGroup && (
        <div className="space-y-1.5 animate-fade-in">
          <label className="text-[11px] font-bold text-slate-500 block">النوع الفرعي:</label>
          <select
            value={subcategoryFilter}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كل {selectedCategoryGroup.label} ({categoryCounts.groups.get(selectedCategoryGroup.id) || 0})</option>
            {selectedCategoryGroup.children
              .filter((child) => !isZoneScoped || (categoryCounts.children.get(child.id) || 0) > 0)
              .map((child) => (
                <option key={child.id} value={child.id}>
                  {child.label} ({categoryCounts.children.get(child.id) || 0})
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
};
