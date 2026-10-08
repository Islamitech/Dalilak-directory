import type { VercelRequest, VercelResponse } from '@vercel/node';

import { findPublicBusiness, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';
import { resolveRequestOrigin } from '../src/server/httpSecurity.js';
import { slugify } from '../src/server/share/template.js';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
    const origin = escapeXml(resolveRequestOrigin(reqHost, req.headers['x-forwarded-proto'] as string | undefined));

    const businesses = await loadPublicDirectory();

    const BASELINE_DEPLOY_DATE = '2026-10-04';

    // Core institutional and high-intent exploratory routes
    // REAL lastmod dates reflecting actual page updates/release, NOT dynamic today date
    const staticRoutes = [
      { path: '/', lastmod: '2026-10-04' },
      { path: '/search', lastmod: '2026-10-04' },
      { path: '/map', lastmod: '2026-10-04' },
      { path: '/pricing', lastmod: '2026-10-04' },
      { path: '/for-business', lastmod: '2026-10-04' },
      { path: '/about', lastmod: '2026-10-04' },
      { path: '/privacy', lastmod: '2026-10-04' },
      // Top category explorations
      { path: '/search?cat=food', lastmod: '2026-10-04' },
      { path: '/search?cat=grocery', lastmod: '2026-10-04' },
      { path: '/search?cat=health', lastmod: '2026-10-04' },
      { path: '/search?cat=automotive', lastmod: '2026-10-04' },
      { path: '/search?cat=crafts', lastmod: '2026-10-04' },
      { path: '/search?cat=electronics', lastmod: '2026-10-04' },
      { path: '/search?cat=beauty-fitness', lastmod: '2026-10-04' },
      { path: '/search?cat=fashion', lastmod: '2026-10-04' },
      { path: '/search?cat=home', lastmod: '2026-10-04' },
      { path: '/search?cat=professional-services', lastmod: '2026-10-04' },
      // Key Hadayek Al-Ahram Gate explorations
      { path: '/search?zone=%D8%A3', lastmod: '2026-10-04' },
      { path: '/search?zone=%D8%A8', lastmod: '2026-10-04' },
      { path: '/search?zone=%D8%AC', lastmod: '2026-10-04' },
      { path: '/search?zone=%D8%AF', lastmod: '2026-10-04' },
    ];

    const urls: string[] = staticRoutes.map((r) => 
`  <url>
    <loc>${escapeXml(`${origin}${r.path}`)}</loc>
    <lastmod>${r.lastmod}</lastmod>
  </url>`
    );

    for (const biz of businesses) {
      if (biz.is_deleted || biz.isDeleted) continue;
      let isPublished = true;
      let customSlug = '';
      let coverPhoto = '';

      if (typeof biz.notes === 'string' && biz.notes.startsWith('{')) {
        try {
          const parsed = JSON.parse(biz.notes);
          if (parsed.publishedStatus === 'draft' || parsed.publishedStatus === 'unlisted') {
            isPublished = false;
          }
          if (parsed.customDirectoryUrl) {
            customSlug = String(parsed.customDirectoryUrl).replace(/^\/biz\//, '').replace(/^\//, '');
          }
          if (parsed.coverPhoto) {
            coverPhoto = String(parsed.coverPhoto);
          }
        } catch {}
      }

      if (!isPublished) continue;

      const rawName = biz.name_ar || biz.name_en || 'نشاط';
      const nameSlug = slugify(rawName) || 'نشاط';
      const citySlug = biz.city ? slugify(biz.city) : '';
      const locPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
      const fullSlug = publicBusinessSlug(biz);
      const locUrl = `${origin}/biz/${encodeURIComponent(fullSlug)}`;
      // Real lastmod timestamp from seo_generated_at / updated_at / created_at (not dynamic todayStr)
      const lastMod = (biz.seo_generated_at || biz.updated_at || biz.created_at || BASELINE_DEPLOY_DATE).slice(0, 10);

      // Collect primary photos for Image Sitemap
      const primaryPhoto = coverPhoto || (Array.isArray(biz.photos) && biz.photos.length > 0 ? biz.photos[0] : null);
      let imageTag = '';
      if (primaryPhoto && typeof primaryPhoto === 'string' && primaryPhoto.startsWith('http')) {
        imageTag = `
    <image:image>
      <image:loc>${escapeXml(primaryPhoto)}</image:loc>
      <image:title>${escapeXml(rawName)}</image:title>
      <image:caption>${escapeXml(`${rawName} - ${biz.category || 'نشاط معتمد'} في ${biz.city || 'حدائق الأهرام'}`)}</image:caption>
    </image:image>`;
      }

      urls.push(`  <url>
    <loc>${locUrl}</loc>
    <lastmod>${lastMod}</lastmod>${imageTag}
  </url>`);
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
    return res.status(200).send(sitemapXml);

  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
