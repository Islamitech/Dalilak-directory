import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BusinessCardCompactVariant } from '../features/business-details/components/BusinessCardCompactVariant';
import { SearchField } from '../shared/ui/SearchField';
import { UnifiedMapSearch } from '../components/layout/UnifiedMapSearch';
import { FloatingBottomDock } from '../components/layout/FloatingBottomDock';
import { WhatsAppFloatingButton } from '../components/layout/WhatsAppFloatingButton';
import { Business } from '../types';

function createMockBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 'biz_test_1',
    nameAr: 'صيدلية النور',
    nameEn: 'Al Nour Pharmacy',
    category: 'صيدليات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'شارع الجيش',
    landmark: 'بجوار البوابة الأولى',
    lat: 29.981,
    lng: 31.121,
    phone: '01012345678',
    whatsapp: '201012345678',
    verificationStatus: 'verified',
    createdAt: '',
    createdDate: '',
    description: '',
    workingHours: '24 ساعة',
    photos: ['https://example.com/pharmacy.jpg'],
    isFeatured: false,
    ...overrides,
  };
}

describe('BusinessCardCompactVariant Quick Actions & Live Status', () => {
  it('renders direct WhatsApp and phone floating action pills', () => {
    const biz = createMockBusiness();
    const html = renderToString(
      <BusinessCardCompactVariant
        business={biz}
        onOpenBusiness={() => {}}
      />
    );

    // Business info
    expect(html).toContain('صيدلية النور');
    expect(html).toContain('صيدليات');

    // WhatsApp floating action pill
    expect(html).toContain('href="https://wa.me/201012345678');
    expect(html).toContain('مراسلة واتساب');

    // Phone call floating action pill
    expect(html).toContain('href="tel:01012345678"');
    expect(html).toContain('اتصال هاتفي');
  });

  it('renders pulsing dot when business is open', () => {
    const biz = createMockBusiness({ workingHours: '24 ساعة' });
    const html = renderToString(
      <BusinessCardCompactVariant
        business={biz}
        onOpenBusiness={() => {}}
      />
    );

    // Check pulsing live status elements
    expect(html).toContain('animate-ping');
    expect(html).toContain('bg-emerald-500');
    expect(html).toContain('مفتوح');
  });

  it('renders distance badge when userCoords are provided', () => {
    const biz = createMockBusiness({ lat: 29.981, lng: 31.121 });
    const html = renderToString(
      <BusinessCardCompactVariant
        business={biz}
        onOpenBusiness={() => {}}
        userCoords={{ lat: 29.983, lng: 31.123 }}
      />
    );

    // Distance calculation should be rendered
    expect(html).toMatch(/\d+\s*(م|كم)/);
  });

  it('omits phone and WhatsApp pills gracefully when contacts are absent', () => {
    const biz = createMockBusiness({ phone: '', whatsapp: '' });
    const html = renderToString(
      <BusinessCardCompactVariant
        business={biz}
        onOpenBusiness={() => {}}
      />
    );

    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('href="https://wa.me/');
  });

  it('avoids nested-interactive ARIA violation (no role="button" on outer article containing <a> links) and uses accessible touch targets', () => {
    const biz = createMockBusiness();
    const html = renderToString(
      <BusinessCardCompactVariant
        business={biz}
        onOpenBusiness={() => {}}
      />
    );

    // Outer article must not have role="button" when it contains <a href> and <button> children
    expect(html).not.toMatch(/<article[^>]*role="button"/);
    // Primary title trigger uses a dedicated button
    expect(html).toContain('<button type="button"');
    // Touch target sizing on quick action links is upgraded from w-6 h-6 to w-9 h-9
    expect(html).toContain('w-9 h-9 min-w-9 min-h-9');
    expect(html).not.toContain('w-6 h-6');
  });

  it('hardens SearchField against browser autofill pollution', () => {
    const html = renderToString(
      <SearchField
        value=""
        onChange={() => {}}
      />
    );

    expect(html).toContain('name="dalilak-search"');
    expect(html).toContain('autoComplete="off"');
    expect(html).toContain('autoCorrect="off"');
    expect(html).toContain('autoCapitalize="off"');
    expect(html).toContain('spellCheck="false"');
    expect(html).toContain('data-lpignore="true"');
    expect(html).toContain('data-1p-ignore="true"');
    expect(html).toContain('data-form-type="other"');
  });

  it('renders FloatingBottomDock and WhatsAppFloatingButton with overlay-aware visibility classes', () => {
    const biz = createMockBusiness();
    const dockHtml = renderToString(
      <FloatingBottomDock
        currentPath="/map"
        onNavigate={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        selectedCategory="all"
        onCategoryChange={() => {}}
        selectedZone="all"
        onZoneChange={() => {}}
        businesses={[biz]}
      />
    );

    expect(dockHtml).toContain('opacity-100 translate-y-0 pointer-events-auto visible');
    expect(dockHtml).toContain('name="dalilak-search"');

    const searchHtml = renderToString(
      <UnifiedMapSearch
        value=""
        onChange={() => {}}
        businesses={[biz]}
        onSelectBuilding={() => {}}
        onOpenChange={() => {}}
      />
    );
    expect(searchHtml).not.toContain('role="listbox"');

    const waHtml = renderToString(<WhatsAppFloatingButton referralCode="TEST" />);
    expect(waHtml).toContain('translate-y-0 opacity-100 visible');
    expect(waHtml).toContain('aria-label="تواصل عبر واتساب"');

    // Simulate late mount when an EntitySheet ([data-entity-sheet][data-placement="page"]) is already in DOM
    const prevDocument = (globalThis as Record<string, unknown>).document;
    try {
      (globalThis as Record<string, unknown>).document = {
        querySelector: (selector: string) =>
          selector === '[data-entity-sheet][data-placement="page"]' ? ({} as Element) : null,
      };
      const hiddenDockHtml = renderToString(
        <FloatingBottomDock
          currentPath="/map"
          onNavigate={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          selectedCategory="all"
          onCategoryChange={() => {}}
          selectedZone="all"
          onZoneChange={() => {}}
          businesses={[biz]}
        />
      );
      expect(hiddenDockHtml).toContain('aria-hidden="true"');
      expect(hiddenDockHtml).toContain('translate-y-[140%] opacity-0 invisible pointer-events-none');
      expect(hiddenDockHtml).toContain('opacity-0 translate-y-1 pointer-events-none invisible');

      const hiddenWaHtml = renderToString(<WhatsAppFloatingButton referralCode="TEST" />);
      expect(hiddenWaHtml).toContain('aria-hidden="true"');
      expect(hiddenWaHtml).toContain('translate-y-24 opacity-0 pointer-events-none invisible');
    } finally {
      (globalThis as Record<string, unknown>).document = prevDocument;
    }
  });
});
