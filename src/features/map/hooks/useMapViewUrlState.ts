import { useState, useEffect, useCallback, useRef } from 'react';
import { Business } from '../../../types';
import { searchBuildingCoordinatesExact } from '../../../shared/data/hadayek/hadayekGeo';

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
      if (buildingSearchReqIdRef.current === currentReqId && coords) {
        setExactBuildingCoords(coords);
      }
    });
  }, [activeZoneLetter, activeBuildingNumber]);

  useEffect(() => {
    if (selectedZone !== undefined) {
      const cleanZone = selectedZone === 'all' ? '' : selectedZone;
      if (cleanZone !== activeZoneLetter) {
        setActiveZoneLetter(cleanZone);
        if (typeof window !== 'undefined') {
          const newUrl = new URL(window.location.href);
          if (cleanZone) newUrl.searchParams.set('zone', cleanZone);
          else newUrl.searchParams.delete('zone');
          newUrl.searchParams.delete('bldg');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
    }
  }, [selectedZone]);

  const selectZone = useCallback((zoneLetter: string) => {
    const nextZone = zoneLetter === 'all' || !zoneLetter ? '' : zoneLetter;
    setActiveZoneLetter(nextZone);
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    onZoneChange?.(nextZone || 'all');
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      if (nextZone) newUrl.searchParams.set('zone', nextZone);
      else newUrl.searchParams.delete('zone');
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [onZoneChange]);

  const clearTarget = useCallback(() => {
    setActiveZoneLetter('');
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    onZoneChange?.('all');
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('zone');
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [onZoneChange]);

  const clearBuilding = useCallback(() => {
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

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
