import { Business } from '../types';
import { findDistrictForCoordinates, HADAYEK_OFFICIAL_DISTRICTS } from '../shared/data/hadayek/hadayekDistrictsGeoData';
import { HADAYEK_GATES, getHadayekZone, getRecommendedGateForZone } from '../shared/data/hadayek/hadayekGeo';
import { matchesCategoryFilter } from './categoryMatcher';
import { normalizeArabicText } from '../shared/lib/arabicSearch';
import { isCitywideFilterZoom } from './mapZoomPolicy';

const ZONE_CACHE_LIMIT = 5000;
const businessZoneCache = new Map<string, string | null>();
const reportedZoneConflicts = new Set<string>();

function hasUsableCoordinates(biz: Business): boolean {
  return (
    typeof biz.lat === 'number' &&
    typeof biz.lng === 'number' &&
    Number.isFinite(biz.lat) &&
    Number.isFinite(biz.lng) &&
    biz.lat !== 0 &&
    biz.lng !== 0 &&
    Math.abs(biz.lat) <= 90 &&
    Math.abs(biz.lng) <= 180
  );
}

function getZoneCacheKey(biz: Business): string {
  return [
    biz.id || '',
    biz.lat,
    biz.lng,
    (biz as any).zone || (biz as any).hadayekZone || '',
    biz.city || '',
    biz.street || '',
    biz.landmark || '',
  ].join('|');
}

function rememberBusinessZone(key: string, zone: string | null): string | null {
  if (businessZoneCache.size >= ZONE_CACHE_LIMIT) {
    const oldestKey = businessZoneCache.keys().next().value;
    if (oldestKey !== undefined) businessZoneCache.delete(oldestKey);
  }
  businessZoneCache.set(key, zone);
  return zone;
}

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
 * Tests whether target pattern exists as a distinct token/phrase within normalized text,
 * avoiding ASCII \b bugs and lookbehind compatibility issues.
 * Uses non-capturing groups (?:^|[^ء-يa-zA-Z0-9]) and (?:[^ء-يa-zA-Z0-9]|$)
 */
export function matchArabicWordPattern(text: string, pattern: string): boolean {
  if (!text || !pattern) return false;
  const regex = new RegExp(`(?:^|[^ء-يa-zA-Z0-9])${pattern}(?:[^ء-يa-zA-Z0-9]|$)`, 'i');
  return regex.test(text);
}

/**
 * Determine the official Hadayek zone letter ('أ' - 'ع') for a business.
 * Uses strict hierarchy:
 * 1. Spatial GIS Polygon point-in-polygon check (GPS coordinates) FIRST.
 *    If text declares a different zone than GPS, GPS takes absolute precedence and conflict is logged.
 * 2. Structured field if available (e.g. biz.zone).
 * 3. Text search across street, landmark, city, description, name as last resort fallback.
 */
function maybeReportZoneConflict(biz: Business, districtLetter: string, cacheKey: string): void {
  if (import.meta.env?.VITE_DEBUG_ZONES !== 'true') return;
  const conflictKey = biz.id || biz.nameAr || cacheKey;
  if (reportedZoneConflicts.has(conflictKey)) return;

  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);
  for (const d of HADAYEK_OFFICIAL_DISTRICTS) {
    const normLetter = normalizeZoneLetter(d.letterAr);
    const isTextMatch =
      matchArabicWordPattern(normCorpus, `منطقه\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `قطاع\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `عماره\\s*\\d+\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `\\d+\\s*${normLetter}`);

    if (isTextMatch && normalizeZoneLetter(d.letterAr) !== normalizeZoneLetter(districtLetter)) {
      reportedZoneConflicts.add(conflictKey);
      console.warn(
        `[Zone Conflict] Business "${biz.nameAr || biz.id}" text mentions zone "${d.letterAr}", but exact GPS coordinates (${biz.lat}, ${biz.lng}) place it in official district "${districtLetter}". Enforcing GPS.`
      );
      break;
    }
  }
}

export function getBusinessHadayekZoneLetter(biz: Business): string | null {
  if (!biz) return null;

  const cacheKey = getZoneCacheKey(biz);
  if (businessZoneCache.has(cacheKey)) {
    const cached = businessZoneCache.get(cacheKey) ?? null;
    if (cached && hasUsableCoordinates(biz)) {
      maybeReportZoneConflict(biz, cached, cacheKey);
    }
    return cached;
  }

  // 1. 🌐 Spatial GIS Polygon point-in-polygon coordinates check FIRST (instant, no text normalization)
  if (hasUsableCoordinates(biz)) {
    const district = findDistrictForCoordinates(biz.lat, biz.lng);
    if (district && district.letterAr) {
      maybeReportZoneConflict(biz, district.letterAr, cacheKey);
      return rememberBusinessZone(cacheKey, district.letterAr);
    }

    // Valid GPS is authoritative. Never leak a pin into a textual district
    // when its coordinate is outside every official polygon.
    return rememberBusinessZone(cacheKey, null);
  }

  // 2. Structured field check
  const structuredZone = (biz as any).zone || (biz as any).hadayekZone;
  if (structuredZone && typeof structuredZone === 'string') {
    const letter = extractZoneLetter(structuredZone);
    if (letter) return rememberBusinessZone(cacheKey, letter);
  }

  // 3. Comprehensive text search fallback (only for missing or unresolved coordinates)
  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);

  for (const district of HADAYEK_OFFICIAL_DISTRICTS) {
    const normLetter = normalizeZoneLetter(district.letterAr);
    // Patterns: "منطقة أ", "قطاع أ", "عمارة 123 أ", "123 أ", "123أ"
    const isMatched =
      matchArabicWordPattern(normCorpus, `منطقه\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `قطاع\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `عماره\\s*\\d+\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `\\d+\\s*${normLetter}`);

    if (isMatched) {
      return rememberBusinessZone(cacheKey, district.letterAr);
    }
  }

  return rememberBusinessZone(cacheKey, null);
}

