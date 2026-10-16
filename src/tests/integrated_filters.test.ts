import { describe, expect, it, vi } from 'vitest';
import { INTEGRATED_FILTER_CATEGORIES } from '../features/search/model/filterModel';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../shared/data/hadayek/hadayekDistrictsGeoData';
import { matchesCategoryFilter } from '../utils/categoryMatcher';
import { getBusinessHadayekZoneLetter, isBusinessInHadayekZone } from '../utils/hadayekZoneHelper';
import { filterDirectoryBusinesses, type DirectoryFilterOptions } from '../utils/directoryFiltering';
import { parseHadayekBuildingAddress } from '../utils/hadayekBuildingSearch';
import { Business } from '../types';

describe('Integrated Search and Filter System', () => {
  const sampleBusinesses: Business[] = [
    {
      id: 'biz-1',
      nameAr: 'مطعم الأندلس للمشويات',
      nameEn: 'Al Andalus Restaurant',
      category: 'مطاعم',
      governorate: 'الجيزة',
      city: 'حدائق الأهرام',
      street: 'شارع الجيش، منطقة أ',
      landmark: '',
      phone: '01011111111',
      lat: 29.9856,
      lng: 31.1033,
      verificationStatus: 'verified',
      createdAt: '',
      createdDate: '',
      description: 'أشهى المشويات',
      workingHours: '10:00 ص - 12:00 ص',
      photos: [],
      isFeatured: false,
    },
    {
      id: 'biz-2',
      nameAr: 'صيدلية النور الحديثة',
      nameEn: 'Al Nour Pharmacy',
      category: 'صيدليات',
      governorate: 'الجيزة',
      city: 'حدائق الأهرام',
      street: 'شارع النادي، منطقة ب',
      landmark: '',
      phone: '01022222222',
      lat: 29.9756,
      lng: 31.1053,
      verificationStatus: 'verified',
      createdAt: '',
      createdDate: '',
      description: 'خدمة 24 ساعة',
      workingHours: '24 ساعة',
      photos: [],
      isFeatured: false,
    },
    {
      id: 'biz-3',
      nameAr: 'سوبر ماركت الرحاب',
      nameEn: 'Al Rehab Supermarket',
      category: 'سوبر ماركت',
      governorate: 'الجيزة',
      city: 'حدائق الأهرام',
      street: 'شارع الثروة، منطقة ج',
      landmark: '',
      phone: '01033333333',
      lat: 29.9656,
      lng: 31.0953,
      verificationStatus: 'verified',
      createdAt: '',
      createdDate: '',
      description: 'بقالة وتموين',
      workingHours: '08:00 ص - 02:00 ص',
      photos: [],
      isFeatured: false,
    },
  ];

  it('contains all 14 official integrated categories with icons', () => {
    expect(INTEGRATED_FILTER_CATEGORIES.length).toBe(14);
    const foodCat = INTEGRATED_FILTER_CATEGORIES.find((c) => c.id === 'food');
    expect(foodCat).toBeDefined();
    expect(foodCat?.icon).toBe('🍽️');
    expect(foodCat?.name).toBe('مطاعم وكافيهات');
    expect(foodCat?.shortName).toBe('مطاعم');
    expect(foodCat?.description).toContain('المطاعم');

    const healthCat = INTEGRATED_FILTER_CATEGORIES.find((c) => c.id === 'health');
    expect(healthCat).toBeDefined();
    expect(healthCat?.icon).toBe('💊');
    expect(healthCat?.shortName).toBe('صحة');
    for (const cat of INTEGRATED_FILTER_CATEGORIES) {
      expect(cat.shortName.split(/\s+/)).toEqual([cat.shortName]);
      expect(cat.description.length).toBeGreaterThan(20);
    }
  });

  it('contains all official Hadayek districts', () => {
    const letters = HADAYEK_OFFICIAL_DISTRICTS.map((d) => d.letterAr);
    expect(letters).toContain('أ');
    expect(letters).toContain('ب');
    expect(letters).toContain('ج');
    expect(letters).toContain('ع');
    expect(letters.length).toBe(16);
  });

  it('matches business categories correctly using taxonomy', () => {
    const restaurant = sampleBusinesses[0];
    const pharmacy = sampleBusinesses[1];
    const supermarket = sampleBusinesses[2];

    expect(matchesCategoryFilter(restaurant, 'food')).toBe(true);
    expect(matchesCategoryFilter(restaurant, 'health')).toBe(false);

    expect(matchesCategoryFilter(pharmacy, 'health')).toBe(true);
    expect(matchesCategoryFilter(pharmacy, 'food')).toBe(false);

    expect(matchesCategoryFilter(supermarket, 'grocery')).toBe(true);
    expect(matchesCategoryFilter(supermarket, 'health')).toBe(false);
  });

  it('handles default category "all" as matching all businesses', () => {
    for (const biz of sampleBusinesses) {
      expect(matchesCategoryFilter(biz, 'all')).toBe(true);
    }
  });

  it('matches businesses served by gates correctly', () => {
    const restaurant = sampleBusinesses[0]; // Zone أ, served by Gate 1 (Khufu)
    expect(isBusinessInHadayekZone(restaurant, 'البوابة الأولى')).toBe(true);
    expect(isBusinessInHadayekZone(restaurant, 'البوابة الأولى (خوفو)')).toBe(true);
    expect(isBusinessInHadayekZone(restaurant, 'بوابة خوفو')).toBe(true);
    expect(isBusinessInHadayekZone(restaurant, 'البوابة الرابعة (مينا)')).toBe(false);
  });

  it('enforces GPS coordinates over conflicting text zone without spamming console.warn by default and deduplicates when VITE_DEBUG_ZONES=true', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const prevDebug = (import.meta.env as Record<string, unknown>).VITE_DEBUG_ZONES;
    try {
      (import.meta.env as Record<string, unknown>).VITE_DEBUG_ZONES = undefined;
      const conflictingBiz: Business = {
        ...sampleBusinesses[0],
        id: 'biz-conflict-silence-test',
        street: 'شارع الجيش أمام منطقة ل',
        landmark: 'منطقة ل',
      };

      expect(getBusinessHadayekZoneLetter(conflictingBiz)).toBe('أ');
      expect(warnSpy).not.toHaveBeenCalled();

      (import.meta.env as Record<string, unknown>).VITE_DEBUG_ZONES = 'true';
      // Even when conflictingBiz was already cached while VITE_DEBUG_ZONES was off,
      // enabling VITE_DEBUG_ZONES logs once and deduplicates subsequent calls (both exact-same and mutated).
      expect(getBusinessHadayekZoneLetter(conflictingBiz)).toBe('أ');
      expect(getBusinessHadayekZoneLetter(conflictingBiz)).toBe('أ');
      expect(getBusinessHadayekZoneLetter({ ...conflictingBiz, landmark: 'منطقة ل - فرع 2' })).toBe('أ');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      (import.meta.env as Record<string, unknown>).VITE_DEBUG_ZONES = prevDebug;
      warnSpy.mockRestore();
    }
  });
});

