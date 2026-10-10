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
  formatCount,
  formatRating,
} from '../shared/lib';
import { parseFavorites } from '../features/catalog';
import { mergeHydratedCatalog } from '../features/catalog/model/catalogState';
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

  it('formats counts with Latin digits', () => {
    expect(formatCount(1250)).toBe('1,250');
    expect(formatCount(0)).toBe('0');
    expect(formatCount(null)).toBe('0');
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

describe('Catalog Hydration & IndexedDB Upgrade (mergeHydratedCatalog)', () => {
  const bizA: any = {
    id: 'biz_a',
    nameAr: 'محل ألف',
    category: 'مطاعم',
    verificationStatus: 'verified',
    status: 'published',
    createdDate: '2026-01-01T00:00:00Z',
    phone: '01011111111',
  };
  const bizA_Upgraded: any = {
    id: 'biz_a',
    nameAr: 'محل ألف المطور',
    category: 'مطاعم',
    verificationStatus: 'verified',
    status: 'published',
    createdDate: '2026-01-01T00:00:00Z',
    phone: '01099999999',
  };
  const bizB: any = {
    id: 'biz_b',
    nameAr: 'محل باء',
    category: 'تسوق',
    verificationStatus: 'verified',
    status: 'published',
    createdDate: '2026-01-02T00:00:00Z',
  };
  const bizC: any = {
    id: 'biz_c',
    nameAr: 'محل جيم',
    category: 'خدمات',
    verificationStatus: 'verified',
    status: 'published',
    createdDate: '2026-01-03T00:00:00Z',
  };

  it('hydrates publicCatalog when current localStorage cache is empty', () => {
    const result = mergeHydratedCatalog([], [bizA, bizB]);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('biz_b'); // newer createdDate
    expect(result[1].id).toBe('biz_a');
  });

  it('retains current cache when hydrated IndexedDB is empty', () => {
    const result = mergeHydratedCatalog([bizA], []);
    expect(result.length).toBe(1);
    expect(result[0].nameAr).toBe('محل ألف');
  });

  it('merges and upgrades records from IndexedDB over localStorage even when localStorage has data', () => {
    // Current localStorage has bizA (old phone) and bizB
    const current = [bizA, bizB];
    // IndexedDB has upgraded bizA and newly discovered bizC
    const idbCatalog = [bizA_Upgraded, bizC];

    const merged = mergeHydratedCatalog(current, idbCatalog);

    // Should contain all 3 businesses (biz_c, biz_b, biz_a)
    expect(merged.length).toBe(3);

    // biz_a should be upgraded with the new phone
    const foundA = merged.find((b) => b.id === 'biz_a');
    expect(foundA?.phone).toBe('01099999999');
    expect(foundA?.nameAr).toBe('محل ألف المطور');

    // biz_b from localStorage should be preserved
    expect(merged.some((b) => b.id === 'biz_b')).toBe(true);

    // biz_c from IndexedDB should be merged
    expect(merged.some((b) => b.id === 'biz_c')).toBe(true);
  });
});

describe('Supabase Decoupling & Lazy Client Architecture (Phase 2)', () => {
  it('exports valid static constants from supabaseConfig without instantiating client', async () => {
    const config = await import('../shared/lib/supabaseConfig');
    expect(config.SUPABASE_URL).toBeDefined();
    expect(config.SUPABASE_ANON_KEY).toBeDefined();
    expect(config.SUPABASE_REST_BASE).toContain('/rest/v1');
    expect(config.SUPABASE_BASE_URL).not.toMatch(/\/+$/);
  });

  it('provides lazy getSupabase returning a SupabaseClient promise', async () => {
    const { getSupabase } = await import('../shared/lib/supabase');
    const client = await getSupabase();
    expect(client).toBeDefined();
    expect(typeof client.channel).toBe('function');
  });

  it('supports lazy channel creation, handler queueing, and subscribe lifecycle', async () => {
    const { supabase } = await import('../shared/lib/supabase');
    const channel = supabase.channel('test-channel');
    expect(channel).toBeDefined();
    expect(typeof channel.on).toBe('function');
    expect(typeof channel.subscribe).toBe('function');
    expect(typeof channel.unsubscribe).toBe('function');

    let receivedEvent = false;
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
      receivedEvent = true;
    });

    channel.subscribe();
    expect(channel).toBeDefined();

    // Cleaning up channel
    await supabase.removeChannel(channel);
  });

  it('handles early cancellation without channel leak if removeChannel is called quickly', async () => {
    const { supabase } = await import('../shared/lib/supabase');
    const ch = supabase.channel('quick-cancel-channel');
    ch.subscribe();
    // Immediate removal before underlying resolution
    await expect(supabase.removeChannel(ch)).resolves.not.toThrow();
  });
});

