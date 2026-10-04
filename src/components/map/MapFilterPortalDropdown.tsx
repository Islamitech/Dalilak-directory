import React from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';

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
        className="w-72 sm:w-80 max-w-[calc(100vw-16px)] bg-slate-950/98 border-2 border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-[999999] text-right text-white animate-fade-in-scale space-y-2.5 select-none font-['Cairo',sans-serif]"
        dir="rtl"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>تصفية وفلترة أنشطة الخريطة</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>تصنيف النشاط:</span>
            {mapCategoryFilter !== 'all' && (
              <span className="text-[9.5px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                محدد حالياً
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pe-1 scrollbar-thin scrollbar-thumb-slate-800">
            <button
              key="all"
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`text-[11px] font-bold px-2 py-1.5 rounded-lg text-right truncate transition-all cursor-pointer flex items-center gap-1.5 border ${
                mapCategoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>🧹</span>
              <span className="truncate">إخفاء الأنشطة (خريطة نظيفة)</span>
            </button>
            {activeQuickCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`text-[11px] font-bold px-2 py-1.5 rounded-lg text-right truncate transition-all cursor-pointer flex items-center justify-between border ${
                  mapCategoryFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.name.split(' ')[0]}</span>
                </div>
                {isZoneScoped && cat.count > 0 && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1 rounded ${
                      mapCategoryFilter === cat.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer select-none bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-[11px]">الموثقة رسمياً فقط (Verified)</span>
            <input
              type="checkbox"
              checked={onlyVerifiedFilter}
              onChange={(e) => onToggleVerified(e.target.checked)}
              className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
            >
              إعادة تعيين
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onClose();
              }}
              className="text-[11px] font-black text-rose-400 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
            >
              إخفاء الأنشطة
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
