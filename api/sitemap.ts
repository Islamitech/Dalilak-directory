import type { VercelRequest, VercelResponse } from '@vercel/node';

import { findPublicBusiness, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';

function slugify(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`،؛؟٪_]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 7)
    .join('-');
}

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
    const ALLOWED_HOSTS = new Set(['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173']);
    const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
    const host = ALLOWED_HOSTS.has(reqHost) ? reqHost : 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) === 'http' && host.includes('localhost') ? 'http' : 'https';
    const origin = escapeXml(`${proto}://${host}`);

    const businesses = await loadPublicDirectory();

    const todayStr = new Date().toISOString().slice(0, 10);

    // Core institutional and exploratory routes
    const staticRoutes = [
      { path: '/', lastmod: todayStr },
      { path: '/search', lastmod: todayStr },
      { path: '/map', lastmod: todayStr },
      { path: '/pricing', lastmod: todayStr },
      { path: '/for-business', lastmod: todayStr },
      { path: '/about', lastmod: todayStr },
      // Top category explorations
      { path: '/search?cat=food', lastmod: todayStr },
      { path: '/search?cat=grocery', lastmod: todayStr },
      { path: '/search?cat=health', lastmod: todayStr },
      { path: '/search?cat=automotive', lastmod: todayStr },
      { path: '/search?cat=crafts', lastmod: todayStr },
      { path: '/search?cat=electronics', lastmod: todayStr },
      { path: '/search?cat=beauty-fitness', lastmod: todayStr },
      { path: '/search?cat=fashion', lastmod: todayStr },
      { path: '/search?cat=home', lastmod: todayStr },
      { path: '/search?cat=professional-services', lastmod: todayStr },
      // Key Hadayek Al-Ahram Gate explorations
      { path: '/search?zone=%D8%A3', lastmod: todayStr },
      { path: '/search?zone=%D8%A8', lastmod: todayStr },
      { path: '/search?zone=%D8%AC', lastmod: todayStr },
      { path: '/search?zone=%D8%AF', lastmod: todayStr },
    ];

    const urls: string[] = staticRoutes.map((r) => 
`  <url>
    <loc>${escapeXml(`${origin}${r.path}`)}</loc>
    <lastmod>${r.lastmod}</lastmod>
  </url>`
    );

    for (const biz of businesses) {
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
      const lastMod = (biz.updated_at || biz.created_at || todayStr).slice(0, 10);

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
