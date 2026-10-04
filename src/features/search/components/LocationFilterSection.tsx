import React from 'react';
import { MapPin } from 'lucide-react';
import { EGYPT_GOVERNORATES, HADAYEK_ALAHRAM_ZONES, EGYPT_CITIES_BY_GOV } from '../../../data/mockData';

interface LocationFilterSectionProps {
  selectedGov: string;
  onGovChange: (gov: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
}

export const LocationFilterSection: React.FC<LocationFilterSectionProps> = ({
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
}) => {
  const isHadayek = selectedCity.includes('حدائق الأهرام');
  const availableCities = selectedGov && EGYPT_CITIES_BY_GOV[selectedGov] ? EGYPT_CITIES_BY_GOV[selectedGov] : [];

  return (
    <div className="space-y-2.5">
      <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
        <MapPin className="w-3.5 h-3.5 text-amber-600" />
        <span>المحافظة والمنطقة</span>
      </h4>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-500 block">المحافظة:</label>
        <select
          value={selectedGov}
          onChange={(e) => {
            onGovChange(e.target.value);
            onCityChange('all');
            onZoneChange('all');
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">كل محافظات مصر</option>
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {availableCities.length > 0 && (
        <div className="space-y-1 animate-fade-in">
          <label className="text-[11px] font-bold text-slate-500 block">المدينة / الحي:</label>
          <select
            value={selectedCity}
            onChange={(e) => {
              onCityChange(e.target.value);
              onZoneChange('all');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة مناطق المحافظة</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {isHadayek && (
        <div className="space-y-1 animate-fade-in bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
          <label className="text-[11px] font-bold text-amber-900 block">المنطقة / البوابة (حدائق الأهرام):</label>
          <select
            value={selectedZone}
            onChange={(e) => onZoneChange(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all">كل مناطق حدائق الأهرام</option>
            {HADAYEK_ALAHRAM_ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
