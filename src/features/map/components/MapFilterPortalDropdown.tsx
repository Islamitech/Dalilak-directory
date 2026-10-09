import React from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button, Pressable } from '../../../shared/ui';

export interface MapFilterPortalDropdownProps {
  isOpen: boolean;
  dropdownPos: { top: number; left: number } | null;
  mapCategoryFilter: string;
  onlyVerifiedFilter: boolean;
  activeQuickCategories: Array<{ id: string; name: string; icon: string; count: number }>;
  isZoneScoped: boolean;
  onClose: () => void;
  onSelectCategory: (catId: string) => void;
  onToggleVerified: (checked: boolean) => void;
  onReset: () => void;
}

export const MapFilterPortalDropdown: React.FC<MapFilterPortalDropdownProps> = ({
  isOpen,
  dropdownPos,
  mapCategoryFilter,
  onlyVerifiedFilter,
  activeQuickCategories,
  isZoneScoped,
  onClose,
  onSelectCategory,
  onToggleVerified,
  onReset,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[999998] bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: dropdownPos ? `${dropdownPos.top}px` : '44px',
          left: dropdownPos ? `${dropdownPos.left}px` : '16px',
        }}
        className="w-72 sm:w-80 max-w-[calc(100vw-16px)] bg-white/98 border border-slate-200 rounded-lg shadow-2xl backdrop-blur-xl p-3 z-[999999] text-start text-slate-800 animate-fade-in-scale space-y-2.5 select-none font-['Cairo',sans-serif]"
        dir="rtl"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>تصفية وفلترة أنشطة الخريطة</span>
          </span>
          <Pressable
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-pill hover:bg-slate-100 cursor-pointer transition-colors"
            title="إغلاق"
            aria-label="إغلاق نافذة التصفية"
          >
            <X className="w-3.5 h-3.5" />
          </Pressable>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-caption font-bold text-slate-600">
            <span>تصنيف النشاط:</span>
            {mapCategoryFilter !== 'all' && (
              <span className="text-caption font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-pill border border-amber-200">
                محدد حالياً
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pe-1 scrollbar-thin scrollbar-thumb-slate-200">
            <Pressable
              key="all"
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`text-caption font-bold px-2 py-1.5 rounded-pill text-start truncate transition-all cursor-pointer flex items-center gap-1.5 border ${
                mapCategoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <span>🧹</span>
              <span className="truncate">إخفاء الأنشطة (خريطة نظيفة)</span>
            </Pressable>
            {activeQuickCategories.map((cat) => (
              <Pressable
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`text-caption font-bold px-2 py-1.5 rounded-pill text-start truncate transition-all cursor-pointer flex items-center justify-between border ${
                  mapCategoryFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.name.split(' ')[0]}</span>
                </div>
                {isZoneScoped && cat.count > 0 && (
                  <span
                    className={`text-caption font-mono font-bold px-1 rounded-pill ${
                      mapCategoryFilter === cat.id ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </Pressable>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="flex items-center justify-between text-xs text-slate-700 font-bold cursor-pointer select-none bg-slate-50 px-2 py-1.5 rounded-pill border border-slate-200 hover:border-amber-300 transition-colors">
            <span className="text-caption">موثق فقط</span>
            <input
              type="checkbox"
              checked={onlyVerifiedFilter}
              onChange={(e) => onToggleVerified(e.target.checked)}
              className="rounded-sm accent-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
            <Button variant="ghost" size="sm" className="text-amber-700" onClick={onReset}>
              إعادة تعيين
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showcase:hide-activities', { detail: true }));
                onClose();
              }}
            >
              إخفاء الأنشطة
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
