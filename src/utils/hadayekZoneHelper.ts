import { Business } from '../types';
import { findDistrictForCoordinates, HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import { HADAYEK_GATES } from '../data/hadayekAtlasData';
import { CATEGORY_GROUPS } from '../data/mockData';
import { matchesCategoryFilter } from './categoryMatcher';
import { normalizeArabicText } from './arabicSearch';

/**
 * Standardize zone string to extract letter or clean label.
 * e.g., 'منطقة أ' -> 'أ', 'منطقة ل' -> 'ل', 'أ' -> 'أ'
 */
export function extractZoneLetter(zoneInput: string): string {
  if (!zoneInput) return '';
  return zoneInput.replace(/^منطقة\s+/, '').trim();
}

/**
 * Normalize an Arabic letter specifically for zone comparison (أ/إ/آ -> ا, هـ/ة -> ه)
 */
export function normalizeZoneLetter(letter: string): string {
  if (!letter) return '';
  return letter
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/هـ/g, 'ه')
    .trim();
}

/**
 * Determine the official Hadayek zone letter ('أ' - 'ع') for a business.
 * Uses dual-layer detection:
 * 1. GIS Polygon point-in-polygon coordinates check.
 * 2. Street, landmark, address, and title regex pattern matching.
 */
export function getBusinessHadayekZoneLetter(biz: Business): string | null {
  if (!biz) return null;

  // 1. Spatial GIS polygon check if coordinates are within Hadayek
  if (
    typeof biz.lat === 'number' &&
    typeof biz.lng === 'number' &&
    !isNaN(biz.lat) &&
    !isNaN(biz.lng) &&
    biz.lat > 29.93 &&
    biz.lat < 30.01 &&
    biz.lng > 31.06 &&
    biz.lng < 31.13
  ) {
    const district = findDistrictForCoordinates(biz.lat, biz.lng);
    if (district && district.letterAr) {
      return district.letterAr;
    }
  }

  // 2. Comprehensive text search across address, street, landmark, description, name
  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);

  // Check each official district
  for (const district of HADAYEK_OFFICIAL_DISTRICTS) {
    const normLetter = normalizeZoneLetter(district.letterAr);
    // Patterns: "منطقة أ", "قطاع أ", "عمارة 123 أ", "123أ"
    const patterns = [
      new RegExp(`منطقه\\s*${normLetter}\\b`, 'i'),
      new RegExp(`قطاع\\s*${normLetter}\\b`, 'i'),
      new RegExp(`عماره\\s*\\d+\\s*${normLetter}\\b`, 'i'),
      new RegExp(`\\b\\d+\\s*${normLetter}\\b`, 'i'),
    ];

    if (patterns.some((p) => p.test(normCorpus))) {
      return district.letterAr;
    }
  }

  return null;
}

/**
 * Checks whether a business is located within the requested Hadayek Al-Ahram zone filter.
 * Supports:
 * - 'all' -> all businesses in Hadayek
 * - District letters: 'أ', 'ب', 'ل', 'هـ', etc.
 * - District names: 'منطقة أ', 'منطقة ل', etc.
 * - Gate names: 'البوابة الأولى (خفرع)', 'البوابة الثانية (خوفو)', etc.
 * - Arterial streets: 'شارع الجيش', 'شارع الثروة المعدنية', 'شارع الضغط العالي', etc.
 */
