import React, { useMemo } from 'react';
import { History, Sparkles, Building2 } from 'lucide-react';
import { Business } from '../../../types';
import { parseHadayekBuildingAddress } from '../../../utils/hadayekBuildingSearch';
import { getFirstStrongDirection } from '../../../utils/textDirection';

interface SearchSuggestionsDropdownProps {
  suggestions: Business[];
  recentSearches: string[];
  searchQuery: string;
  onSelectBusiness?: (business: Business) => void;
  onSelectQuery: (term: string) => void;
  onClearRecent: () => void;
}

const POPULAR_SEARCH_TERMS = [
  'مطاعم بيتزا',
  'صيدلية 24 ساعة',
  'عيادة أسنان',
  'صيانة سيارات',
  'محل ملابس',
  'جيم ولياقة',
];

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  suggestions,
  recentSearches,
  searchQuery,
  onSelectBusiness,
  onSelectQuery,
  onClearRecent,
}) => {
  const buildingMatch = useMemo(() => {
    return parseHadayekBuildingAddress(searchQuery);
  }, [searchQuery]);

  return (
    <div className="absolute top-full inset-x-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-fade-in">
      <div className="p-3 space-y-3 max-h-[min(18rem,40dvh)] overflow-y-auto overscroll-contain text-start">
        {buildingMatch && (
          <div className="space-y-1 pb-2 border-b border-[var(--border-color)]">
            <span className="text-[10.5px] font-black text-[var(--text-muted)] block px-2">
              عمارة سكنية في أطلس حدائق الأهرام
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectQuery(searchQuery)}
              className="w-full text-start p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-slate-900 flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs truncate">
                    عمارة {buildingMatch.buildingNumber} — منطقة ({buildingMatch.zoneLetter})
                  </p>
                  <p className="text-[10.5px] text-[var(--text-muted)] truncate">
                    بحث مساحي مباشر والانتقال إلى الخريطة
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg shrink-0 font-black">
                عرض
              </span>
            </button>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10.5px] font-black text-[var(--text-muted)] block px-2">
              أنشطة مقترحة
            </span>
            {suggestions.map((biz) => (
              <button
                key={biz.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (onSelectBusiness) onSelectBusiness(biz);
                  else onSelectQuery(biz.nameAr);
                }}
                className="w-full text-start p-2 rounded-xl hover:bg-slate-100 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p dir={getFirstStrongDirection(biz.nameAr)} className="font-black text-[var(--text-primary)] truncate">
                    <bdi dir="auto">{biz.nameAr}</bdi>
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{biz.category} • {biz.governorate}</p>
                </div>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded-md shrink-0 font-bold">
                  عرض
                </span>
              </button>
            ))}
          </div>
        )}

        {!searchQuery && recentSearches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10.5px] font-black text-[var(--text-muted)] flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                <span>عمليات البحث الأخيرة</span>
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClearRecent}
                className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
              >
                مسح السجل
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectQuery(term)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {!searchQuery && recentSearches.length === 0 && (
          <div className="space-y-1.5 px-2 py-1">
            <span className="text-[10.5px] font-black text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>عمليات بحث شائعة في مصر</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_SEARCH_TERMS.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectQuery(term)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
