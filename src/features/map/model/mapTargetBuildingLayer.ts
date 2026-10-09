import { createBuildingPinHtml } from '../badgeMarkers';

export interface TargetBuildingData {
  zoneLetter?: string;
  buildingNumber?: string;
  lat?: number;
  lng?: number;
}

export function renderTargetBuildingMarker(
  targetLayer: any,
  targetBuilding: TargetBuildingData | null,
  showTargetPin: boolean,
  onSelectBuilding?: (b: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void
): string | null {
  if (!targetLayer || !window.L) return null;
  targetLayer.clearLayers();

  if (!targetBuilding || !showTargetPin || typeof targetBuilding.lat !== 'number' || typeof targetBuilding.lng !== 'number') {
    return null;
  }

  const bldgNum = targetBuilding.buildingNumber || '1';
  const zoneLet = targetBuilding.zoneLetter || '';
  const bldgLabel = bldgNum ? `عمارة ${bldgNum}` : 'المبنى المحدد';

  const bldgPin = createBuildingPinHtml(bldgLabel, zoneLet ? `منطقة ${zoneLet}` : undefined);

  const bldgIcon = window.L.divIcon({
    className: 'custom-precision-building-pin',
    html: bldgPin.html,
    iconSize: bldgPin.iconSize,
    iconAnchor: bldgPin.iconAnchor,
  });
  const marker = window.L.marker([targetBuilding.lat, targetBuilding.lng], {
    icon: bldgIcon,
    pane: 'pinsPane',
    zIndexOffset: 2000,
  });

  marker.on('click', () => {
    if (onSelectBuilding) {
      onSelectBuilding({
        buildingNumber: bldgNum,
        zoneLetter: zoneLet,
        lat: targetBuilding.lat!,
        lng: targetBuilding.lng!,
      });
    }
  });

  targetLayer.addLayer(marker);

  return `${zoneLet}_${bldgNum}_${targetBuilding.lat}_${targetBuilding.lng}`;
}
