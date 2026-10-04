import React, { useState, useMemo } from 'react';
import { Business } from '../../types';
import { InteractiveMap } from '../InteractiveMap';
import { MOCK_SANDBOX_BUSINESSES, MOCK_PRESETS } from '../../data/mockData';
import { getHadayekZone, estimateBuildingCoordinates } from '../../data/hadayekAtlasData';
import { MapSandboxHeader } from '../../features/map';

export interface MapSandboxViewProps {
  onNavigate?: (path: string) => void;
}

export const MapSandboxView: React.FC<MapSandboxViewProps> = ({ onNavigate }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('full');
  const [selectedMapBiz, setSelectedMapBiz] = useState<Business | null>(null);
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>('ج');
  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>('');

  const currentBusinesses = useMemo(() => {
    const preset = MOCK_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.data : MOCK_SANDBOX_BUSINESSES;
  }, [selectedPresetId]);

  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    const coords = estimateBuildingCoordinates(zone.letterAr, activeBuildingNumber);
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: coords.lat,
      lng: coords.lng,
      coords: { lat: coords.lat, lng: coords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-20" dir="rtl">
      <MapSandboxHeader
        onNavigate={onNavigate}
        selectedPresetId={selectedPresetId}
        setSelectedPresetId={setSelectedPresetId}
        activeBuildingNumber={activeBuildingNumber}
        setActiveBuildingNumber={setActiveBuildingNumber}
        activeZoneLetter={activeZoneLetter}
        setActiveZoneLetter={setActiveZoneLetter}
      />

      <div className="relative w-full h-[620px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700">
        <InteractiveMap
          businesses={currentBusinesses}
          selectedZone={activeZoneLetter}
          targetBuilding={targetBuilding}
          onSelectBusiness={(b) => setSelectedMapBiz(b)}
          onSelectBuilding={(bldg) => {
            setActiveZoneLetter(bldg.zoneLetter);
            setActiveBuildingNumber(bldg.buildingNumber);
          }}
          onClearBuilding={() => setActiveBuildingNumber('')}
          heightClass="h-full"
          defaultExpanded={true}
        />
      </div>

      {selectedMapBiz && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs space-y-1 text-slate-300">
          <p className="font-bold text-white">النشاط المحدد في الساندبوكس: {selectedMapBiz.nameAr}</p>
          <p>الفئة: {selectedMapBiz.category} | العنوان: {selectedMapBiz.street || 'غير محدد'}</p>
        </div>
      )}
    </div>
  );
};
