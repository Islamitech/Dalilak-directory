import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../features/map/model/mapMarkerHtml';
import { createCompactActivityPinHtml } from '../components/map/badgeMarkers';
import { Business } from '../types';

describe('Item 4 - Card Variants & Marker HTML Escaping', () => {
  const mockBusiness: Business = {
    id: 'test-biz-1',
    nameAr: '<script>alert("xss")</script> صيدلية الشفاء & الأمل',
    nameEn: 'Al-Shifa Pharmacy',
    category: 'صيدليات/أدوية',
    subcategoryId: 'صيدليات',
    street: 'شارع الثروة المعدنية <img src=x onerror=alert(1)>',
    city: 'حدائق الأهرام',
    governorate: 'الجيزة',
    phone: '01012345678',
    whatsapp: '01012345678',
    lat: 29.9683,
    lng: 31.1002,
    verificationStatus: 'verified',
    isFeatured: true,
    createdDate: '2026-01-01',
    workingHours: 'يومياً 24 ساعة',
    description: 'وصف تجريبي',
    photos: [],
  };

  it('escapeHtml encodes all dangerous HTML entities', () => {
    expect(escapeHtml('<script>alert("xss") & \'test\'</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;) &amp; &#039;test&#039;&lt;/script&gt;'
    );
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });

  it('createCompactActivityPinHtml escapes malicious business names and categories', () => {
    const { html, iconSize, iconAnchor } = createCompactActivityPinHtml(mockBusiness, false, true, 1);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(iconSize).toEqual([36, 44]);
    expect(iconAnchor).toEqual([18, 44]);
  });
});
