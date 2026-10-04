import { escapeHtml } from './mapMarkerHtml';

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

  const bldgHtml = `
    <style>
      @keyframes target-building-pulse {
        0% { transform: scale(0.55); opacity: 0.75; }
        70% { transform: scale(2.1); opacity: 0; }
        100% { transform: scale(2.1); opacity: 0; }
      }
      .target-building-pulse-ring {
        position: absolute;
        inset-inline-start: 50%;
        top: 50%;
        width: 26px;
        height: 26px;
        margin: -13px 0 0 -13px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.4);
        animation: target-building-pulse 1.6s ease-out infinite;
        pointer-events: none;
      }
    </style>
    <div style="position: relative; width: 140px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; user-select: none; font-family: 'Cairo', sans-serif; pointer-events: auto;">
      <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #ef4444; border-radius: 9999px; padding: 3px 9px; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 10px rgba(239,68,68,0.4); white-space: nowrap; margin-bottom: 2px;">
        <span style="font-size: 11px;">🏢</span>
        <span style="color: #ffffff; font-weight: 800; font-size: 11px;">${escapeHtml(bldgLabel)}</span>
        ${zoneLet ? `<span style="color: #cbd5e1; font-weight: 700; font-size: 9px; border-inline-end: 1px solid #475569; padding-inline-end: 4px; margin-inline-end: 2px;">منطقة ${escapeHtml(zoneLet)}</span>` : ''}
      </div>
      <div style="width: 2px; height: 8px; background: #ef4444; box-shadow: 0 0 4px #ef4444;"></div>
      <div style="position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <div class="target-building-pulse-ring"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 8px #ef4444, 0 0 0 2px rgba(239, 68, 68, 0.35); position: relative;"></div>
      </div>
    </div>
  `;

  const bldgIcon = window.L.divIcon({
    className: 'custom-precision-building-pin',
    html: bldgHtml,
    iconSize: [140, 50],
    iconAnchor: [70, 50],
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
