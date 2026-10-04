import React, { RefObject } from 'react';
import { X } from 'lucide-react';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';

export interface MapFilterPanelProps {
  regionRef: RefObject<HTMLSelectElement | null>;
  selectedZone: string;
  onSelectZone?: (zone: string) => void;
  categoryFilter: string;
  onCategoryChange?: (category: string) => void;
  onSearchModeChange: (mode: 'browse' | 'building') => void;
  categories: Array<{ id: string; name: string; icon: string; count?: number }>;
  filteredBusinessesCount?: number;
  onClearFilters: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  regionRef,
  selectedZone,
  onSelectZone,
  categoryFilter,
  onCategoryChange,
  onSearchModeChange,
  categories,
  filteredBusinessesCount,
  onClearFilters,
  onClose,
  children,
}) => {
  return (
    <section id="map-filter-panel" aria-label="فلاتر الخريطة" className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl max-h-[60dvh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900">فلاتر الخريطة</h2>
        <button type="button" aria-label="إغلاق الفلاتر" onClick={onClose} className="p-2 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <label className="block text-sm font-bold text-slate-700">
        المنطقة
        <select
          ref={regionRef as any}
          value={selectedZone === 'all' ? '' : selectedZone}
          onChange={(e) => onSelectZone?.(e.target.value)}
          className="block w-full mt-2 mb-4 border border-slate-200 rounded-xl p-2 bg-white"
        >
          <option value="">كل المدينة</option>
          {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
            <option key={d.id} value={d.letterAr}>
              منطقة {d.letterAr}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm font-bold text-slate-700 mb-2">نوع النشاط</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="نوع النشاط">
        {categories
          .filter((c) => c.id !== 'all')
          .map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={categoryFilter === cat.id}
              onClick={() => {
                onCategoryChange?.(categoryFilter === cat.id ? 'all' : cat.id);
                onSearchModeChange('browse');
              }}
              className={`min-h-11 text-sm rounded-xl border px-3 py-2 text-right transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.icon} {cat.name}
              {typeof cat.count === 'number' && <span className="text-xs me-1">({cat.count})</span>}
            </button>
          ))}
      </div>

      <p className="text-xs text-slate-500 mt-3" role="status">
        {categoryFilter === 'all'
          ? 'اختر نوع النشاط لعرض مواقعه على الخريطة'
          : `${filteredBusinessesCount ?? 0} نشاط مطابق`}
      </p>

      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          مسح الفلاتر
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 cursor-pointer hover:bg-amber-400"
        >
          عرض الخريطة
        </button>
      </div>

      {selectedZone && selectedZone !== 'all' && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer p-2">البحث عن مبنى في المنطقة</summary>
          {children}
        </details>
      )}
    </section>
  );
};
