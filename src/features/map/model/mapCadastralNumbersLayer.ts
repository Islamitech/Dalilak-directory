import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../shared/data/hadayek/hadayekDistrictsGeoData';
import { loadHadayekZoneBuildings } from '../../../shared/data/hadayek/hadayekGeo';
import { escapeHtml } from './mapMarkerHtml';

export interface CadastralNumbersParams {
  map: any;
  cadastralLayer: any;
  zoom: number;
  activeZone?: string;
  onSelectBuilding?: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
}

export const CADASTRAL_NUMBERS_MIN_ZOOM = 17.5;
const MAX_VISIBLE_BUILDINGS = 50;

interface CadastralLayerState {
  markers: Map<string, any>;
  syncId: number;
}

function getCadastralLayerState(layer: any): CadastralLayerState {
  if (!layer._cadastralState) {
    layer._cadastralState = {
      markers: new Map<string, any>(),
      syncId: 0,
    };
  }
  return layer._cadastralState;
}

/**
 * Resolves which Hadayek zones intersect or lie closest to the visible bounds at street zoom.
 */
function resolveVisibleZones(map: any, activeZone?: string): string[] {
  const center = map?.getCenter?.();
  if (activeZone && activeZone !== 'all' && activeZone.trim()) {
    const primary = activeZone.trim();
    if (!center) return [primary];
    const sorted = [...HADAYEK_OFFICIAL_DISTRICTS]
      .filter((d) => d.letterAr !== primary)
      .sort((a, b) => {
        const distA = Math.hypot(a.centerLat - center.lat, a.centerLng - center.lng);
        const distB = Math.hypot(b.centerLat - center.lat, b.centerLng - center.lng);
        return distA - distB;
      });
    return [primary, ...sorted.slice(0, 1).map((d) => d.letterAr)];
  }

  if (!center) return ['أ'];

  // Find nearest district centroids
  const sorted = [...HADAYEK_OFFICIAL_DISTRICTS].sort((a, b) => {
    const distA = Math.hypot(a.centerLat - center.lat, a.centerLng - center.lng);
    const distB = Math.hypot(b.centerLat - center.lat, b.centerLng - center.lng);
    return distA - distB;
  });

  return sorted.slice(0, 3).map((d) => d.letterAr);
}

/**
 * Synchronizes the street-level cadastral building numbers layer.
 * Only activates at zoom >= 17.5 to avoid map clutter and retain 60 FPS.
 */
export async function syncCadastralNumbersLayer(params: CadastralNumbersParams): Promise<void> {
  const { map, cadastralLayer, zoom, activeZone, onSelectBuilding } = params;
  if (!cadastralLayer || !map || !window.L) return;

  const state = getCadastralLayerState(cadastralLayer);
  const syncId = ++state.syncId;
  const activeMarkers = state.markers;

  if (zoom < CADASTRAL_NUMBERS_MIN_ZOOM) {
    if (activeMarkers.size > 0) {
      cadastralLayer.clearLayers();
      activeMarkers.clear();
    }
    return;
  }

  const zonesToLoad = resolveVisibleZones(map, activeZone);
  const rawBounds = map.getBounds?.();
  const bounds = rawBounds?.pad ? rawBounds.pad(0.08) : rawBounds;
  if (!bounds) return;

  const candidateBuildings: Array<{ buildingNumber: string; zoneLetter: string; lat: number; lng: number }> = [];

  for (const zone of zonesToLoad) {
    try {
      const records = await loadHadayekZoneBuildings(zone);
      if (syncId !== state.syncId) return; // Discard stale in-flight results
      if (!records) continue;

      for (const [bldgNum, coords] of Object.entries(records)) {
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const [lat, lng] = coords;
        let isInside = false;
        try {
          if (typeof bounds?.contains === 'function') {
            isInside = Boolean(bounds.contains([lat, lng]) || (bounds as any).contains(lat, lng));
          }
        } catch {
          try {
            isInside = Boolean((bounds as any).contains(lat, lng));
          } catch {}
        }

        if (isInside) {
          candidateBuildings.push({ buildingNumber: bldgNum, zoneLetter: zone, lat, lng });
          if (candidateBuildings.length >= MAX_VISIBLE_BUILDINGS) break;
        }
      }
    } catch {
      // Non-fatal: zone coordinates may not be present in offline/limited mode
    }
    if (candidateBuildings.length >= MAX_VISIBLE_BUILDINGS) break;
  }

  if (syncId !== state.syncId) return;

  const nextKeys = new Set<string>();

  candidateBuildings.forEach(({ buildingNumber, zoneLetter, lat, lng }) => {
    const key = `${zoneLetter}:${buildingNumber}`;
    nextKeys.add(key);

    if (activeMarkers.has(key)) return;

    const safeNum = escapeHtml(buildingNumber);
    const safeZone = escapeHtml(zoneLetter);

    const badgeHtml = `
      <div style="font-family:Cairo,sans-serif;font-weight:700;font-size:10px;background:rgba(255,255,255,0.92);color:#334155;border:1px solid #cbd5e1;border-radius:4px;padding:0 3px;box-shadow:0 1px 2px rgba(0,0,0,0.06);white-space:nowrap;user-select:none;cursor:pointer;line-height:16px;text-align:center;" title="عمارة ${safeNum} - منطقة ${safeZone}">
        ${safeNum}
      </div>
    `;

    const icon = window.L.divIcon({
      className: 'custom-cadastral-pin',
      html: badgeHtml,
      iconSize: [28, 16],
      iconAnchor: [14, 8],
    });

    const marker = window.L.marker([lat, lng], {
      icon,
      pane: 'cadastralPane',
      interactive: true,
      keyboard: false,
      zIndexOffset: 300,
    });

    marker.on('click', (e: any) => {
      e?.originalEvent?.stopPropagation?.();
      onSelectBuilding?.({ buildingNumber, zoneLetter, lat, lng });
    });

    cadastralLayer.addLayer(marker);
    activeMarkers.set(key, marker);
  });

  // Prune markers no longer in visible bounds
  activeMarkers.forEach((marker, key) => {
    if (!nextKeys.has(key)) {
      cadastralLayer.removeLayer(marker);
      activeMarkers.delete(key);
    }
  });
}
