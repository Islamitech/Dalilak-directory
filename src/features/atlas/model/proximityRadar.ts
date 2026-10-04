import { Business } from '../../../types';
import { HadayekZone, calculateDirectDistanceMeters } from '../../../data/hadayekAtlasData';

export interface NearbyBusinessItem {
  business: Business;
  distanceMeters: number;
  isInSameZone: boolean;
}

export function computeNearbyBusinesses(
  target: { zone: HadayekZone; buildingNumber: string; coords: { lat: number; lng: number } } | null,
  businesses: Business[]
): NearbyBusinessItem[] {
  if (!target) return [];
  const targetLat = target.coords.lat;
  const targetLng = target.coords.lng;
  const zoneLetter = target.zone.letterAr;

  const list = businesses
    .filter((b) => {
      if (b.verificationStatus !== 'verified') return false;
      return typeof b.lat === 'number' && typeof b.lng === 'number' && b.lat > 0 && b.lng > 0;
    })
    .map((b) => {
      const meters = calculateDirectDistanceMeters(targetLat, targetLng, b.lat!, b.lng!);
      const streetLower = (b.street || '').toLowerCase();
      const isInSameZone = streetLower.includes(`منطقة ${zoneLetter}`) || streetLower.includes(zoneLetter);
      return {
        business: b,
        distanceMeters: meters,
        isInSameZone,
      };
    });

  list.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return list;
}

export function extractNearbyCategories(items: NearbyBusinessItem[], max = 6): string[] {
  const set = new Set<string>();
  items.slice(0, 30).forEach((item) => {
    if (item.business.category) set.add(item.business.category);
  });
  return Array.from(set).slice(0, max);
}
