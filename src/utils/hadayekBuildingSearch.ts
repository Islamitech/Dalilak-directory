import { Business } from '../types';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import {
  searchBuildingCoordinatesExact,
  getHadayekZone,
  getRecommendedGateForZone,
  calculateDirectDistanceMeters,
  formatHadayekDistance,
} from '../data/hadayekAtlasData';
import { isBusinessInHadayekZone } from './hadayekZoneHelper';

export interface BuildingSearchResult {
  type: 'building';
  buildingNumber: string;
  zoneLetter: string;
  zoneName: string;
  lat: number;
  lng: number;
  nearestGateName: string;
  distanceFromZoneCenter?: string;
  associatedBusinessesCount?: number;
}

export interface BusinessZoneSearchResult {
  type: 'business';
  business: Business;
}

export type ZoneScopedSearchResult = BuildingSearchResult | BusinessZoneSearchResult;

let cachedKeys: string[] | null = null;
async function getBuildingKeys(): Promise<string[]> {
  if (cachedKeys) return cachedKeys;
  try {
    const mod = await import('../data/hadayekBuildingsCoords.json');
    const db = (mod as any).default || mod;
    cachedKeys = Object.keys(db);
    return cachedKeys;
  } catch {
    return [];
  }
}

/**
 * Perform high-performance scoped search within a specific Hadayek Al-Ahram zone
 */
export function normalizeBuildingQuery(query: string): string {
  return query.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x6f0)).trim().toLowerCase();
}

