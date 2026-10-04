import React from 'react';

export interface MapQuickCategoriesBarProps {
  categories: Array<{ id: string; name: string; icon: string }>;
  categoryFilter: string;
  onSelectCategory: (catId: string) => void;
}

export const MapQuickCategoriesBar: React.FC<MapQuickCategoriesBarProps> = ({
  categories,
  categoryFilter,
  onSelectCategory,
}) => {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="فلاتر سريعة لنوع النشاط">
      {categories
        .filter((c) => c.id !== 'all')
        .slice(0, 8)
        .map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-pressed={categoryFilter === cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold shadow-sm transition-colors cursor-pointer ${
              categoryFilter === cat.id
                ? 'border-amber-500 bg-amber-500 text-slate-950'
                : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
    </div>
  );
};