describe('Building query mode (buildingIntent)', () => {
  const makeBiz = (overrides: Partial<Business>): Business => ({
    id: 'biz-x',
    nameAr: 'نشاط تجريبي',
    nameEn: 'Test Business',
    category: 'مطاعم',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: '',
    landmark: '',
    phone: '01000000000',
    lat: 0,
    lng: 0,
    verificationStatus: 'verified',
    createdAt: '',
    createdDate: '',
    description: '',
    workingHours: '',
    photos: [],
    isFeatured: false,
    ...overrides,
  });

  const buildOptions = (overrides: Partial<DirectoryFilterOptions>): DirectoryFilterOptions => ({
    activityIntent: null,
    deferredSearchQuery: '',
    categoryFilter: 'all',
    subcategoryFilter: 'all',
    effectiveSearchZone: 'all',
    govFilter: 'all',
    cityFilter: 'all',
    openNowOnly: false,
    verifiedOnly: false,
    hasRatingOnly: false,
    hasVideoOnly: false,
    ...overrides,
  });

  const phoneLookalike = makeBiz({
    id: 'biz-phone-234',
    street: 'شارع الجيش، منطقة ح',
    phone: '01000234111',
  });

  it('rejects phone-digit lookalikes in building mode while plain text search still matches them without an intent', () => {
    const intent234H = parseHadayekBuildingAddress('234 ح');
    expect(intent234H).toEqual({ buildingNumber: '234', zoneLetter: 'ح' });

    const buildingMode = filterDirectoryBusinesses(
      [phoneLookalike],
      buildOptions({ buildingIntent: intent234H, buildingCoords: null, deferredSearchQuery: '234 ح' })
    );
    expect(buildingMode).toHaveLength(0);

    const textMode = filterDirectoryBusinesses(
      [phoneLookalike],
      buildOptions({ buildingIntent: null, deferredSearchQuery: '234 ح' })
    );
    expect(textMode).toHaveLength(1);
  });

  it('keeps only the activity registered at the building address (exact number + zone)', () => {
    const addressBiz = makeBiz({
      id: 'biz-address-5a',
      street: 'شارع الثروة المعدنية، مبنى 5 أ',
      phone: '01099999999',
    });

    const kept = filterDirectoryBusinesses(
      [addressBiz, phoneLookalike],
      buildOptions({ buildingIntent: parseHadayekBuildingAddress('5 أ'), deferredSearchQuery: '5 أ' })
    );
    expect(kept.map((b) => b.id)).toEqual(['biz-address-5a']);

    const otherBuilding = filterDirectoryBusinesses(
      [addressBiz],
      buildOptions({ buildingIntent: parseHadayekBuildingAddress('234 ح'), deferredSearchQuery: '234 ح' })
    );
    expect(otherBuilding).toHaveLength(0);
  });

  it('keeps only activities within 90m when building coordinates resolve', () => {
    const nearbyBiz = makeBiz({
      id: 'biz-nearby',
      street: 'شارع الجيش',
      lat: 29.984864,
      lng: 31.098977,
    });
    const farBiz = makeBiz({
      id: 'biz-far',
      street: 'شارع الجيش',
      lat: 29.9856,
      lng: 31.1033,
    });

    expect(getBusinessHadayekZoneLetter(nearbyBiz)).toBe('أ');
    expect(getBusinessHadayekZoneLetter(farBiz)).toBe('أ');

    const kept = filterDirectoryBusinesses(
      [nearbyBiz, farBiz],
      buildOptions({
        buildingIntent: parseHadayekBuildingAddress('5 أ'),
        buildingCoords: { lat: 29.984864, lng: 31.098977 },
        deferredSearchQuery: '5 أ',
      })
    );
    expect(kept.map((b) => b.id)).toEqual(['biz-nearby']);
  });
});