/**
 * Checks whether a business is located within the requested Hadayek Al-Ahram zone filter.
 * Supports:
 * - 'all' -> all businesses in Hadayek (excludes non-Hadayek locations)
 * - District letters: 'أ', 'ب', 'ل', 'هـ', etc.
 * - District names: 'منطقة أ', 'منطقة ل', etc.
 * - Gate names: 'البوابة الأولى (خفرع)', 'البوابة الثانية (خوفو)', etc.
 * - Arterial streets: 'شارع الجيش', 'شارع الثروة المعدنية', 'شارع الضغط العالي', etc.
 */
export function isBusinessInHadayekZone(biz: Business, zoneFilter: string): boolean {
  if (!biz) return false;

  let _normCorpus: string | null = null;
  const getNormCorpus = () => {
    if (_normCorpus === null) {
      const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
      _normCorpus = normalizeArabicText(textCorpus);
    }
    return _normCorpus;
  };

  // If 'all' is requested, verify the business actually belongs to Hadayek Al-Ahram
  if (!zoneFilter || zoneFilter === 'all') {
    // Exact coordinates must fall inside an official district polygon.
    if (hasUsableCoordinates(biz)) {
      return getBusinessHadayekZoneLetter(biz) !== null;
    }

    // Textual fallback only for an explicit district name. A bare «الأهرام»
    // or «منطقة» also matches places outside Hadayek Al-Ahram.
    const norm = getNormCorpus();
    return (
      norm.includes('حدايق الاهرام') ||
      norm.includes('حدائق الاهرام') ||
      norm.includes('هضبه الاهرام') ||
      norm.includes('هضبة الاهرام')
    );
  }

  // 1. Alphabetical Zone Matching ('منطقة أ' or 'أ') - most common on map
  const cleanLetter = extractZoneLetter(zoneFilter);
  if (cleanLetter && cleanLetter.length <= 3 && !zoneFilter.startsWith('شارع ') && !zoneFilter.includes('بواب')) {
    const targetNormLetter = normalizeZoneLetter(cleanLetter);
    const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
    if (bizZoneLetter) {
      return normalizeZoneLetter(bizZoneLetter) === targetNormLetter;
    }

    // If business has valid coordinates but is not inside this district polygon, do NOT fall back to text
    if (hasUsableCoordinates(biz)) {
      return false;
    }

    // Direct pattern matching fallback (only for businesses without valid GPS coordinates)
    const norm = getNormCorpus();
    return (
      matchArabicWordPattern(norm, `منطقه\\s*${targetNormLetter}`) ||
      matchArabicWordPattern(norm, `قطاع\\s*${targetNormLetter}`) ||
      matchArabicWordPattern(norm, `عماره\\s*\\d+\\s*${targetNormLetter}`) ||
      matchArabicWordPattern(norm, `\\d+\\s*${targetNormLetter}`)
    );
  }

  const normFilter = normalizeArabicText(zoneFilter);

  // 2. Gate Matching
  const isGateQuery = normFilter.includes('بواب') || normFilter.includes('gate');
  const gateMatch = HADAYEK_GATES.find(
    (g) =>
      normFilter.includes(normalizeArabicText(g.nameAr)) ||
      normFilter.includes(normalizeArabicText(g.popularNameAr)) ||
      normFilter.includes(normalizeArabicText(g.shortNameAr)) ||
      (isGateQuery && (
        normalizeArabicText(g.nameAr).includes(normFilter) ||
        normalizeArabicText(g.popularNameAr).includes(normFilter) ||
        normalizeArabicText(g.shortNameAr).includes(normFilter)
      ))
  );

  if (gateMatch) {
    if (hasUsableCoordinates(biz)) {
      const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
      return Boolean(
        bizZoneLetter &&
        gateMatch.servedZones.some((z) => normalizeZoneLetter(z) === normalizeZoneLetter(bizZoneLetter))
      );
    }

    const norm = getNormCorpus();
    if (
      norm.includes(normalizeArabicText(gateMatch.popularNameAr)) ||
      norm.includes(normalizeArabicText(gateMatch.shortNameAr)) ||
      norm.includes(normalizeArabicText(gateMatch.nameAr))
    ) {
      return true;
    }
    const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
    if (
      bizZoneLetter &&
      gateMatch.servedZones.some((z) => normalizeZoneLetter(z) === normalizeZoneLetter(bizZoneLetter))
    ) {
      return true;
    }
    return false;
  }

  // 3. Arterial Street Matching
  if (zoneFilter.startsWith('شارع ') || normFilter.startsWith('شارع ')) {
    const norm = getNormCorpus();
    return norm.includes(normFilter) || norm.includes(normFilter.replace('شارع ', ''));
  }

  // Fallback alphabetical zone matching if reached here
  const targetNormLetter = normalizeZoneLetter(cleanLetter);
  const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
  if (bizZoneLetter) {
    return normalizeZoneLetter(bizZoneLetter) === targetNormLetter;
  }
  if (hasUsableCoordinates(biz)) {
    return false;
  }

  const norm = getNormCorpus();
  return (
    matchArabicWordPattern(norm, `منطقه\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(norm, `قطاع\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(norm, `عماره\\s*\\d+\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(norm, `\\d+\\s*${targetNormLetter}`)
  );
}

/**
 * Filter an array of businesses down to those in a specific Hadayek zone.
 */
export function getBusinessesInZone(businesses: Business[], zoneFilter: string): Business[] {
  if (!businesses || businesses.length === 0) return [];
  return businesses.filter((b) => isBusinessInHadayekZone(b, zoneFilter));
}

/**
 * Authoritative, unified business filtering function for Map, Counters, and Empty States.
 * Guarantees zero discrepancy between map markers, header counts, and empty notices.
 */
export function filterBusinessesForMap(
  businesses: Business[],
  zoneFilter?: string,
  categoryFilter?: string,
  onlyVerified: boolean = false,
  zoomLevel?: number
): Business[] {
  if (!businesses || businesses.length === 0) return [];

  const isCityOverview = isCitywideFilterZoom(zoomLevel);

  return businesses.filter((b) => {
    // 1. Valid coordinates required for map
    if (!hasUsableCoordinates(b)) {
      return false;
    }

    // 2. Verification filter
    if (onlyVerified && b.verificationStatus !== 'verified') {
      return false;
    }

    // 3. Category filter
    if (categoryFilter && categoryFilter !== 'all' && categoryFilter.trim() !== '') {
      if (!matchesCategoryFilter(b, categoryFilter)) return false;
    }

    // 4. Zone filter (Adaptive City Overview LOD: when viewing from city overview altitude (< 15.0),
    // retain city-wide activities so the overview remains alive and populated)
    if (!isCityOverview && zoneFilter && zoneFilter !== 'all' && zoneFilter.trim() !== '') {
      return isBusinessInHadayekZone(b, zoneFilter);
    }

    return isBusinessInHadayekZone(b, 'all');
  });
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
      const count = cat.id === 'all'
        ? zoneBusinesses.length
        : zoneBusinesses.filter((b) => matchesCategoryFilter(b, cat.id)).length;
      return { ...cat, count };
    })
    .filter((cat) => cat.count > 0);
}

/** Location line that follows the GPS zone, not a conflicting street phrase. */
export function formatBusinessAreaLabel(biz: Business): string {
  const zone = getBusinessHadayekZoneLetter(biz);
  let city = (biz.city || '').trim();
  let street = (biz.street || '').trim();
  if (zone) {
    const zoneToken = zone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const embeddedZone = new RegExp(`(?:ال)?منطقة\\s*${zoneToken}`, 'g');
    city = city.replace(embeddedZone, ' ').replace(/\s{2,}/g, ' ').trim();
    street = street
      .replace(embeddedZone, ' ')
      .replace(/المنطقة\s*[\u0621-\u064A]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s\-–—]+|[\s\-–—]+$/g, '')
      .trim();
  }
  const zoneLabel = zone ? `منطقة ${zone}` : '';
  const parts = [city, zoneLabel, street && city && street.includes(city) ? '' : street].filter(Boolean);
  return parts.join(' · ');
}

/** Nearest official gate and zone, the line cards and the entry action share. */
export function getBusinessEntryGate(biz: Business): { id: string; label: string; line: string } | null {
  const letter = getBusinessHadayekZoneLetter(biz);
  if (!letter) return null;
  const gate = getRecommendedGateForZone(letter).primaryGate;
  const zoneName = getHadayekZone(letter)?.nameAr || `منطقة ${letter}`;
  return { id: gate.id, label: gate.popularNameAr, line: `${gate.popularNameAr} · ${zoneName}` };
}
