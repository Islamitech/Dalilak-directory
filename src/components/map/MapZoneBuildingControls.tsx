import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { searchBuildingCoordinatesExact } from '../../data/hadayekAtlasData';

export interface MapZoneBuildingControlsProps {
  selectedZone: string;
  onDistrictChange: (letter: string) => void;
  mapInstance?: any;
}

export const MapZoneBuildingControls: React.FC<MapZoneBuildingControlsProps> = ({
  selectedZone,
  onDistrictChange,
  mapInstance,
}) => {
  const [buildingQuery, setBuildingQuery] = useState('');

  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !buildingQuery) return;

    const coords = await searchBuildingCoordinatesExact(selectedZone, buildingQuery);
    if (!coords) return;

    if (mapInstance?.leafletMapRef?.current && window.L) {
      const map = mapInstance.leafletMapRef.current;
      mapInstance?.cameraController?.request(
        { kind: 'flyTo', center: [coords.lat, coords.lng], zoom: 19, options: { duration: 1.0 } },
        'locate'
      );

      const icon = window.L.divIcon({
        className: 'bg-transparent border-0',
        html: `<div class="relative w-8 h-8 flex items-center justify-center">
                 <div class="absolute w-4 h-4 bg-sky-500 rounded-full animate-ping opacity-75"></div>
                 <div class="relative w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg"></div>
                 <div class="absolute top-8 whitespace-nowrap bg-slate-900/90 text-sky-300 font-bold px-2 py-0.5 rounded-md text-caption border border-sky-500/50 shadow-xl">
                    عمارة ${buildingQuery.match(/\d+/) ? buildingQuery.match(/\d+/)[0] : buildingQuery}
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if ((map as any)._lastBuildingMarker) {
        (map as any)._lastBuildingMarker.remove();
      }

      const marker = window.L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      (map as any)._lastBuildingMarker = marker;
    }
  };

  return (
    <>
      {/* 🧭 District Quick-Jump */}
      <div className="relative inline-flex items-center shrink-0">
        <select
          value={selectedZone || ''}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/50 text-amber-300 font-extrabold text-caption sm:text-xs rounded-md px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pe-5 ps-2 transition-colors shadow-xs"
          title="انتقال للمنطقة"
        >
          <option value="">🧭 كل المناطق (أ - ن)</option>
          {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
            <option key={d.id} value={d.letterAr}>
              {d.nameAr}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-amber-400/90 absolute end-1.5 pointer-events-none" />
      </div>

      {/* 🏢 Building Search (Visible if Zone is selected) */}
      {selectedZone && (
        <form onSubmit={handleBuildingSubmit} className="relative inline-flex items-center shrink-0">
          <input
            type="text"
            placeholder="عمارة رقم..."
            value={buildingQuery}
            onChange={(e) => setBuildingQuery(e.target.value)}
            className="bg-slate-800/90 hover:bg-slate-700/90 border border-sky-500/40 text-sky-300 font-bold text-caption sm:text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:border-sky-400 placeholder:text-sky-300/50 w-20 sm:w-24 transition-colors pe-1.5 ps-6"
            title="ابحث برقم العمارة داخل المنطقة المحددة"
          />
          <button
            type="submit"
            className="absolute end-1 text-sky-400 hover:text-sky-300 pointer-events-auto cursor-pointer"
            title="بحث"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </>
  );
};
