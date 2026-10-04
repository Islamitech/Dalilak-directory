import React from 'react';
import { MapPin, Compass, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';

interface NavigationOriginSelectorProps {
  originType: 'gps' | 'gate' | 'custom';
  setOriginType: (type: 'gps' | 'gate') => void;
  selectedGateId: string;
  setSelectedGateId: (id: string) => void;
  isGettingGps: boolean;
  gpsError: string | null;
  gpsCoords: { lat: number; lng: number } | null;
  onFetchGps: () => void;
}

export const NavigationOriginSelector: React.FC<NavigationOriginSelectorProps> = ({
  originType,
  setOriginType,
  selectedGateId,
  setSelectedGateId,
  isGettingGps,
  gpsError,
  gpsCoords,
  onFetchGps,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-700 block">
        نقطة الانطلاق (البداية):
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setOriginType('gps');
            if (!gpsCoords) onFetchGps();
          }}
          className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            originType === 'gps'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm ring-1 ring-emerald-400'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {isGettingGps ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <MapPin className="w-4 h-4 text-emerald-600" />
          )}
          <span>موقعي الحالي (GPS)</span>
        </button>

        <button
          type="button"
          onClick={() => setOriginType('gate')}
          className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            originType === 'gate'
              ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-400'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-600" />
          <span>نقطة يدوية (بوابة)</span>
        </button>
      </div>

      {originType === 'gate' && (
        <div className="mt-2 relative">
          <select
            value={selectedGateId}
            onChange={(e) => setSelectedGateId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl ps-3 pe-8 py-2.5 outline-none cursor-pointer"
            style={{ colorScheme: 'light' }}
          >
            {HADAYEK_OFFICIAL_GATES.map((gate) => (
              <option key={gate.id} value={gate.id}>
                🚪 {gate.nameAr} - {gate.accessRoadAr.split('/')[0]}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute end-2.5 top-3 pointer-events-none" />
        </div>
      )}

      {originType === 'gps' && gpsError && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}
    </div>
  );
};
