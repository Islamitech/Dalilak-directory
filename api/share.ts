import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

import { findPublicBusiness, findPublicBusinessWithStatus, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';

const DUPLICATE_REDIRECTS: Record<string, string> = {
  'biz_atlas_1789859443844_ocx4v': 'biz_atlas_1789859433981_gagii',
};

function escapeHtml(str: string): string {
  return (str || '').replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#039;';
      default: return m;
    }
  });
}


function resolveSchemaType(category?: string): string {
  if (!category || typeof category !== 'string') return 'LocalBusiness';
  const c = category.toLowerCase();
  if (c.includes('صيدل') || c.includes('أدوي') || c.includes('علاج')) return 'Pharmacy';
  if (c.includes('مطعم') || c.includes('مأكول') || c.includes('وجب') || c.includes('مشوي') || c.includes('بيتزا') || c.includes('برجر') || c.includes('شاورما') || c.includes('أسماك')) return 'Restaurant';
  if (c.includes('كافيه') || c.includes('مقهى') || c.includes('قهو')) return 'CafeOrCoffeeShop';
  if (c.includes('أسنان')) return 'Dentist';
  if (c.includes('طبي') || c.includes('عياد') || c.includes('دكتور') || c.includes('مستشف') || c.includes('بصري')) return 'MedicalBusiness';
  if (c.includes('سيار') || c.includes('ميكانيك') || c.includes('إطار') || c.includes('زيوت') || c.includes('غسيل سيار')) return 'AutoRepair';
  if (c.includes('سوبر') || c.includes('ماركت') || c.includes('بقال') || c.includes('أغذية')) return 'GroceryStore';
  if (c.includes('حلوي') || c.includes('مخبز') || c.includes('أفران') || c.includes('فطائر')) return 'Bakery';
  if (c.includes('حلاق') || c.includes('تجميل') || c.includes('كوافير') || c.includes('صالون')) return 'BeautySalon';
  return 'LocalBusiness';
}

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

let cachedTemplate = '';

