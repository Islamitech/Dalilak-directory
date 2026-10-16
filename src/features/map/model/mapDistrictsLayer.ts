import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../shared/data/hadayek/hadayekDistrictsGeoData';
import { getDistrictLabelPosition } from '../utils/districtLabelPosition';

export interface DistrictPolygonItem {
  letterAr: string;
  polygon: any;
  color: string;
  label?: any;
}

export function buildDistrictsLayer(
  districtsLayer: any,
  onSelectDistrict: (letter: string) => void
): { polygons: DistrictPolygonItem[]; mask: any } {
  if (!districtsLayer || !window.L) return { polygons: [], mask: null };

  districtsLayer.clearLayers();
  const polygons: DistrictPolygonItem[] = [];
  const labeled = new Set<string>();
  const mask = null;

  HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
    district.polygons.forEach((polyCoords) => {
      const polygon = window.L.polygon(polyCoords, {
        pane: 'districtsPane',
        color: '#334155',
        weight: 0,
        opacity: 0,
        fillColor: '#334155',
        fillOpacity: 0,
        className: 'hadayek-district-polygon',
      });

      polygon.on('click', (event: { originalEvent?: Event }) => {
        if (event.originalEvent) {
          event.originalEvent.stopPropagation?.();
          (event.originalEvent as any)._stopped = true;
        }
        if (window.L?.DomEvent?.stopPropagation) {
          window.L.DomEvent.stopPropagation(event);
        }
        onSelectDistrict(district.letterAr);
      });

      districtsLayer.addLayer(polygon);
      let label: any;
      if (!labeled.has(district.letterAr)) {
        labeled.add(district.letterAr);
        const [lat, lng] = getDistrictLabelPosition(district);
        label = window.L.marker([lat, lng], {
          pane: 'districtLabelsPane',
          interactive: true,
          keyboard: false,
          icon: window.L.divIcon({
            className: 'hadayek-district-label',
            html: `<span>${district.letterAr}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        });
        label.on('click', (event: { originalEvent?: Event }) => {
          if (event.originalEvent) {
            event.originalEvent.stopPropagation?.();
            (event.originalEvent as any)._stopped = true;
          }
          if (window.L?.DomEvent?.stopPropagation) {
            window.L.DomEvent.stopPropagation(event);
          }
          onSelectDistrict(district.letterAr);
        });
        districtsLayer.addLayer(label);
      }
      polygons.push({ letterAr: district.letterAr, polygon, color: district.color, label });
    });
  });

  return { polygons, mask };
}

export function updateDistrictHighlightStyles(
  polygons: DistrictPolygonItem[],
  mask: any,
  zoneLetter: string,
  shouldHighlight: boolean
) {
  if (mask?.setStyle) mask.setStyle({ fillOpacity: 0 });

  polygons.forEach(({ letterAr, polygon, color, label }) => {
    const isSelected = shouldHighlight && letterAr === zoneLetter;
    const path = polygon.getElement?.();
    const labelEl = label?.getElement?.();

    if (isSelected) {
      polygon.setStyle({
        color: color || '#d97706',
        weight: 2.5,
        opacity: 0.95,
        fillColor: color || '#d97706',
        fillOpacity: 0.12,
      });
      if (path) path.classList.add('selected-district-polygon-focus');
      if (labelEl) labelEl.classList.add('selected-district-label-focus');
    } else {
      polygon.setStyle({
        color: '#334155',
        weight: 0,
        opacity: 0,
        fillColor: '#334155',
        fillOpacity: 0,
      });
      if (path) path.classList.remove('selected-district-polygon-focus');
      if (labelEl) labelEl.classList.remove('selected-district-label-focus');
    }
    label?.setOpacity(1);
  });
}
