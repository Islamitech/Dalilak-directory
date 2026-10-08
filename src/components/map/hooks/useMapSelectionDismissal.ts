import { useEffect } from 'react';
import { Business } from '../../../types';

interface MapInstanceLike {
  leafletMapRef: { current: any };
  isMapReady: boolean;
}

export function useMapSelectionDismissal(
  mode: 'picker' | 'view',
  mapInstance: MapInstanceLike,
  selectedBusiness: Business | null,
  setSelectedBusiness: (business: Business | null) => void,
  onClearFocusedBusiness?: () => void,
) {
  useEffect(() => {
    const map = mapInstance.leafletMapRef.current;
    if (mode !== 'view' || !mapInstance.isMapReady || !map || !selectedBusiness) return;

    const clearSelection = () => {
      setSelectedBusiness(null);
      onClearFocusedBusiness?.();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, button, [role="menu"], [role="listbox"], [contenteditable="true"]')
      ) return;
      clearSelection();
    };

    map.on('click', clearSelection);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      map.off('click', clearSelection);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    mode,
    mapInstance.isMapReady,
    selectedBusiness,
    setSelectedBusiness,
    onClearFocusedBusiness,
  ]);
}
