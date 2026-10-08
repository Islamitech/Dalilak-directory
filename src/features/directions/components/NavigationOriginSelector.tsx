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
      <div className="dl-seg2" role="group" aria-label="نقطة الانطلاق">
        <button
          type="button"
          aria-pressed={originType === 'gps'}
          className="dl-gps"
          onClick={() => {
            setOriginType('gps');
            if (!gpsCoords) onFetchGps();
          }}
        >
          {isGettingGps ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <MapPin className="w-4 h-4 text-emerald-600" />
          )}
          <span>موقعي الحالي</span>
        </button>

        <button type="button" aria-pressed={originType === 'gate'} onClick={() => setOriginType('gate')}>
          <Compass className="w-4 h-4 text-amber-600" />
          <span>من بوابة</span>
        </button>
      </div>

      {originType === 'gate' && (
        <div className="relative">
          <select
            value={selectedGateId}
            onChange={(e) => setSelectedGateId(e.target.value)}
            aria-label="اختر بوابة الانطلاق"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl ps-3 pe-8 py-2.5 min-h-11 outline-none cursor-pointer appearance-none"
            style={{ colorScheme: 'light' }}
          >
            {HADAYEK_OFFICIAL_GATES.map((gate) => (
              <option key={gate.id} value={gate.id}>
                {gate.nameAr}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute end-2.5 top-3.5 pointer-events-none" />
        </div>
      )}

      {originType === 'gps' && gpsError && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-caption font-bold text-amber-900 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}
    </div>
  );
};
