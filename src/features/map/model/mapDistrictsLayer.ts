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

  const worldRing: [number, number][] = [
    [35.0, 25.0],
    [35.0, 37.0],
    [25.0, 37.0],
    [25.0, 25.0],
  ];

  const mask = window.L.polygon([worldRing], {
    pane: 'maskPane',
    stroke: false,
    fillColor: '#090d16',
    fillOpacity: 0.0,
    fillRule: 'evenodd',
    interactive: false,
    className: 'hadayek-spotlight-focus-mask',
  });
  districtsLayer.addLayer(mask);

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
        event.originalEvent?.stopPropagation?.();
        onSelectDistrict(district.letterAr);
      });

      districtsLayer.addLayer(polygon);
      let label: any;
      if (!labeled.has(district.letterAr)) {
        labeled.add(district.letterAr);
        const [lat, lng] = getDistrictLabelPosition(district);
        label = window.L.marker([lat, lng], {
          pane: 'districtLabelsPane',
          interactive: false,
          keyboard: false,
          icon: window.L.divIcon({
            className: 'hadayek-district-label',
            html: `<span>${district.letterAr}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
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
  mask?.setStyle({ fillOpacity: 0 });

  polygons.forEach(({ letterAr, polygon, label }) => {
    const isSelected = shouldHighlight && letterAr === zoneLetter;
    const path = polygon.getElement?.();

    if (isSelected) {
      polygon.setStyle({
        color: '#334155',
        weight: 2,
        opacity: 1,
        fillOpacity: 0,
      });
      if (path) path.classList.add('selected-district-polygon-focus');
    } else {
      polygon.setStyle({
        color: '#334155',
        weight: 0,
        opacity: 0,
        fillOpacity: 0,
      });
      if (path) path.classList.remove('selected-district-polygon-focus');
    }
    label?.setOpacity(1);
  });
}
