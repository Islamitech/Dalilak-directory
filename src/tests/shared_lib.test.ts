import { describe, expect, it } from 'vitest';
import {
  normalizePhone,
  isValidEgyptianPhone,
  toNationalEgyptianMobile,
  cleanPhoneForWhatsApp,
  formatDisplayPhone,
  getWhatsAppUrl,
  getOfficialSalesWhatsAppUrl,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsSearchUrl,
  isValidCoordinate,
  normalizeArabicText,
  matchesArabicSearch,
  toWesternDigits,
  formatDistanceString,
  formatRating,
} from '../shared/lib';
import { parseFavorites } from '../services/catalogState';
import { FAVORITES_STORAGE_KEY } from '../features/favorites';

describe('Shared Library: Phone & WhatsApp Utilities', () => {
  it('correctly normalizes Arabic-Indic and Persian digits to ASCII', () => {
    expect(normalizePhone('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678');
    expect(normalizePhone('۰۱۱۲۳۴۵۶۷۸۹')).toBe('01123456789');
  });

  it('validates Egyptian mobile numbers', () => {
    expect(isValidEgyptianPhone('01012345678')).toBe(true);
    expect(isValidEgyptianPhone('01112345678')).toBe(true);
    expect(isValidEgyptianPhone('01212345678')).toBe(true);
    expect(isValidEgyptianPhone('01512345678')).toBe(true);
    expect(isValidEgyptianPhone('+201012345678')).toBe(true);
    expect(isValidEgyptianPhone('00201012345678')).toBe(true);
    expect(isValidEgyptianPhone('01312345678')).toBe(false); // invalid prefix
    expect(isValidEgyptianPhone('0231234567')).toBe(false); // landline
    expect(isValidEgyptianPhone('')).toBe(false);
  });

  it('formats Egyptian phones for national representation', () => {
    expect(toNationalEgyptianMobile('+201012345678')).toBe('01012345678');
    expect(formatDisplayPhone('01012345678')).toBe('0101 234 5678');
  });

  it('cleans phone numbers for wa.me links', () => {
    expect(cleanPhoneForWhatsApp('01012345678')).toBe('201012345678');
    expect(cleanPhoneForWhatsApp('+201112345678')).toBe('201112345678');
    expect(cleanPhoneForWhatsApp('00201212345678')).toBe('201212345678');
  });

  it('builds secure WhatsApp intent URLs with encoded message', () => {
    const url = getWhatsAppUrl('01012345678', 'مرحباً، أود الاستفسار');
    expect(url).toBe('https://wa.me/201012345678?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1');
  });

  it('provides the official sales WhatsApp URL', () => {
    const salesUrl = getOfficialSalesWhatsAppUrl();
    expect(salesUrl).toContain('https://wa.me/201007788481?text=');
  });
});

describe('Shared Library: Directions & Geolocation Utilities', () => {
  it('validates coordinate sanity and rejects Null Island (0,0)', () => {
    expect(isValidCoordinate(29.97, 31.11)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(false);
    expect(isValidCoordinate(null, null)).toBe(false);
    expect(isValidCoordinate(100, 31)).toBe(false); // latitude out of range
  });

  it('generates coordinate directions URL when coordinates are valid', () => {
    const url = getGoogleMapsDirectionsUrl({ lat: 29.975, lng: 31.105 });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=29.975,31.105');
  });

  it('falls back to destination address if coordinates are invalid or Null Island', () => {
    const url = getGoogleMapsDirectionsUrl({ lat: 0, lng: 0, destinationAddress: 'حدائق الأهرام عمارة 142 ج' });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=%D8%AD%D8%AF%D8%A7%D8%A6%D9%82%20%D8%A7%D9%84%D8%A3%D9%87%D8%B1%D8%A7%D9%85%20%D8%B9%D9%85%D8%A7%D8%B1%D8%A9%20142%20%D8%AC');
  });
});

describe('Shared Library: Arabic Text Normalization', () => {
  it('normalizes diacritics, alef, teh marbuta, and yeh', () => {
    expect(normalizeArabicText('مَطْعَمُ الأَهْرَامِ')).toBe('مطعم الاهرام');
    expect(normalizeArabicText('الراقية')).toBe('الراقيه');
    expect(normalizeArabicText('كافيه')).toBe('كافيه');
    expect(normalizeArabicText('صيدليّة')).toBe('صيدليه');
  });

  it('matches searches regardless of spelling variations', () => {
    expect(matchesArabicSearch('مخبز وحلواني الأهرام', 'حلوانى')).toBe(true);
    expect(matchesArabicSearch('مكتبة الامل', 'الأمل')).toBe(true);
    expect(matchesArabicSearch('مطعم بيتزا', 'برجر')).toBe(false);
  });
});

describe('Shared Library: Formatting Utilities', () => {
  it('formats distances in meters below 1km and kilometers above 1km', () => {
    expect(formatDistanceString(0.35)).toBe('350 م');
    expect(formatDistanceString(2.45)).toBe('2.5 كم');
    expect(formatDistanceString(null)).toBe('');
    expect(formatDistanceString(-1)).toBe('');
  });

  it('formats ratings and never fabricates scores for unrated entities', () => {
    expect(formatRating(4.5)).toBe('4.5');
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(undefined)).toBeNull();
    expect(formatRating(null)).toBeNull();
    expect(formatRating(0)).toBeNull();
  });
});

describe('Favorites Storage Format & Backward Compatibility (716b654)', () => {
  it('enforces exact storage key name dalelak_user_favorites', () => {
    expect(FAVORITES_STORAGE_KEY).toBe('dalelak_user_favorites');
  });

  it('correctly reads and parses favorites stored in the 716b654 JSON format', () => {
    const rawLegacyJson = JSON.stringify(['biz_legacy_1', 'biz_legacy_2', 'biz_legacy_1']);
    const parsed = parseFavorites(rawLegacyJson);
    expect(parsed).toEqual(['biz_legacy_1', 'biz_legacy_2']);
  });

  it('handles corrupted, null, or empty string gracefully', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites('')).toEqual([]);
    expect(parseFavorites('invalid json')).toEqual([]);
    expect(parseFavorites('{"not":"an array"}')).toEqual([]);
    expect(parseFavorites(JSON.stringify(['valid_id', 123, null, 'another_valid']))).toEqual([
      'valid_id',
      'another_valid',
    ]);
  });
});