function getBaseTemplate(): string {
  if (cachedTemplate) return cachedTemplate;

  const distPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    try {
      cachedTemplate = fs.readFileSync(distPath, 'utf8');
      return cachedTemplate;
    } catch {}
  }

  const indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexPath)) {
    try {
      return fs.readFileSync(indexPath, 'utf8');
    } catch {}
  }

  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawBizQuery = req.query.biz || req.query.id;
    const rawBiz = Array.isArray(rawBizQuery) ? rawBizQuery[0] : rawBizQuery;
    const rawPageQuery = req.query.page;
    const pageKey = Array.isArray(rawPageQuery) ? rawPageQuery[0] : (typeof rawPageQuery === 'string' ? rawPageQuery : '');

    const ALLOWED_HOSTS = new Set(['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173']);
    const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
    const host = ALLOWED_HOSTS.has(reqHost) ? reqHost : 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) === 'http' && host.includes('localhost') ? 'http' : 'https';
    const origin = `${proto}://${host}`;

    // 🌐 Institutional & High-Intent Static Page Server-Side Rendering
    const STATIC_PAGE_META: Record<string, { title: string; desc: string; path: string; heading: string }> = {
      about: {
        title: 'عن منصة دليلك ورسالتها الميدانية | منصة دليلك',
        desc: 'الرؤية والرسالة المؤسسية لمنظومة دليلك لتنظيم وتوثيق الوصول إلى الخدمات والأنشطة في محافظات مصر.',
        path: '/about',
        heading: 'عن منصة دليلك ورسالتها الميدانية',
      },
      privacy: {
        title: 'سياسة الخصوصية وحماية البيانات | منصة دليلك',
        desc: 'تعرف على سياسة الخصوصية لمنصة دليلك، معايير حماية البيانات الشخصية، وكيفية التعامل مع ملفات تعريف الارتباط وفق المعايير المعتمدة.',
        path: '/privacy',
        heading: 'سياسة الخصوصية وحماية البيانات',
      },
      pricing: {
        title: 'باقات النمو والتوثيق الميداني للأنشطة | منصة دليلك',
        desc: 'اكتشف باقات توثيق واعتماد المحلات والشركات، الفواتير الإلكترونية، وبطاقات الدعم الميداني في منصة دليلك.',
        path: '/pricing',
        heading: 'باقات التوثيق والنمو الميداني في دليلك',
      },
      'for-business': {
        title: 'أضف نشاطك التجاري مجاناً | منصة دليلك',
        desc: 'سجّل محلك أو خدمتك في منصة دليلك المعتمدة مجاناً واحصل على توثيق لموقعك على خرائط Google وتواصل مباشر مع العملاء.',
        path: '/for-business',
        heading: 'سجّل نشاطك التجاري في منصة دليلك',
      },
      search: {
        title: 'استكشف الأنشطة والخدمات المعتمدة | منصة دليلك',
        desc: 'دليل المحلات والأنشطة والخدمات المعتمدة في حدائق الأهرام ومحافظات مصر. تفاصيل العناوين، أرقام التواصل وساعات العمل.',
        path: '/search',
        heading: 'دليل المحلات والأنشطة التجارية والخدمات المعتمدة',
      },
      map: {
        title: 'الخريطة التفاعلية والمواقع الموثقة | منصة دليلك',
        desc: 'استكشف المحلات والأنشطة والخدمات الميدانية القريبة منك على الخريطة الحية المعتمدة في حدائق الأهرام ومصر.',
        path: '/map',
        heading: 'الخريطة التفاعلية للأنشطة والخدمات الميدانية',
      },
    };

    if (pageKey && STATIC_PAGE_META[pageKey]) {
      const pageInfo = STATIC_PAGE_META[pageKey];
      let pageTitle = pageInfo.title;
      let pageDesc = pageInfo.desc;
      let pageHeading = pageInfo.heading;
      let canonicalPageUrl = `${origin}${pageInfo.path}`;

      const rawCat = req.query.cat;
      const catParam = Array.isArray(rawCat) ? rawCat[0] : (typeof rawCat === 'string' ? rawCat : '');
      const rawZone = req.query.zone;
      const zoneParam = Array.isArray(rawZone) ? rawZone[0] : (typeof rawZone === 'string' ? rawZone : '');

      if (pageKey === 'search' && catParam) {
        const catMap: Record<string, string> = {
          food: 'المطاعم والكافيهات والمأكولات',
          grocery: 'السوبر ماركت والبقالة والتموين',
          health: 'العيادات والرعاية الصحية والصيدليات',
          fashion: 'الملابس والأزياء والإكسسوارات',
          electronics: 'الهواتف والإلكترونيات والكمبيوتر',
          automotive: 'السيارات والمركبات وخدمات الصيانة',
          'beauty-fitness': 'التجميل والعناية الشخصية واللياقة',
          crafts: 'الحرف والورش والصيانة الفنية المنزلية',
          home: 'الأثاث والديكور ومستلزمات المنزل',
          'professional-services': 'الشركات والخدمات والمكاتب المهنية',
        };
        const catLabel = catMap[catParam] || decodeURIComponent(catParam);
        pageTitle = `${catLabel} في مصر وحدائق الأهرام | منصة دليلك`;
        pageDesc = `دليل شامل وموثق لـ ${catLabel} في حدائق الأهرام ومصر. عناوين دقيقة، أرقام تواصل، ساعات عمل ومواقع Google Maps.`;
        pageHeading = `دليل ${catLabel} المعتمد`;
        const decodedCat = decodeURIComponent(catParam);
        canonicalPageUrl = `${origin}/search?cat=${encodeURIComponent(decodedCat)}`;
      } else if (pageKey === 'search' && zoneParam) {
        const decodedZone = decodeURIComponent(zoneParam);
        pageTitle = `دليل الأنشطة والخدمات في منطقة ${decodedZone}، حدائق الأهرام | منصة دليلك`;
        pageDesc = `استكشف المحلات والأنشطة والخدمات المعتمدة في منطقة ${decodedZone} بحدائق الأهرام. عناوين موثقة، أرقام تواصل ومواقع خرائط.`;
        pageHeading = `دليل منطقة ${decodedZone} - حدائق الأهرام`;
        canonicalPageUrl = `${origin}/search?zone=${encodeURIComponent(decodedZone)}`;
      }

      const ogImageUrl = `${origin}/og-image.jpg?v=2026_dalilak_v5_platform`;

      const jsonLdData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${canonicalPageUrl}#webpage`,
            url: canonicalPageUrl,
            name: pageTitle,
            description: pageDesc,
            inLanguage: 'ar',
            isPartOf: {
              '@type': 'WebSite',
              '@id': `${origin}/#website`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalPageUrl}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'منصة دليلك',
                item: `${origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: pageHeading,
                item: canonicalPageUrl,
              },
            ],
          },
        ],
      };
      const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLdData).replace(/</g, '\\u003c')}</script>`;

      let template = getBaseTemplate();
      if (!template) {
        template = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${escapeHtml(pageTitle)}</title></head><body><div id="root"></div></body></html>`;
      }

      let html = template.replace(/(src|href)="\.\//g, '$1="/');

      // Replace Meta Tags
      html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(pageTitle)}</title>`);
      html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(pageDesc)}" />`);

      // Open Graph Tags
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);

      // Twitter Tags
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`);
      html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(canonicalPageUrl)}" />`);
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);

      // Canonical URL
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />`);

      // Inject JSON-LD
      if (html.includes('</head>')) {
        html = html.replace('</head>', `  ${jsonLdTag}\n</head>`);
      }

      // Pre-rendered crawler snapshot
      const staticSnapshot = `
  <div id="root">
    <main class="dalilak-crawler-snapshot" dir="rtl" lang="ar" style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: 'Cairo', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6;">
      <article>
        <header style="border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0 0 0.5rem 0; color: #0f172a;">${escapeHtml(pageHeading)}</h1>
          <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;">${escapeHtml(pageDesc)}</p>
        </header>
        <section style="margin-bottom: 1.5rem;">
          <p>منصة دليلك هي الدليل المعتمد لاستكشاف وتوثيق المحلات والأنشطة التجارية والخدمات الميدانية في محافظات مصر.</p>
          <p><a href="/search" style="color: #d97706; font-weight: bold; text-decoration: none;">انتقل إلى دليل الأنشطة والبحث المباشر</a></p>
        </section>
        <footer style="border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.85rem; color: #64748b;">
          <p>منصة دليلك | الدليل المعتمد للأنشطة والخدمات الميدانية في مصر</p>
        </footer>
      </article>
    </main>
  </div>`;

      if (html.includes('<div id="root"></div>')) {
        html = html.replace('<div id="root"></div>', staticSnapshot);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(html);
    }

    if (!rawBiz || typeof rawBiz !== 'string') {
      const template = getBaseTemplate();
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    let decodedParam = '';
    try {
      decodedParam = decodeURIComponent(rawBiz).trim();
    } catch {
      return res.status(400).send('Bad Request');
    }

    // Hostile string protection (<script>, javascript:, overly long or dangerous tags)
    if (decodedParam.length > 250 || /<script|onload|onerror|javascript:|alert\(|<\/script>/i.test(decodedParam)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send('<!doctype html><html lang="ar"><head><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>');
    }

    // Extract canonical entity ID if embedded inside slug (e.g. "مطعم-أبو-خالد-biz_1788118588424" -> "biz_1788118588424")
    const idMatch = decodedParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
    const bizId = idMatch ? idMatch[1] : decodedParam;

    // Check duplicate redirects mapping (Phase E item 6: 301 redirect merged duplicates)
    if (DUPLICATE_REDIRECTS[bizId]) {
      const targetId = DUPLICATE_REDIRECTS[bizId];
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.redirect(301, `/biz/${encodeURIComponent(targetId)}`);
    }

    const lookup = await findPublicBusinessWithStatus(decodedParam);
    const template = getBaseTemplate();

    if (lookup.status === 'deleted') {
      const deletedHtml = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>النشاط غير متوفر | منصة دليلك</title>
  </head>
  <body style="font-family: 'Cairo', system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 1.5rem; background: #0f172a; color: #f8fafc;">
    <main style="max-width: 600px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155;">
      <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #f59e0b;">هذا النشاط لم يعد متاحاً</h1>
      <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem;">تمت إزالة هذا النشاط التجاري أو لم يعد متوفراً في دليل المنصة.</p>
      <a href="/search" style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: bold; text-decoration: none;">تصفح الأنشطة المعتمدة في دليلك</a>
    </main>
  </body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(410).send(deletedHtml);
    }

    const biz = lookup.business;

    if (!biz) {
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(404).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    let googleRatingEnabled = false;
    let googleRating: number | null = null;
    let googleReviewsCount: number | null = null;
    let googleMapsUrl: string | null = null;

    if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(biz.notes.trim());
        if (parsed && typeof parsed === 'object') {
          if (parsed.googleRatingEnabled) googleRatingEnabled = Boolean(parsed.googleRatingEnabled);
          if (parsed.googleRating !== undefined && parsed.googleRating !== null) googleRating = Number(parsed.googleRating);
          if (parsed.googleReviewsCount !== undefined && parsed.googleReviewsCount !== null) googleReviewsCount = Number(parsed.googleReviewsCount);
          if (parsed.googleMapsUrl || parsed.google_maps_url) googleMapsUrl = String(parsed.googleMapsUrl || parsed.google_maps_url).trim();
        }
      } catch {}
    }

    const nameAr = biz.name_ar || biz.name_en || 'نشاط تجاري معتمد';
    const category = biz.category || 'دليل الأنشطة والخدمات';
    const locationParts = [biz.city, biz.street, biz.governorate].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(' - ') : 'مصر';
    const phone = biz.phone || '';
    const secondaryPhone = biz.secondary_phone || '';
    const phones = [phone, secondaryPhone].filter(Boolean).join(' / ');

    // Google rating snippet for human-visible text (not emitted as structured aggregateRating)
    let ratingPart = '';
    if (googleRatingEnabled && googleRating) {
      const formattedRating = googleRating.toFixed(1);
      ratingPart = `⭐ تقييم Google: ${formattedRating}${googleReviewsCount ? ` (${googleReviewsCount} تقييم)` : ''}`;
    }

    const pageTitle = `${nameAr} | منصة دليلك المعتمدة`;
    const cleanPageTitle = pageTitle.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Business Description from "وصف الأنشطة والخدمات"
    const rawDesc = (biz.description || '').trim();

    // If description is short (or empty), include phones and location
    let descBody = '';
    if (rawDesc.length >= 35) {
      descBody = rawDesc;
      if (phones) {
        descBody += ` • تواصل: ${phones}`;
      }
    } else {
      const parts: string[] = [];
      if (rawDesc) parts.push(rawDesc);
      if (phones) parts.push(`تواصل: ${phones}`);
      parts.push(`${category} - ${locationStr}`);
      descBody = parts.join(' • ');
    }

    const shareDesc = [ratingPart, descBody].filter(Boolean).join(' • ');
    const cleanShareDesc = shareDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // SEO Content Fallback: use verified generated fields if approved, else fallback to standard fields
    const isApprovedSeo = (biz.seo_status === 'approved' || biz.seo_status === 'draft') && Boolean(biz.seo_title);
    const finalPageTitle = (isApprovedSeo && biz.seo_title ? String(biz.seo_title).trim() : cleanPageTitle);
    const finalShareDesc = (isApprovedSeo && biz.seo_description ? String(biz.seo_description).trim() : cleanShareDesc);
    const seoIntro = (isApprovedSeo && biz.seo_intro ? String(biz.seo_intro).trim() : '');
    const seoFaq: Array<{ question: string; answer: string }> = (isApprovedSeo && Array.isArray(biz.seo_faq) ? biz.seo_faq : []);

    // 🛡️ Resolve direct high-speed photo for OpenGraph preview (Strictly Direct 200 OK CDN)
    let coverPhoto: string | null = null;
    if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(biz.notes.trim());
        if (parsed && typeof parsed === 'object' && parsed.coverPhoto) {
          coverPhoto = parsed.coverPhoto;
        }
      } catch {}
    }

    let rawPhotos: string[] = [];
    if (Array.isArray(biz.photos)) {
      rawPhotos = biz.photos;
    } else if (typeof biz.photos === 'string' && biz.photos.trim().length > 0) {
      try {
        const p = JSON.parse(biz.photos.trim());
        if (Array.isArray(p)) rawPhotos = p;
        else if (typeof p === 'string') rawPhotos = [p];
      } catch {
        if (biz.photos.startsWith('http') || biz.photos.startsWith('data:')) rawPhotos = [biz.photos];
      }
    }
    const directPhoto = coverPhoto || (rawPhotos.length > 0 ? rawPhotos[0] : null);

    let ogImageUrl = '';
    let ogImageType = 'image/jpeg';
    if (typeof directPhoto === 'string' && (directPhoto.startsWith('https://') || directPhoto.startsWith('http://'))) {
      ogImageUrl = directPhoto;
      if (directPhoto.toLowerCase().includes('.png')) {
        ogImageType = 'image/png';
      } else if (directPhoto.toLowerCase().includes('.webp')) {
        ogImageType = 'image/webp';
      }
    } else {
      const photoVer = directPhoto ? directPhoto.length : (biz.created_at || '');
      ogImageUrl = `${origin}/api/biz-og?biz=${encodeURIComponent(biz.id)}${photoVer ? `&v=${encodeURIComponent(photoVer)}` : ''}`;
      ogImageType = 'image/png';
    }

    // Resolve clean semantic SEO slug
    const canonicalPageUrl = `${origin}/biz/${encodeURIComponent(publicBusinessSlug(biz))}`;

    const schemaType = resolveSchemaType(biz.category);
    const numLat = Number(biz.lat);
    const numLng = Number(biz.lng);
    const hasValidCoords = Number.isFinite(numLat) && Number.isFinite(numLng) && numLat !== 0 && numLng !== 0;
    const finalMapsUrl = googleMapsUrl || (hasValidCoords ? `https://www.google.com/maps?q=${numLat},${numLng}` : undefined);

    // Hard Safety Rule #2: NO FAKE RATINGS. aggregateRating omitted completely since platform reviews do not exist.
    // Price range omitted since no verified price level exists in the database.
    const jsonLdGraph: any[] = [
      {
        '@type': schemaType,
        '@id': `${canonicalPageUrl}#business`,
        name: nameAr,
        description: finalShareDesc,
        url: canonicalPageUrl,
        telephone: phone || undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: biz.city || undefined,
          addressRegion: biz.governorate || 'الجيزة',
          streetAddress: biz.street || undefined,
          addressCountry: 'EG',
        },
        image: ogImageUrl || undefined,
        ...(hasValidCoords ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: numLat,
            longitude: numLng,
          },
        } : {}),
        ...(biz.working_hours ? {
          openingHours: String(biz.working_hours).trim(),
        } : {}),
        ...(finalMapsUrl ? {
          hasMap: finalMapsUrl,
          sameAs: [finalMapsUrl],
        } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalPageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'منصة دليلك',
            item: `${origin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: biz.governorate || 'الجيزة',
            item: `${origin}/search`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: category,
            item: `${origin}/search?cat=${encodeURIComponent(category)}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: nameAr,
            item: canonicalPageUrl,
          },
        ],
      },
    ];

    if (seoFaq.length > 0) {
      jsonLdGraph.push({
        '@type': 'FAQPage',
        '@id': `${canonicalPageUrl}#faq`,
        mainEntity: seoFaq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }

    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': jsonLdGraph,
    };
    const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLdData).replace(/</g, '\\u003c')}</script>`;

    let html = template;

    if (!html) {
      html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(finalPageTitle)}</title>
    <meta name="title" content="${escapeHtml(finalPageTitle)}" />
    <meta name="description" content="${escapeHtml(finalShareDesc)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="منصة دليلك - Dalelak" />
    <meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />
    <meta property="og:title" content="${escapeHtml(finalPageTitle)}" />
    <meta property="og:description" content="${escapeHtml(finalShareDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:alt" content="${escapeHtml(`${nameAr} - ${category}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(finalPageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(finalShareDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />
    ${jsonLdTag}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body style="background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;">
      <h2>جاري تحويلك إلى ${escapeHtml(nameAr)}...</h2>
      <a href="/search">العودة إلى البحث</a>
    </div>
  </body>
</html>`;
    } else {
      html = html.replace(/(src|href)="\.\//g, '$1="/');

      // Replace Meta Tags
      html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(finalPageTitle)}</title>`);
      html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(finalPageTitle)}" />`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(finalShareDesc)}" />`);

      // Open Graph Tags
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(finalPageTitle)}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(finalShareDesc)}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:type"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:type" content="${ogImageType}" />`);
      html = html.replace(/<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:alt" content="${escapeHtml(`${nameAr} - ${category}`)}" />`);

      // Twitter Tags
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(finalPageTitle)}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(finalShareDesc)}" />`);
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(canonicalPageUrl)}" />`);

      // Canonical URL
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />`);

      // Inject Schema.org structured data before closing head
      if (html.includes('</head>')) {
        html = html.replace('</head>', `  ${jsonLdTag}\n</head>`);
      }

      // Inject Semantic HTML Snapshot for Search Engines (Wave 1 Pre-rendering)
      const semanticSnapshotHtml = `
  <div id="root">
    <main class="dalilak-crawler-snapshot" dir="rtl" lang="ar" style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: 'Cairo', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6;">
      <article>
        <header style="border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0 0 0.5rem 0; color: #0f172a;">${escapeHtml(nameAr)}</h1>
          <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;"><strong>التصنيف المعتمد:</strong> ${escapeHtml(category)}</p>
          <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;"><strong>العنوان والنطاق:</strong> ${escapeHtml(locationStr)}</p>
          ${googleRating && googleRating >= 1 ? `<p style="margin: 0.25rem 0; font-size: 0.95rem; color: #d97706;"><strong>تقييم Google الموثق:</strong> ⭐ ${googleRating.toFixed(1)} (${googleReviewsCount || 1} تقييم)</p>` : ''}
        </header>
        <section style="margin-bottom: 1.5rem;">
          ${seoIntro ? `
          <div style="margin: 1.25rem 0; padding: 1rem; background: #f8fafc; border-right: 4px solid #f59e0b; border-radius: 4px;">
            <h2 style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem 0;">نبذة موثقة عن النشاط</h2>
            <p style="color: #334155; margin: 0; line-height: 1.7; font-size: 0.95rem;">${escapeHtml(seoIntro)}</p>
          </div>` : ''}
          ${phone ? `<p style="margin: 0.5rem 0;"><strong>رقم الهاتف المباشر:</strong> <a href="tel:${escapeHtml(phone)}" style="color: #d97706; font-weight: bold; text-decoration: none;">${escapeHtml(phone)}</a></p>` : ''}
          ${biz.working_hours ? `<p style="margin: 0.5rem 0;"><strong>ساعات العمل:</strong> ${escapeHtml(String(biz.working_hours))}</p>` : ''}
          ${biz.description ? `<div style="margin: 1rem 0;"><h2 style="font-size: 1.15rem; font-weight: 800; color: #1e293b;">نبذة عن النشاط</h2><p style="color: #334155; margin: 0.25rem 0;">${escapeHtml(String(biz.description))}</p></div>` : ''}
          ${seoFaq.length > 0 ? `
          <div style="margin: 1.5rem 0;">
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0 0 0.75rem 0;">الأسئلة الشائعة والمعلومات الموثقة</h2>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${seoFaq.map((f) => `
                <div style="background: #f1f5f9; padding: 0.75rem 1rem; border-radius: 6px;">
                  <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0;">${escapeHtml(f.question)}</h3>
                  <p style="color: #475569; margin: 0; font-size: 0.9rem;">${escapeHtml(f.answer)}</p>
                </div>
              `).join('')}
            </div>
          </div>` : ''}
          ${finalMapsUrl ? `<p style="margin: 1rem 0;"><a href="${escapeHtml(finalMapsUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; text-decoration: none;">عرض الموقع على خرائط Google Maps</a></p>` : ''}
        </section>
        <footer style="border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.85rem; color: #64748b;">
          <p>منصة دليلك | الدليل المعتمد للأنشطة والخدمات الميدانية في مصر</p>
        </footer>
      </article>
    </main>
  </div>`;

      if (html.includes('<div id="root"></div>')) {
        html = html.replace('<div id="root"></div>', semanticSnapshotHtml);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Error in share handler:', err);
    return res.redirect(302, '/');
  }
}
