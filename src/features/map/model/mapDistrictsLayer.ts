import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../data/hadayekDistrictsGeoData';

export interface DistrictPolygonItem {
  letterAr: string;
  polygon: any;
  color: string;
}

export function buildDistrictsLayer(
  districtsLayer: any,
  onSelectDistrict: (letter: string) => void
): { polygons: DistrictPolygonItem[]; mask: any } {
  if (!districtsLayer || !window.L) return { polygons: [], mask: null };

  districtsLayer.clearLayers();
  const polygons: DistrictPolygonItem[] = [];

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
        color: district.color,
        weight: 0.8,
        opacity: 0.3,
        fillColor: district.color,
        fillOpacity: 0,
        className: 'hadayek-district-polygon',
      });

      polygon.on('click', () => {
        onSelectDistrict(district.letterAr);
      });

      districtsLayer.addLayer(polygon);
      polygons.push({ letterAr: district.letterAr, polygon, color: district.color });
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
  if (mask) {
    if (shouldHighlight) {
      const activeDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === zoneLetter);
      if (activeDistrict && activeDistrict.polygons && activeDistrict.polygons.length > 0) {
        const worldRing: [number, number][] = [
          [35.0, 25.0],
          [35.0, 37.0],
          [25.0, 37.0],
          [25.0, 25.0],
        ];
        mask.setLatLngs([worldRing, ...activeDistrict.polygons]);
        mask.setStyle({ fillOpacity: 0.04 });
      } else {
        mask.setStyle({ fillOpacity: 0.0 });
      }
    } else {
      mask.setStyle({ fillOpacity: 0.0 });
    }
  }

  polygons.forEach(({ letterAr, polygon, color }) => {
    const isSelected = letterAr === zoneLetter;
    const path = polygon.getElement?.();

    if (isSelected) {
      polygon.setStyle({
        color: '#d97706',
        weight: 2.5,
        opacity: 1.0,
        fillColor: '#f59e0b',
        fillOpacity: 0.0,
      });
      if (path) path.classList.add('selected-district-polygon-focus');
    } else {
      polygon.setStyle({
        color,
        weight: 0.8,
        opacity: shouldHighlight ? 0.0 : 0.25,
        fillColor: color,
        fillOpacity: 0,
      });
      if (path) path.classList.remove('selected-district-polygon-focus');
    }
  });
}
