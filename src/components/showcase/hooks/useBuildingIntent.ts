import { useEffect, useMemo, useState } from 'react';
import { parseHadayekBuildingAddress, type ParsedHadayekBuilding } from '../../../utils/hadayekBuildingSearch';
import { searchBuildingCoordinatesExact } from '../../../shared/data/hadayek/hadayekGeo';

export interface BuildingCoords {
  lat: number;
  lng: number;
}

export interface BuildingIntentState {
  buildingIntent: ParsedHadayekBuilding | null;
  buildingCoords: BuildingCoords | null;
}

const toIntentKey = (intent: ParsedHadayekBuilding | null): string | null =>
  intent ? `${intent.zoneLetter}|${intent.buildingNumber}` : null;

/** Building-number query intent shared by the activity list, the map pins and the building card. */
export function useBuildingIntent(query: string, zone?: string): BuildingIntentState {
  const buildingIntent = useMemo(
    () => parseHadayekBuildingAddress(query || '', zone),
    [query, zone]
  );

  const [coordsState, setCoordsState] = useState<{ key: string; coords: BuildingCoords | null } | null>(null);

  useEffect(() => {
    const key = toIntentKey(buildingIntent);
    if (!key || !buildingIntent) {
      setCoordsState(null);
      return;
    }
    let cancelled = false;
    searchBuildingCoordinatesExact(buildingIntent.zoneLetter, buildingIntent.buildingNumber).then((coords) => {
      if (!cancelled) setCoordsState({ key, coords });
    });
    return () => {
      cancelled = true;
    };
  }, [buildingIntent]);

  const currentKey = toIntentKey(buildingIntent);
  const buildingCoords =
    coordsState && currentKey && coordsState.key === currentKey ? coordsState.coords : null;

  return { buildingIntent, buildingCoords };
}
