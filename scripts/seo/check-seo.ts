/**
 * Comprehensive SEO Build-Time and CI Verification Script
 * Validates:
 * 1. Title & meta description presence, non-emptiness, and uniqueness
 * 2. Canonical URL correctness (no mismatches on faceted / parameter URLs)
 * 3. Schema.org JSON-LD validity & compliance (NO fake aggregateRating, NO fake priceRange)
 * 4. HTTP status codes (200 for public pages, 410 for deleted, 404 for non-existent, 301 for merged duplicates)
 * 5. Hostile attack resistance (XSS, long payloads, SQL fragments)
 * 6. Sitemap XML structure, real lastmod timestamps (not dynamic todayStr for all)
 */

import * as fs from 'fs';
import * as path from 'path';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://fixture.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const originalFetch = globalThis.fetch;

// Comprehensive mock database fixtures
const FIXTURE_BUSINESSES: any[] = [
  {
    id: 'biz_sample_restaurant_1',
    name_ar: 'مطعم أندلسية للمشويات',
    name_en: 'Andalusia Grill',
    category: 'المطاعم والكافيهات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'شارع الجيش - منطقة أ - عمارة 15',
    phone: '01012345678',
    secondary_phone: '0233445566',
    working_hours: 'يومياً من 11 صباحاً حتى 2 صباحاً',
    description: 'مطعم متخصص في تقديم المشويات المصرية والطواجن والمقبلات الشرقية.',
    lat: 29.9812,
    lng: 31.1245,
    verification_status: 'verified',
    package_id: 'pkg_standard',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    is_deleted: false,
    photos: ['https://xdqpbajymacpdccorjcj.supabase.co/storage/v1/object/public/photos/andalusia.jpg'],
    notes: JSON.stringify({
      publishedStatus: 'published',
      googleRatingEnabled: true,
      googleRating: 4.6,
      googleReviewsCount: 142,
      googleMapsUrl: 'https://maps.google.com/?cid=1111111111'
    }),
    seo_title: 'مطعم أندلسية للمشويات – المطاعم والكافيهات في منطقة أ، حدائق الأهرام',
    seo_description: 'مطعم أندلسية للمشويات في شارع الجيش - منطقة أ - عمارة 15، حدائق الأهرام. تواصل: 01012345678. ساعات العمل: يومياً من 11 صباحاً حتى 2 صباحاً.',
    seo_intro: 'مطعم أندلسية للمشويات نشاط معتمد ضمن تصنيف المطاعم والكافيهات في منطقة أ بحدائق الأهرام. يقدم خدماته في شارع الجيش - منطقة أ - عمارة 15، مع إمكانية التواصل مباشرة عبر الهاتف 01012345678.',
    seo_status: 'approved',
    seo_faq: [
      { question: 'ما هو عنوان مطعم أندلسية للمشويات؟', answer: 'يقع في شارع الجيش - منطقة أ - عمارة 15، حدائق الأهرام، الجيزة.' },
      { question: 'ما هي ساعات العمل في مطعم أندلسية للمشويات؟', answer: 'يعمل يومياً من 11 صباحاً حتى 2 صباحاً.' }
    ]
  },
  {
    id: 'biz_sample_pharmacy_2',
    name_ar: 'صيدلية النور الحديثة',
    name_en: 'Al-Noor Pharmacy',
    category: 'الرعاية الصحية والصيدليات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'البوابة الرابعة - منطقة ع عمارة 120',
    phone: '01198765432',
    working_hours: 'خدمة 24 ساعة',
    description: 'صيدلية متكاملة تقدم الأدوية والمستلزمات الطبية ورعاية صحية شاملة.',
    lat: 29.9754,
    lng: 31.1189,
    verification_status: 'verified',
    package_id: 'pkg_featured',
    created_at: '2026-07-10T09:00:00Z',
    updated_at: '2026-09-12T11:00:00Z',
    is_deleted: false,
    notes: JSON.stringify({ publishedStatus: 'published' })
  },
  {
    id: 'biz_sample_no_coords_3',
    name_ar: 'مركز الأهرام لصيانة السيارات',
    category: 'السيارات والمركبات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة ك',
    phone: '01234567890',
    description: 'ميكانيكا وكهرباء سيارات وضبط زوايا.',
    verification_status: 'verified',
    package_id: 'pkg_standard',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-08-10T12:00:00Z',
    is_deleted: false,
    notes: JSON.stringify({ publishedStatus: 'published' })
  },
  {
    id: 'biz_deleted_sample',
    name_ar: 'محل مغلق نهائياً',
    category: 'الملابس والأزياء',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة ب',
    verification_status: 'verified',
    package_id: 'pkg_standard',
    created_at: '2026-05-01T08:00:00Z',
    updated_at: '2026-07-01T12:00:00Z',
    is_deleted: true
  },
  {
    id: 'biz_atlas_1789859443844_ocx4v',
    name_ar: 'عيادة د. أحمد إبراهيم لطب وجراحة الأسنان',
    category: 'الرعاية الصحية والصيدليات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة د',
    phone: '01000000000',
    verification_status: 'verified',
    package_id: 'pkg_standard',
    created_at: '2026-09-01T10:00:10Z',
    updated_at: '2026-09-01T10:00:10Z',
    is_deleted: false
  },
  {
    id: 'biz_atlas_1789859433981_gagii',
    name_ar: 'عيادة د. أحمد إبراهيم لطب وجراحة الأسنان',
    category: 'الرعاية الصحية والصيدليات',
    governorate: 'الجيزة',
    city: 'حدائق الأهرام',
    street: 'منطقة د',
    phone: '01000000000',
    verification_status: 'verified',
    package_id: 'pkg_standard',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    is_deleted: false
  }
];

