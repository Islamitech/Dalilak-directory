import React, { useEffect, useRef, useState } from 'react';
import { Building2, Store } from 'lucide-react';
import { Business } from '../../types';
import {
  searchInsideHadayekZone,
  ZoneScopedSearchResult,
  normalizeBuildingQuery,
  parseHadayekBuildingAddress,
} from '../../utils/hadayekBuildingSearch';
import { SearchField } from '../../shared/ui/SearchField';

interface UnifiedMapSearchProps {
  value: string;
  onChange: (value: string) => void;
  zone?: string;
  businesses: Business[];
  onSelectBuilding: (building: {
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  }) => void;
  onSelectBusiness?: (business: Business) => void;
}

export const UnifiedMapSearch: React.FC<UnifiedMapSearchProps> = ({
  value,
  onChange,
  zone,
  businesses,
  onSelectBuilding,
  onSelectBusiness,
}) => {
  const [results, setResults] = useState<ZoneScopedSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedZone = (query: string) => {
    const parsed = parseHadayekBuildingAddress(query, zone);
    if (parsed?.zoneLetter) return parsed.zoneLetter;
    if (zone && zone !== 'all') return zone;
    return '';
  };

  useEffect(() => {
    const query = value.trim();
    const searchZone = resolvedZone(query);
    if (!searchZone || !query) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const request = ++requestRef.current;
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      searchInsideHadayekZone(searchZone, query, businesses, 8).then((nextResults) => {
        if (request !== requestRef.current) return;
        setResults(nextResults);
        setIsLoading(false);
      });
    }, 160);

    return () => {
      window.clearTimeout(timer);
      requestRef.current++;
    };
  }, [businesses, value, zone]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = () => {
    const normalized = normalizeBuildingQuery(value);
    const digits = normalized.match(/\d+/)?.[0];
    if (!digits) return;
    const exactBuilding = results.find(
      (result) => result.type === 'building' && result.buildingNumber === String(Number(digits))
    );
    if (!exactBuilding || exactBuilding.type !== 'building') return;
    onChange('');
    setIsOpen(false);
    onSelectBuilding(exactBuilding);
  };

  const buildings = results.filter((result) => result.type === 'building');
  const activities = results.filter((result) => result.type === 'business');

  const selectBuilding = (building: Extract<ZoneScopedSearchResult, { type: 'building' }>) => {
    onChange('');
    setIsOpen(false);
    onSelectBuilding(building);
  };

  const selectActivity = (business: Business) => {
    setIsOpen(false);
    onSelectBusiness?.(business);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchField
        value={value}
        onChange={(nextValue) => {
          onChange(nextValue);
          setIsOpen(Boolean(resolvedZone(nextValue) && nextValue.trim()));
        }}
        onFocus={() => setIsOpen(Boolean(resolvedZone(value) && value.trim()))}
        onSubmit={handleSubmit}
        placeholder="ابحث عن مطعم، صيدلية، أو خدمة..."
        className="w-full"
      />

      {isOpen && value.trim() && (
        <div
          role="listbox"
          aria-label="نتائج البحث"
          className="absolute inset-x-0 top-full z-[1200] mt-2 max-h-[min(60vh,420px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white/98 p-1.5 shadow-xl backdrop-blur-md"
        >
          {isLoading && results.length === 0 && (
            <div className="px-3 py-2 text-xs font-bold text-slate-500" role="status">
              جاري البحث...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="px-3 py-2 text-xs font-bold text-slate-500">لا توجد نتائج</div>
          )}

          {buildings.length > 0 && (
            <div>
              <div className="px-3 pb-1 pt-1.5 text-caption font-extrabold text-amber-800">المباني</div>
              {buildings.map((result) => (
                <button
                  key={`building-${result.zoneLetter}-${result.buildingNumber}`}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectBuilding(result)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-800">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-slate-900">
                      عمارة رقم {result.buildingNumber}
                    </span>
                    <span className="mt-0.5 block truncate text-caption font-bold text-slate-500">
                      {result.zoneName}
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-caption font-extrabold text-amber-900">
                    مبنى
                  </span>
                </button>
              ))}
            </div>
          )}

          {activities.length > 0 && (
            <div className={buildings.length > 0 ? 'mt-1 border-t border-slate-100 pt-1' : ''}>
              <div className="px-3 pb-1 pt-1.5 text-caption font-extrabold text-emerald-800">الأنشطة</div>
              {activities.map((result) => (
                <button
                  key={`business-${result.business.id}`}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectActivity(result.business)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Store className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-slate-900">
                      {result.business.nameAr}
                    </span>
                    <span className="mt-0.5 block truncate text-caption font-bold text-slate-500">
                      {result.business.category || result.business.street || (resolvedZone(value) ? `منطقة ${resolvedZone(value)}` : '')}
                    </span>
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-caption font-extrabold text-emerald-900">
                    نشاط
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
