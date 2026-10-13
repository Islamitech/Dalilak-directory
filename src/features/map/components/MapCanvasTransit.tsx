import React from 'react';

export interface MapCanvasTransitProps {
  count: number;
  onOpenList?: () => void;
  filtersActive?: boolean;
  onReset?: () => void;
}

/**
 * Cleaned up to avoid overlapping with FloatingBottomDock.
 * View switching and filtering are handled directly by FloatingBottomDock.
 */
export const MapCanvasTransit: React.FC<MapCanvasTransitProps> = () => {
  return null;
};
