import { calculateDirectDistanceMeters, formatHadayekDistance } from '../../../data/hadayekAtlasData';
import { RealRoadRouteResult } from '../../../utils/hadayekRouting';

export interface NavigationTarget {
  title: string;
  lat: number;
  lng: number;
  type: 'building' | 'business';
  details?: string;
  preferredGateId?: string;
}

export interface RouteStats {
  distanceText: string;
  drivingMinutes: number;
  walkingMinutes: number;
  isRealRoad: boolean;
}

export function computeRouteStats(
  currentOrigin: { lat: number; lng: number } | null,
  target: { lat: number; lng: number } | null,
  realRouteData: RealRoadRouteResult | null
): RouteStats | null {
  if (!currentOrigin || !target) return null;
  if (realRouteData) {
    return {
      distanceText: formatHadayekDistance(realRouteData.distanceMeters),
      drivingMinutes: Math.max(1, Math.round(realRouteData.durationSeconds / 60)),
      walkingMinutes: Math.max(2, Math.round((realRouteData.distanceMeters * 1.05) / ((4.5 * 1000) / 60))),
      isRealRoad: true,
    };
  }

  const directMeters = calculateDirectDistanceMeters(
    currentOrigin.lat,
    currentOrigin.lng,
    target.lat,
    target.lng
  );
  const roadDistanceMeters = Math.round(directMeters * 1.35);
  const drivingMinutes = Math.max(1, Math.round(roadDistanceMeters / ((25 * 1000) / 60)));
  const walkingMinutes = Math.max(2, Math.round((directMeters * 1.25) / ((4.5 * 1000) / 60)));

  return {
    distanceText: formatHadayekDistance(roadDistanceMeters),
    drivingMinutes,
    walkingMinutes,
    isRealRoad: false,
  };
}

/** Hand-off link: Google Maps starts from the device's live position and drives the turn-by-turn guidance. */
export function getGoogleHandoffUrl(destination: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving&dir_action=navigate`;
}

export function getGoogleVoiceNavUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}
