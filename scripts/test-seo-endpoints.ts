process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://fixture.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-dalilak';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.includes('/rest/v1/businesses')) {
    const fixtureRows = [
      {
        id: 'biz_fixture_1',
        name_ar: 'نشاط تجريبي',
        category: 'المطاعم والكافيهات',
        city: 'حدائق الأهرام',
        street: 'منطقة أ',
        verification_status: 'verified',
        package_id: 'pkg_basic',
        created_at: new Date().toISOString(),
        notes: JSON.stringify({ publishedStatus: 'published', customDirectoryUrl: 'biz-fixture-1' }),
      },
    ];
    return new Response(JSON.stringify(fixtureRows), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-range': '0-0/1',
      },
    });
  }
  return originalFetch(input, init);
};

async function runTests() {
  const { default: sitemapHandler } = await import('../api/sitemap.js');
  const { default: shareHandler } = await import('../api/share.js');
  console.log('--- 1. Testing Sitemap Generation ---');
  let sitemapOutput = '';
  let sitemapStatus = 0;
  const mockSitemapRes: any = {
    setHeader: () => {},
    status: (code: number) => {
      sitemapStatus = code;
      return {
        send: (xml: string) => {
          sitemapOutput = xml;
        }
      };
    }
  };

  await sitemapHandler({ headers: { host: 'www.dalilaak.com' } } as any, mockSitemapRes);
  console.log('Sitemap status:', sitemapStatus);
  console.log('Sitemap contains <urlset>:', sitemapOutput.includes('<urlset'));
  console.log('Sitemap contains /pricing:', sitemapOutput.includes('<loc>https://www.dalilaak.com/pricing</loc>'));
  console.log('Sitemap contains cat=food:', sitemapOutput.includes('cat=food'));
  console.log('Sitemap contains zone=أ:', sitemapOutput.includes('zone=%D8%A3'));
  console.log('Sitemap total URLs approx:', (sitemapOutput.match(/<url>/g) || []).length);

  console.log('\n--- 2. Testing Static Page Share Generation ---');
  const testPages = ['about', 'pricing', 'for-business', 'search', 'map'];
  for (const page of testPages) {
    let htmlOutput = '';
    let pageStatus = 0;
    const mockShareRes: any = {
      setHeader: () => {},
      status: (code: number) => {
        pageStatus = code;
        return {
          send: (html: string) => {
            htmlOutput = html;
          }
        };
      },
      redirect: (code: number, url: string) => {
        console.error(`Page ${page} redirected to ${url}`);
      }
    };

    await shareHandler({
      query: { page },
      headers: { host: 'www.dalilaak.com' }
    } as any, mockShareRes);

    const titleMatch = htmlOutput.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'NONE';
    const canonicalMatch = htmlOutput.match(/<link\s+rel="canonical"\s+href="(.*?)"/);
    const canonical = canonicalMatch ? canonicalMatch[1] : 'NONE';
    const hasCrawlerSnapshot = htmlOutput.includes('dalilak-crawler-snapshot');
    const hasJsonLd = htmlOutput.includes('application/ld+json');

    console.log(`Page [/${page}] -> Status: ${pageStatus}, Title: "${title}", Canonical: "${canonical}", Snapshot: ${hasCrawlerSnapshot}, JSON-LD: ${hasJsonLd}`);
  }

  console.log('\n--- 3. Testing Category-Specific Search SEO ---');
  let searchHtml = '';
  let searchStatus = 0;
  const mockCatRes: any = {
    setHeader: () => {},
    status: (code: number) => {
      searchStatus = code;
      return {
        send: (html: string) => {
          searchHtml = html;
        }
      };
    }
  };

  await shareHandler({
    query: { page: 'search', cat: 'food' },
    headers: { host: 'www.dalilaak.com' }
  } as any, mockCatRes);

  const catTitleMatch = searchHtml.match(/<title>(.*?)<\/title>/);
  console.log('Search ?cat=food Title:', catTitleMatch ? catTitleMatch[1] : 'NONE');
  console.log('Search has crawler snapshot:', searchHtml.includes('المطاعم والكافيهات والمأكولات'));
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
