# Source: api/sitemap.ts

``typescript
   1: import type { VercelRequest, VercelResponse } from '@vercel/node';
   2: 
   3: import { findPublicBusiness, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';
   4: 
   5: function slugify(name?: string): string {
   6:   if (!name || typeof name !== 'string') return '';
   7:   return name
   8:     .trim()
   9:     .replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
  10:     .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  11:     .replace(/[Ø£Ø¥Ø¢Ù±]/g, 'Ø§')
  12:     .replace(/Ø©/g, 'Ù‡')
  13:     .replace(/Ù‰/g, 'ÙŠ')
  14:     .replace(/[Â«Â»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`ØŒØ›ØŸÙª_]/g, ' ')
  15:     .replace(/\s+/g, '-')
  16:     .replace(/-+/g, '-')
  17:     .replace(/^-+|-+$/g, '')
  18:     .split('-')
  19:     .filter(Boolean)
  20:     .slice(0, 7)
  21:     .join('-');
  22: }
  23: 
  24: function escapeXml(str: string): string {
  25:   return (str || '')
  26:     .replace(/&/g, '&amp;')
  27:     .replace(/</g, '&lt;')
  28:     .replace(/>/g, '&gt;')
  29:     .replace(/"/g, '&quot;')
  30:     .replace(/'/g, '&apos;');
  31: }
  32: 
  33: export default async function handler(req: VercelRequest, res: VercelResponse) {
  34:   try {
  35:     const ALLOWED_HOSTS = ['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173'];
  36:     const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
  37:     const host = ALLOWED_HOSTS.includes(reqHost) || reqHost.endsWith('.vercel.app') ? reqHost : 'www.dalilaak.com';
  38:     const proto = (req.headers['x-forwarded-proto'] as string) === 'http' && host.includes('localhost') ? 'http' : 'https';
  39:     const origin = escapeXml(`${proto}://${host}`);
  40: 
  41:     const businesses = await loadPublicDirectory();
  42: 
  43:     const todayStr = new Date().toISOString().slice(0, 10);
  44: 
  45:     // Core institutional and exploratory routes
  46:     const staticRoutes = [
  47:       { path: '/', lastmod: todayStr },
  48:       { path: '/search', lastmod: todayStr },
  49:       { path: '/map', lastmod: todayStr },
  50:       { path: '/pricing', lastmod: todayStr },
  51:       { path: '/for-business', lastmod: todayStr },
  52:       { path: '/about', lastmod: todayStr },
  53:       // Top category explorations
  54:       { path: '/search?cat=food', lastmod: todayStr },
  55:       { path: '/search?cat=grocery', lastmod: todayStr },
  56:       { path: '/search?cat=health', lastmod: todayStr },
  57:       { path: '/search?cat=automotive', lastmod: todayStr },
  58:       { path: '/search?cat=crafts', lastmod: todayStr },
  59:       { path: '/search?cat=electronics', lastmod: todayStr },
  60:       { path: '/search?cat=beauty-fitness', lastmod: todayStr },
  61:       { path: '/search?cat=fashion', lastmod: todayStr },
  62:       { path: '/search?cat=home', lastmod: todayStr },
  63:       { path: '/search?cat=professional-services', lastmod: todayStr },
  64:       // Key Hadayek Al-Ahram Gate explorations
  65:       { path: '/search?zone=%D8%A3', lastmod: todayStr },
  66:       { path: '/search?zone=%D8%A8', lastmod: todayStr },
  67:       { path: '/search?zone=%D8%AC', lastmod: todayStr },
  68:       { path: '/search?zone=%D8%AF', lastmod: todayStr },
  69:     ];
  70: 
  71:     const urls: string[] = staticRoutes.map((r) => 
  72: `  <url>
  73:     <loc>${escapeXml(`${origin}${r.path}`)}</loc>
  74:     <lastmod>${r.lastmod}</lastmod>
  75:   </url>`
  76:     );
  77: 
  78:     for (const biz of businesses) {
  79:       let isPublished = true;
  80:       let customSlug = '';
  81:       let coverPhoto = '';
  82: 
  83:       if (typeof biz.notes === 'string' && biz.notes.startsWith('{')) {
  84:         try {
  85:           const parsed = JSON.parse(biz.notes);
  86:           if (parsed.publishedStatus === 'draft' || parsed.publishedStatus === 'unlisted') {
  87:             isPublished = false;
  88:           }
  89:           if (parsed.customDirectoryUrl) {
  90:             customSlug = String(parsed.customDirectoryUrl).replace(/^\/biz\//, '').replace(/^\//, '');
  91:           }
  92:           if (parsed.coverPhoto) {
  93:             coverPhoto = String(parsed.coverPhoto);
  94:           }
  95:         } catch {}
  96:       }
  97: 
  98:       if (!isPublished) continue;
  99: 
 100:       const rawName = biz.name_ar || biz.name_en || 'Ù†Ø´Ø§Ø·';
 101:       const nameSlug = slugify(rawName) || 'Ù†Ø´Ø§Ø·';
 102:       const citySlug = biz.city ? slugify(biz.city) : '';
 103:       const locPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
 104:       const fullSlug = publicBusinessSlug(biz);
 105:       const locUrl = `${origin}/biz/${encodeURIComponent(fullSlug)}`;
 106:       const lastMod = (biz.updated_at || biz.created_at || todayStr).slice(0, 10);
 107: 
 108:       // Collect primary photos for Image Sitemap
 109:       const primaryPhoto = coverPhoto || (Array.isArray(biz.photos) && biz.photos.length > 0 ? biz.photos[0] : null);
 110:       let imageTag = '';
 111:       if (primaryPhoto && typeof primaryPhoto === 'string' && primaryPhoto.startsWith('http')) {
 112:         imageTag = `
 113:     <image:image>
 114:       <image:loc>${escapeXml(primaryPhoto)}</image:loc>
 115:       <image:title>${escapeXml(rawName)}</image:title>
 116:       <image:caption>${escapeXml(`${rawName} - ${biz.category || 'Ù†Ø´Ø§Ø· Ù…Ø¹ØªÙ…Ø¯'} ÙÙŠ ${biz.city || 'Ø­Ø¯Ø§Ø¦Ù‚ Ø§Ù„Ø£Ù‡Ø±Ø§Ù…'}`)}</image:caption>
 117:     </image:image>`;
 118:       }
 119: 
 120:       urls.push(`  <url>
 121:     <loc>${locUrl}</loc>
 122:     <lastmod>${lastMod}</lastmod>${imageTag}
 123:   </url>`);
 124:     }
 125: 
 126:     const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
 127: <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
 128:         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
 129: ${urls.join('\n')}
 130: </urlset>`;
 131: 
 132:     res.setHeader('Content-Type', 'application/xml; charset=utf-8');
 133:     res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
 134:     return res.status(200).send(sitemapXml);
 135: 
 136:   } catch (err) {
 137:     console.error('Error generating sitemap:', err);
 138:     res.setHeader('Content-Type', 'application/xml; charset=utf-8');
 139:     res.setHeader('Cache-Control','no-store');
 140:     return res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
 141:   }
 142: }
``