export function isBusinessInHadayekZone(biz: Business, zoneFilter: string): boolean {
  if (!biz) return false;
  if (!zoneFilter || zoneFilter === 'all') return true;

  const normFilter = normalizeArabicText(zoneFilter);
  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);

  // 1. Gate Matching
  const gateMatch = HADAYEK_GATES.find(
    (g) =>
      normFilter.includes(normalizeArabicText(g.nameAr)) ||
      normFilter.includes(normalizeArabicText(g.popularNameAr)) ||
      normFilter.includes(normalizeArabicText(g.shortNameAr))
  );

  if (gateMatch) {
    // If the business address directly mentions the gate
    if (
      normCorpus.includes(normalizeArabicText(gateMatch.popularNameAr)) ||
      normCorpus.includes(normalizeArabicText(gateMatch.shortNameAr)) ||
      normCorpus.includes(normalizeArabicText(gateMatch.nameAr))
    ) {
      return true;
    }
    // Or if the business belongs to a zone served by this gate
    const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
    if (
      bizZoneLetter &&
      gateMatch.servedZones.some((z) => normalizeZoneLetter(z) === normalizeZoneLetter(bizZoneLetter))
    ) {
      return true;
    }
    return false;
  }

  // 2. Arterial Street Matching
  if (zoneFilter.startsWith('شارع ') || normFilter.startsWith('شارع ')) {
    return normCorpus.includes(normFilter) || normCorpus.includes(normFilter.replace('شارع ', ''));
  }

  // 3. Alphabetical Zone Matching ('منطقة أ' or 'أ')
  const cleanLetter = extractZoneLetter(zoneFilter);
  const targetNormLetter = normalizeZoneLetter(cleanLetter);

  // Check spatial coordinates first (Authoritative GIS polygon point-in-polygon)
  if (
    typeof biz.lat === 'number' &&
    typeof biz.lng === 'number' &&
    !isNaN(biz.lat) &&
    !isNaN(biz.lng) &&
    biz.lat > 29.93 &&
    biz.lat < 30.01 &&
    biz.lng > 31.06 &&
    biz.lng < 31.13
  ) {
    const district = findDistrictForCoordinates(biz.lat, biz.lng);
    if (district) {
      return normalizeZoneLetter(district.letterAr) === targetNormLetter;
    }
  }

  // Textual regex matching in corpus as fallback only when coordinates are outside known polygons
  const patterns = [
    new RegExp(`منطقه\\s*${targetNormLetter}\\b`, 'i'),
    new RegExp(`قطاع\\s*${targetNormLetter}\\b`, 'i'),
    new RegExp(`عماره\\s*\\d+\\s*${targetNormLetter}\\b`, 'i'),
    new RegExp(`\\b\\d+\\s*${targetNormLetter}\\b`, 'i'),
  ];

  return patterns.some((p) => p.test(normCorpus));
}

/**
 * Filter an array of businesses down to those in a specific Hadayek zone.
 */
export function getBusinessesInZone(businesses: Business[], zoneFilter: string): Business[] {
  if (!businesses || businesses.length === 0) return [];
  if (!zoneFilter || zoneFilter === 'all') return businesses;
  return businesses.filter((b) => isBusinessInHadayekZone(b, zoneFilter));
}

export interface AvailableCategoryItem {
  name: string;
  count: number;
}

export interface AvailableCategoryGroup {
  group: string;
  icon?: string;
  items: AvailableCategoryItem[];
  totalCount: number;
}

/**
 * Calculates dynamically which category groups and specific categories
 * exist among businesses in the given zone.
 * Only returns groups and items with count > 0.
 */
export function getAvailableCategoryGroupsInZone(
  businesses: Business[],
  zoneFilter: string
): AvailableCategoryGroup[] {
  const zoneBusinesses = getBusinessesInZone(businesses, zoneFilter);
  if (zoneBusinesses.length === 0) return [];

  const result: AvailableCategoryGroup[] = [];

  for (const catGroup of CATEGORY_GROUPS) {
    const matchingItems: AvailableCategoryItem[] = [];
    let groupTotalCount = 0;

    // Check count for each specific sub-item
    for (const item of catGroup.items) {
      const count = zoneBusinesses.filter((b) => matchesCategoryFilter(b, item)).length;
      if (count > 0) {
        matchingItems.push({ name: item, count });
      }
    }

    // Check overall group count
    groupTotalCount = zoneBusinesses.filter((b) => matchesCategoryFilter(b, catGroup.group)).length;

    // If at least one item or the group has businesses, include it
    if (groupTotalCount > 0 || matchingItems.length > 0) {
      result.push({
        group: catGroup.group,
        icon: catGroup.icon,
        items: matchingItems,
        totalCount: Math.max(groupTotalCount, matchingItems.reduce((acc, it) => acc + it.count, 0)),
      });
    }
  }

  return result;
}

/**
 * Dynamically filter map quick categories for a given zone.
 */
export function getAvailableQuickCategoriesInZone(
  businesses: Business[],
  zoneFilter: string,
  quickCategories: Array<{ id: string; name: string; icon: string }>
): Array<{ id: string; name: string; icon: string; count: number }> {
  const zoneBusinesses = getBusinessesInZone(businesses, zoneFilter);

  return quickCategories
    .map((cat) => {
      const count = zoneBusinesses.filter((b) => {
        const catLower = (b.category || '').toLowerCase();
        return catLower.includes(cat.id.toLowerCase());
      }).length;
      return { ...cat, count };
    })
    .filter((cat) => cat.count > 0);
}
