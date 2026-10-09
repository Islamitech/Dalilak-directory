import { describe, expect, it } from 'vitest';
import { INTEGRATED_FILTER_CATEGORIES } from '../features/search/model/filterModel';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../shared/data/hadayek/hadayekDistrictsGeoData';
import { matchesCategoryFilter } from '../utils/categoryMatcher';
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
});
