import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Business } from '../../types';
import { normalizeBuildingQuery } from '../../utils/hadayekBuildingSearch';
import { getDistrictByLetter, isPointInPolygon } from '../../data/hadayekDistrictsGeoData';
import { SearchField } from '../../shared/ui';

export interface ZoneScopedSearchBarProps {
  selectedZone: string;
  businesses: Business[];
  selectedBuilding?: { buildingNumber: string; zoneLetter: string } | null;
  onSelectBuilding: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  onSelectBusiness: (biz: Business) => void;
  onClearBuilding?: () => void;
  onClearZone?: () => void;
}

export const ZoneScopedSearchBar: React.FC<ZoneScopedSearchBarProps> = ({ selectedZone, onSelectBuilding, onClearBuilding }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const requestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestRef.current++;
    setQuery(''); setMessage(''); setLoading(false);
    return () => { requestRef.current++; };
  }, [selectedZone]);

  const submit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const number = normalizeBuildingQuery(query);
    if (!/^\d+$/.test(number)) { setMessage('اكتب رقم العمارة فقط.'); return; }
    const request = ++requestRef.current;
    setLoading(true); setMessage('');
    try {
      const { default: database } = await import('../../data/hadayekBuildingsCoords.json');
      if (request !== requestRef.current) return;
      const district = getDistrictByLetter(selectedZone);
      const records = (database as Record<string, Array<{lat: number; lng: number}>>)[String(Number(number))] || [];
      const matches = records.filter(p => district?.polygons.some(ring => isPointInPolygon(p.lat, p.lng, ring)));
      const unique = matches.filter((p, i) => matches.findIndex(q => q.lat === p.lat && q.lng === p.lng) === i);
      if (unique.length !== 1) {
        setMessage(unique.length ? 'يوجد أكثر من موقع بهذا الرقم؛ تعذّر تحديد مبنى واحد بدقة.' : `لم نجد موقعاً مؤكداً للعمارة ${number} في منطقة ${selectedZone}. تأكد من الرقم والمنطقة.`);
        return;
      }
      onSelectBuilding({ buildingNumber: String(Number(number)), zoneLetter: selectedZone, ...unique[0] });
      inputRef.current?.blur();
    } catch { if (request === requestRef.current) setMessage('تعذّر تحميل بيانات المباني. حاول مجدداً.'); }
    finally { if (request === requestRef.current) setLoading(false); }
  };

  if (!selectedZone || selectedZone === 'all') return null;

  return (
    <div dir="rtl" className="w-full font-['Cairo',sans-serif]">
      <form onSubmit={submit} className="flex min-w-0 items-center gap-1">
        <SearchField
          ref={inputRef}
          inputMode="numeric"
          aria-label={`رقم العمارة في منطقة ${selectedZone}`}
          placeholder="رقم المبنى"
          value={query}
          onChange={(val) => { requestRef.current++; setLoading(false); setQuery(val); setMessage(''); }}
          onClear={() => { requestRef.current++; setLoading(false); setQuery(''); setMessage(''); }}
          onSubmit={() => submit()}
          className="flex-1"
          inputClassName="!h-9 !text-sm text-slate-800 !rounded-xl"
          icon={<Search size={14} className="text-amber-600" />}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          aria-label="اذهب إلى المبنى"
          className="h-9 w-8 shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </form>
      {message && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-1.5 mt-1 animate-fade-in">
          {message}
        </div>
      )}
    </div>
  );
};