// Mock Supabase REST API calls
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.includes('/rest/v1/businesses')) {
    const urlObj = new URL(url);
    const idFilter = urlObj.searchParams.get('id');

    if (idFilter && idFilter.startsWith('eq.')) {
      const targetId = idFilter.replace('eq.', '');
      const match = FIXTURE_BUSINESSES.find((b) => b.id === targetId);
      const rows = match ? [match] : [];
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-range': `0-${rows.length}/${rows.length}`
        }
      });
    }

    // Catalog load: verified, non-deleted, non-lead
    const publicRows = FIXTURE_BUSINESSES.filter((b) => !b.is_deleted && b.verification_status === 'verified');
    return new Response(JSON.stringify(publicRows), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-range': `0-${publicRows.length - 1}/${publicRows.length}`
      }
    });
  }
  return originalFetch(input, init);
};

interface TestResult {
  url: string;
  expectedStatus: number;
  actualStatus: number;
  title?: string;
  description?: string;
  canonical?: string;
  hasJsonLd?: boolean;
  jsonLdValid?: boolean;
  passed: boolean;
  errors: string[];
}

async function runSeoChecks(): Promise<boolean> {
  console.log('═'.repeat(70));
  console.log('🔍 DALILAK DIRECTORY SEO AUDIT & CI VALIDATION SUITE');
  console.log('═'.repeat(70));

  const { default: shareHandler } = await import('../../api/share.js');
  const { default: sitemapHandler } = await import('../../api/sitemap.js');

  const titlesSeen = new Map<string, string>();
  const descsSeen = new Map<string, string>();
  const testResults: TestResult[] = [];
  let suitePassed = true;

  async function testPage(
    description: string,
    reqQuery: Record<string, string>,
    expectedStatus: number,
    options: {
      checkUniqueTitle?: boolean;
      checkUniqueDesc?: boolean;
      expectJsonLd?: boolean;
      expectedCanonicalPrefix?: string;
      isRedirect?: boolean;
      expectedRedirectTarget?: string;
    } = {}
  ): Promise<TestResult> {
    let capturedStatus = 200;
    let capturedHtml = '';
    let capturedRedirect = '';
    const errors: string[] = [];

    const mockRes: any = {
      setHeader: () => {},
      status: (code: number) => {
        capturedStatus = code;
        return {
          send: (content: string) => {
            capturedHtml = content;
          }
        };
      },
      redirect: (code: number, url: string) => {
        capturedStatus = code;
        capturedRedirect = url;
      },
      send: (content: string) => {
        capturedHtml = content;
      }
    };

    const mockReq: any = {
      query: reqQuery,
      headers: {
        host: 'www.dalilaak.com',
        'x-forwarded-proto': 'https'
      }
    };

    try {
      await shareHandler(mockReq, mockRes);
    } catch (err: any) {
      errors.push(`Handler threw exception: ${err.message}`);
    }

    if (capturedStatus !== expectedStatus) {
      errors.push(`Status mismatch: expected ${expectedStatus}, got ${capturedStatus}`);
    }

    if (options.isRedirect) {
      if (options.expectedRedirectTarget && !capturedRedirect.includes(options.expectedRedirectTarget)) {
        errors.push(`Redirect target mismatch: expected to contain "${options.expectedRedirectTarget}", got "${capturedRedirect}"`);
      }
      return {
        url: JSON.stringify(reqQuery),
        expectedStatus,
        actualStatus: capturedStatus,
        passed: errors.length === 0,
        errors
      };
    }

    let title = '';
    let metaDesc = '';
    let canonical = '';
    let hasJsonLd = false;
    let jsonLdValid = false;

    if (capturedStatus === 200 && capturedHtml) {
      // 1. Title verification
      const titleMatch = capturedHtml.match(/<title>(.*?)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : '';
      if (!title) {
        errors.push('Missing or empty <title> tag');
      } else if (options.checkUniqueTitle) {
        if (titlesSeen.has(title)) {
          errors.push(`Duplicate <title> detected: "${title}" already used by ${titlesSeen.get(title)}`);
        } else {
          titlesSeen.set(title, description);
        }
      }

      // 2. Meta description verification
      const descMatch = capturedHtml.match(/<meta\s+name="description"\s+content="(.*?)"/i);
      metaDesc = descMatch ? descMatch[1].trim() : '';
      if (!metaDesc) {
        errors.push('Missing or empty <meta name="description"> tag');
      } else if (options.checkUniqueDesc) {
        if (descsSeen.has(metaDesc)) {
          errors.push(`Duplicate meta description detected: already used by ${descsSeen.get(metaDesc)}`);
        } else {
          descsSeen.set(metaDesc, description);
        }
      }

      // 3. Canonical URL verification
      const canonicalMatch = capturedHtml.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
      canonical = canonicalMatch ? canonicalMatch[1].trim() : '';
      if (!canonical) {
        errors.push('Missing <link rel="canonical"> tag');
      } else if (options.expectedCanonicalPrefix && !canonical.startsWith(options.expectedCanonicalPrefix)) {
        errors.push(`Canonical URL mismatch: expected prefix "${options.expectedCanonicalPrefix}", got "${canonical}"`);
      }

      // 4. Schema.org JSON-LD verification
      const jsonLdMatch = capturedHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (jsonLdMatch) {
        hasJsonLd = true;
        try {
          const parsed = JSON.parse(jsonLdMatch[1]);
          jsonLdValid = true;

          // Hard Safety Rule #2 Check: aggregateRating MUST NOT exist without platform reviews
          const graphString = JSON.stringify(parsed);
          if (graphString.includes('"AggregateRating"') || graphString.includes('"aggregateRating"')) {
            errors.push('VIOLATION OF HARD SAFETY RULE #2: Schema.org contains aggregateRating without DB platform reviews');
          }
          // Truthfulness Check: priceRange must not be fabricated
          if (graphString.includes('"priceRange"')) {
            errors.push('VIOLATION: Schema.org contains fabricated priceRange');
          }
        } catch (e: any) {
          errors.push(`Schema.org JSON-LD parse error: ${e.message}`);
        }
      } else if (options.expectJsonLd) {
        errors.push('Expected Schema.org JSON-LD script tag but none was found');
      }

      // 5. Hostile script execution check
      if (capturedHtml.includes('<script>alert(') || capturedHtml.includes('onerror=alert')) {
        errors.push('CRITICAL: Hostile script payload rendered unescaped in HTML output!');
      }
    }

    const passed = errors.length === 0;
    if (!passed) suitePassed = false;

    return {
      url: description,
      expectedStatus,
      actualStatus: capturedStatus,
      title,
      description: metaDesc,
      canonical,
      hasJsonLd,
      jsonLdValid,
      passed,
      errors
    };
  }

  console.log('\n--- [TEST GROUP 1] Static Institutional Pages ---');
  const staticPages = ['about', 'pricing', 'for-business', 'search', 'map', 'privacy'];
  for (const page of staticPages) {
    const res = await testPage(
      `/${page}`,
      { page },
      200,
      {
        checkUniqueTitle: true,
        checkUniqueDesc: true,
        expectJsonLd: true,
        expectedCanonicalPrefix: `https://www.dalilaak.com/${page}`
      }
    );
    testResults.push(res);
    console.log(`  ${res.passed ? '✅' : '❌'} [/${page}] -> Status: ${res.actualStatus} | Title: "${res.title}"`);
    if (!res.passed) console.log(`     Errors: ${res.errors.join(', ')}`);
  }

  console.log('\n--- [TEST GROUP 2] Faceted Category & Zone Pages ---');
  const facetPages = [
    { cat: 'food', label: 'Category food', expectedCanonical: 'https://www.dalilaak.com/search?cat=food' },
    { cat: 'health', label: 'Category health', expectedCanonical: 'https://www.dalilaak.com/search?cat=health' },
    { zone: '%D8%A3', label: 'Zone أ', expectedCanonical: 'https://www.dalilaak.com/search?zone=%D8%A3' },
  ];
  for (const facet of facetPages) {
    const query: Record<string, string> = { page: 'search', ...(facet.cat ? { cat: facet.cat } : { zone: facet.zone }) };
    const res = await testPage(
      facet.label,
      query,
      200,
      {
        checkUniqueTitle: true,
        checkUniqueDesc: true,
        expectJsonLd: true,
        expectedCanonicalPrefix: facet.expectedCanonical
      }
    );
    testResults.push(res);
    console.log(`  ${res.passed ? '✅' : '❌'} [${facet.label}] -> Canonical: ${res.canonical}`);
    if (!res.passed) console.log(`     Errors: ${res.errors.join(', ')}`);
  }

  console.log('\n--- [TEST GROUP 3] Business Detail Pages ---');
  const sampleBiz = [
    { id: 'biz_sample_restaurant_1', label: 'Restaurant with Approved SEO & FAQ' },
    { id: 'biz_sample_pharmacy_2', label: 'Pharmacy with 24h & standard fields' },
    { id: 'biz_sample_no_coords_3', label: 'Auto repair without coordinates' }
  ];
  for (const b of sampleBiz) {
    const res = await testPage(
      b.label,
      { biz: b.id },
      200,
      {
        checkUniqueTitle: true,
        checkUniqueDesc: true,
        expectJsonLd: true,
        expectedCanonicalPrefix: 'https://www.dalilaak.com/biz/'
      }
    );
    testResults.push(res);
    console.log(`  ${res.passed ? '✅' : '❌'} [${b.label}] -> Title: "${res.title?.slice(0, 50)}..." | JSON-LD: ${res.jsonLdValid ? 'Valid' : 'Invalid'}`);
    if (!res.passed) console.log(`     Errors: ${res.errors.join(', ')}`);
  }

  console.log('\n--- [TEST GROUP 4] Indexing Hygiene (Deleted, Duplicate 301, 404) ---');
  // 1. Deleted business should return 410 Gone
  const delRes = await testPage('Deleted Business', { biz: 'biz_deleted_sample' }, 410);
  testResults.push(delRes);
  console.log(`  ${delRes.passed ? '✅' : '❌'} [Deleted Business] -> Status: ${delRes.actualStatus} (Expected 410 Gone)`);
  if (!delRes.passed) console.log(`     Errors: ${delRes.errors.join(', ')}`);

  // 2. Non-existent business should return 404 Not Found
  const notFoundRes = await testPage('Non-existent Business', { biz: 'biz_does_not_exist_99999' }, 404);
  testResults.push(notFoundRes);
  console.log(`  ${notFoundRes.passed ? '✅' : '❌'} [Non-existent Business] -> Status: ${notFoundRes.actualStatus} (Expected 404 Not Found)`);
  if (!notFoundRes.passed) console.log(`     Errors: ${notFoundRes.errors.join(', ')}`);

  // 3. Merged duplicate business should return 301 Redirect to primary
  const dupRes = await testPage(
    'Merged Duplicate Business',
    { biz: 'biz_atlas_1789859443844_ocx4v' },
    301,
    {
      isRedirect: true,
      expectedRedirectTarget: 'biz_atlas_1789859433981_gagii'
    }
  );
  testResults.push(dupRes);
  console.log(`  ${dupRes.passed ? '✅' : '❌'} [Merged Duplicate] -> Status: ${dupRes.actualStatus} (Expected 301 Permanent Redirect)`);
  if (!dupRes.passed) console.log(`     Errors: ${dupRes.errors.join(', ')}`);

  console.log('\n--- [TEST GROUP 5] Hostile Input & Injection Resistance ---');
  const hostileInputs = [
    { input: '<script>alert(1)</script>', label: 'XSS Script Tag' },
    { input: "'; DROP TABLE businesses; --", label: 'SQL Injection String' },
    { input: 'A'.repeat(300), label: 'Overly Long Query String (300 chars)' },
  ];
  for (const h of hostileInputs) {
    const res = await testPage(h.label, { biz: h.input }, 404);
    testResults.push(res);
    console.log(`  ${res.passed ? '✅' : '❌'} [${h.label}] -> Status: ${res.actualStatus} (Safely handled with 404)`);
    if (!res.passed) console.log(`     Errors: ${res.errors.join(', ')}`);
  }

  console.log('\n--- [TEST GROUP 6] Sitemap XML & Timestamp Verification ---');
  let sitemapXml = '';
  let sitemapStatus = 0;
  const mockSitemapRes: any = {
    setHeader: () => {},
    status: (code: number) => {
      sitemapStatus = code;
      return {
        send: (xml: string) => {
          sitemapXml = xml;
        }
      };
    }
  };

  await sitemapHandler({ headers: { host: 'www.dalilaak.com' } } as any, mockSitemapRes);

  const sitemapErrors: string[] = [];
  if (sitemapStatus !== 200) sitemapErrors.push(`Sitemap returned status ${sitemapStatus}`);
  if (!sitemapXml.includes('<urlset') || !sitemapXml.includes('</urlset>')) sitemapErrors.push('Missing valid <urlset> tags in sitemap');

  const locs = (sitemapXml.match(/<loc>(.*?)<\/loc>/g) || []).map((l) => l.replace(/<\/?loc>/g, ''));
  const lastmods = (sitemapXml.match(/<lastmod>(.*?)<\/lastmod>/g) || []).map((l) => l.replace(/<\/?lastmod>/g, ''));

  if (locs.length === 0) sitemapErrors.push('Sitemap has 0 URLs');
  if (locs.length !== lastmods.length) sitemapErrors.push(`Mismatch between loc count (${locs.length}) and lastmod count (${lastmods.length})`);

  // Check that lastmod is NOT identical to a single dynamic todayStr for all URLs
  const uniqueLastmods = new Set(lastmods);
  const todayStr = new Date().toISOString().slice(0, 10);
  const allToday = lastmods.every((d) => d === todayStr);

  if (uniqueLastmods.size <= 1 && allToday) {
    sitemapErrors.push(`FAIL: All sitemap URLs have dynamic build date "${todayStr}" instead of real modification timestamps`);
  }

  // Check that deleted business is NOT in sitemap
  if (sitemapXml.includes('biz_deleted_sample')) {
    sitemapErrors.push('FAIL: Deleted business "biz_deleted_sample" was found in the sitemap');
  }

  const sitemapPassed = sitemapErrors.length === 0;
  if (!sitemapPassed) suitePassed = false;

  console.log(`  ${sitemapPassed ? '✅' : '❌'} Sitemap Generation: ${locs.length} URLs | ${uniqueLastmods.size} distinct lastmod dates`);
  if (!sitemapPassed) console.log(`     Errors: ${sitemapErrors.join(', ')}`);

  console.log('\n═'.repeat(70));
  const totalTests = testResults.length + 1;
  const passedTests = testResults.filter((r) => r.passed).length + (sitemapPassed ? 1 : 0);
  console.log(`📊 FINAL RESULT: ${passedTests}/${totalTests} tests passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('═'.repeat(70));

  return suitePassed;
}

runSeoChecks()
  .then((success) => {
    if (!success) {
      console.error('\n❌ SEO Verification suite FAILED. See errors above.\n');
      process.exit(1);
    }
    console.log('\n✨ All SEO verification checks PASSED successfully.\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
