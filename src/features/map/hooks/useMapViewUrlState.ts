import { useState, useEffect, useCallback, useRef } from 'react';
import { Business } from '../../../types';
import { searchBuildingCoordinatesExact } from '../../../shared/data/hadayek/hadayekGeo';

function syncUrlParams(zone: string, bldg: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (zone) url.searchParams.set('zone', zone);
  else url.searchParams.delete('zone');
  if (bldg) url.searchParams.set('bldg', bldg);
  else url.searchParams.delete('bldg');
  window.history.replaceState({}, '', url.toString());
}

export function useMapViewUrlState(
  focusedBusiness?: Business | null,
  selectedZone?: string,
  onZoneChange?: (zone: string) => void
) {
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('zone') || '';
  });

  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('bldg') || '';
  });

  const [exactBuildingCoords, setExactBuildingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const buildingSearchReqIdRef = useRef(0);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveZoneLetter(params.get('zone') || '');
      setActiveBuildingNumber(params.get('bldg') || '');
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  useEffect(() => {
    if (focusedBusiness) {
      setActiveBuildingNumber('');
      setExactBuildingCoords(null);
    }
  }, [focusedBusiness]);

  useEffect(() => {
    if (!activeZoneLetter || !activeBuildingNumber) {
      setExactBuildingCoords(null);
      return;
    }
    const currentReqId = ++buildingSearchReqIdRef.current;
    searchBuildingCoordinatesExact(activeZoneLetter, activeBuildingNumber).then((coords) => {
      if (buildingSearchReqIdRef.current === currentReqId) {
        setExactBuildingCoords(coords || null);
      }
    });
  }, [activeZoneLetter, activeBuildingNumber]);

  useEffect(() => {
    if (selectedZone !== undefined) {
      const cleanZone = selectedZone === 'all' ? '' : selectedZone;
      if (cleanZone !== activeZoneLetter) {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (urlParams?.get('bldg') && urlParams?.get('zone') === activeZoneLetter) return;
        setActiveZoneLetter(cleanZone);
        setActiveBuildingNumber('');
        setExactBuildingCoords(null);
        syncUrlParams(cleanZone, '');
      }
    }
  }, [selectedZone, activeZoneLetter]);

  const selectZone = useCallback((zoneLetter: string) => {
    const nextZone = zoneLetter === 'all' || !zoneLetter ? '' : zoneLetter;
    setActiveZoneLetter(nextZone);
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    onZoneChange?.(nextZone || 'all');
    syncUrlParams(nextZone, '');
  }, [onZoneChange]);

  const clearTarget = useCallback(() => {
    setActiveZoneLetter('');
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    onZoneChange?.('all');
    syncUrlParams('', '');
  }, [onZoneChange]);

  const clearBuilding = useCallback(() => {
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    syncUrlParams(activeZoneLetter, '');
  }, [activeZoneLetter]);

  return {
    activeZoneLetter,
    setActiveZoneLetter,
    activeBuildingNumber,
    setActiveBuildingNumber,
    exactBuildingCoords,
    setExactBuildingCoords,
    selectZone,
    clearTarget,
    clearBuilding,
  };
}
