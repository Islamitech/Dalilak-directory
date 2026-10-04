import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorState } from '../shared/ui/ErrorState';
import { OfflineState } from '../shared/ui/OfflineState';
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton';
import { EmptyState } from '../shared/ui/EmptyState';

describe('Resilience and States primitives (Item 6)', () => {
  it('renders ErrorState with title, description, and alert role', () => {
    const html = renderToStaticMarkup(
      <ErrorState
        title="فشل تحميل البيانات"
        description="خطأ في الشبكة"
        retryLabel="إعادة التجربة"
        onRetry={() => {}}
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('فشل تحميل البيانات');
    expect(html).toContain('خطأ في الشبكة');
    expect(html).toContain('إعادة التجربة');
  });

  it('renders OfflineState in card and banner modes', () => {
    // Card mode
    const cardHtml = renderToStaticMarkup(
      <OfflineState
        title="أنت غير متصل"
        description="تحقق من الاتصال بالشبكة"
        onRetry={() => {}}
      />
    );
    expect(cardHtml).toContain('role="status"');
    expect(cardHtml).toContain('أنت غير متصل');
    expect(cardHtml).toContain('تحقق من الاتصال بالشبكة');

    // Banner mode
    const bannerHtml = renderToStaticMarkup(
      <OfflineState
        banner
        description="نعرض البيانات المخزنة محلياً"
        onRetry={() => {}}
      />
    );
    expect(bannerHtml).toContain('role="status"');
    expect(bannerHtml).toContain('نعرض البيانات المخزنة محلياً');
    expect(bannerHtml).toContain('إعادة المحاولة');
  });

  it('renders LoadingSkeleton variants (grid, list, detail, map)', () => {
    const gridHtml = renderToStaticMarkup(<LoadingSkeleton variant="grid" count={4} />);
    expect(gridHtml).toContain('animate-pulse');

    const listHtml = renderToStaticMarkup(<LoadingSkeleton variant="list" count={3} />);
    expect(listHtml).toContain('animate-pulse');

    const detailHtml = renderToStaticMarkup(<LoadingSkeleton variant="detail" />);
    expect(detailHtml).toContain('animate-pulse');

    const mapHtml = renderToStaticMarkup(<LoadingSkeleton variant="map" />);
    expect(mapHtml).toContain('تحميل الخريطة التفاعلية');
  });

  it('renders EmptyState with custom title, description, and action button', () => {
    const emptyHtml = renderToStaticMarkup(
      <EmptyState
        title="لا توجد نتائج"
        description="يرجى تجربة كلمات بحث أخرى"
        actionLabel="إعادة ضبط"
        onAction={() => {}}
      />
    );

    expect(emptyHtml).toContain('لا توجد نتائج');
    expect(emptyHtml).toContain('يرجى تجربة كلمات بحث أخرى');
    expect(emptyHtml).toContain('إعادة ضبط');
  });
});