export async function searchInsideHadayekZone(
  zoneLetter: string,
  query: string,
  allBusinesses: Business[],
  maxResults: number = 8
): Promise<ZoneScopedSearchResult[]> {
  if (!zoneLetter || !query || query.trim().length === 0) return [];

  const cleanQuery = normalizeBuildingQuery(query);
  const results: ZoneScopedSearchResult[] = [];
  const zone = getHadayekZone(zoneLetter);
  const zoneName = zone ? zone.nameAr : `منطقة ${zoneLetter}`;
  const gateInfo = getRecommendedGateForZone(zoneLetter);
  const nearestGateName = gateInfo.primaryGate.popularNameAr;

  // 1. Check for building numbers (digits matching in query)
  const digitMatch = cleanQuery.match(/\d+/);
  if (digitMatch) {
    const digitQuery = digitMatch[0];
    const allKeys = await getBuildingKeys();

    // Priority 1: Exact digit match
    const candidateNumbers: string[] = [];
    if (allKeys.includes(digitQuery)) {
      candidateNumbers.push(digitQuery);
    }

    // Priority 2: Starts with or contains digit
    for (const k of allKeys) {
      if (candidateNumbers.length >= 6) break;
      if (k !== digitQuery && (k.startsWith(digitQuery) || k === digitQuery)) {
        if (!candidateNumbers.includes(k)) {
          candidateNumbers.push(k);
        }
      }
    }

    // Fallback if no exact key in DB, still add the user's requested number as candidate
    if (!candidateNumbers.includes(digitQuery)) {
      candidateNumbers.unshift(digitQuery);
    }

    for (const bldgNum of candidateNumbers.slice(0, 5)) {
      const coords = await searchBuildingCoordinatesExact(zoneLetter, bldgNum);
      if (!coords) {
        // Unknown building: do not fabricate or estimate fake coordinates
        continue;
      }

      // Count registered businesses at this building
      const associatedBiz = allBusinesses.filter(
        (b) =>
          isBusinessInHadayekZone(b, zoneLetter) &&
          isBusinessAssociatedWithBuilding(b, bldgNum, zoneLetter, coords)
      );

      results.push({
        type: 'building',
        buildingNumber: bldgNum,
        zoneLetter,
        zoneName,
        lat: coords.lat,
        lng: coords.lng,
        nearestGateName,
        associatedBusinessesCount: associatedBiz.length,
      });
    }
  }

  // 2. Search businesses inside this zone
  const matchingBiz = allBusinesses
    .filter((b) => isBusinessInHadayekZone(b, zoneLetter))
    .filter((b) => {
      const name = (b.nameAr || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();
      const street = (b.street || '').toLowerCase();
      return name.includes(cleanQuery) || cat.includes(cleanQuery) || street.includes(cleanQuery);
    })
    .slice(0, maxResults - results.length);

  for (const b of matchingBiz) {
    results.push({
      type: 'business',
      business: b,
    });
  }

  return results;
}

export interface ParsedHadayekBuilding {
  buildingNumber: string;
  zoneLetter: string;
}

/** Exact building association from address fields only; business names are not location data. */
export function isBusinessAssociatedWithBuilding(
  business: Pick<Business, 'street' | 'landmark' | 'lat' | 'lng'>,
  buildingNumber: string,
  zoneLetter: string,
  buildingCoordinates?: { lat: number; lng: number }
): boolean {
  const parsed = parseHadayekBuildingAddress(`${business.street || ''} ${business.landmark || ''}`, zoneLetter);
  const normalizeZone = (zone: string) => zone.replace(/[أإآ]/g, 'ا').replace(/هـ|ة/g, 'ه').trim();
  const exactAddress = Boolean(parsed && parsed.buildingNumber === normalizeBuildingQuery(buildingNumber) &&
    normalizeZone(parsed.zoneLetter) === normalizeZone(zoneLetter));
  if (exactAddress) return true;

  // Preserve the drawer's documented nearby-activity context using actual coordinates,
  // never accidental number substrings in names or unrelated addresses.
  if (buildingCoordinates && Number.isFinite(business.lat) && Number.isFinite(business.lng)) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const dLat = toRadians(buildingCoordinates.lat - business.lat);
    const dLng = toRadians(buildingCoordinates.lng - business.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(business.lat)) * Math.cos(toRadians(buildingCoordinates.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 90;
  }
  return false;
}

export const HADAYEK_ZONE_LETTERS = [
  'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ك', 'ل', 'م', 'ن', 'س', 'ص', 'ع'
] as const;

export type HadayekZoneLetter = typeof HADAYEK_ZONE_LETTERS[number];

export function normalizeHadayekZoneLetter(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\u0640/g, '').trim();
  if (cleaned === 'ا' || cleaned === 'أ' || cleaned === 'إ' || cleaned === 'آ') return 'أ';
  if (cleaned === 'ه' || cleaned === 'ة') return 'هـ';
  if (HADAYEK_ZONE_LETTERS.includes(cleaned as any)) return cleaned;
  if (raw.trim() === 'هـ') return 'هـ';
  return null;
}

export const CONFIRMED_BUILDING_FILLER_WORDS = new Set([
  'عمارة', 'عماره', 'مبنى', 'مبني', 'منطقة', 'منطقه'
]);

export function parseHadayekBuildingAddress(raw: string, currentZone?: string): ParsedHadayekBuilding | null {
  if (!raw || !raw.trim()) return null;

  // 1. Normalize digits & separators & split glued digits/letters
  const s = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[-_/\\]+/g, ' ')
    .replace(/([0-9])([^\s0-9])/g, '$1 $2')
    .replace(/([^\s0-9])([0-9])/g, '$1 $2')
    .trim()
    .toLowerCase();

  // 2. Must contain digits (never trigger building search on words alone)
  const digitMatch = s.match(/\d+/);
  if (!digitMatch) return null;
  const bldgNum = digitMatch[0];

  // 3. Remove digits and collect remaining word tokens (strip tatweel per token)
  const words = s
    .replace(/\d+/, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/\u0640/g, '').trim())
    .filter((w) => Boolean(w) && !CONFIRMED_BUILDING_FILLER_WORDS.has(w));

  // 4. If no words remain, use currentZone if selected
  if (words.length === 0) {
    if (currentZone && currentZone !== 'all' && currentZone.trim()) {
      const normCur = normalizeHadayekZoneLetter(currentZone);
      if (normCur) return { buildingNumber: bldgNum, zoneLetter: normCur };
    }
    return null;
  }

  // 5. Must have exactly one zone token
  if (words.length === 1) {
    const matchedZone = normalizeHadayekZoneLetter(words[0]);
    if (matchedZone) {
      return { buildingNumber: bldgNum, zoneLetter: matchedZone };
    }
  }

  return null;
}

