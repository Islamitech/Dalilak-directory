import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

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

  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawBizQuery = req.query.biz || req.query.id;
    const rawBiz = Array.isArray(rawBizQuery) ? rawBizQuery[0] : rawBizQuery;
    const ALLOWED_HOSTS = ['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173'];
    const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
    const host = ALLOWED_HOSTS.includes(reqHost) || reqHost.endsWith('.vercel.app') ? reqHost : 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) === 'http' && host.includes('localhost') ? 'http' : 'https';
    const origin = `${proto}://${host}`;

    if (!rawBiz || typeof rawBiz !== 'string') {
      const template = getBaseTemplate();
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    const decodedParam = decodeURIComponent(rawBiz).trim();
    // Extract canonical entity ID if embedded inside slug (e.g. "مطعم-أبو-خالد-biz_1788118588424" -> "biz_1788118588424")
    const idMatch = decodedParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
    const bizId = idMatch ? idMatch[1] : decodedParam;

    // Fetch business from Supabase
    const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(bizId)}&select=id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,working_hours,description,photos,notes,lat,lng`;
    const dbRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
    });

    let biz: any = null;
    if (dbRes.ok) {
      const rows = await dbRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        biz = rows[0];
      }
    }

    // Fallback: If no business found by ID and no standard ID was present in slug, search by Arabic name
    if (!biz && !idMatch) {
      const cleanName = decodedParam.replace(/-/g, ' ').trim();
      const searchUrl = `${SUPABASE_URL}/rest/v1/businesses?name_ar=ilike.%25${encodeURIComponent(cleanName)}%25&select=id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,working_hours,description,photos,notes,lat,lng&limit=1`;
      try {
        const searchRes = await fetch(searchUrl, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Accept: 'application/json',
          },
        });
        if (searchRes.ok) {
          const searchRows = await searchRes.json();
          if (Array.isArray(searchRows) && searchRows.length > 0) {
            biz = searchRows[0];
          }
        }
      } catch {}
    }

    const template = getBaseTemplate();

    if (!biz) {
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
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

    // Google rating snippet
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
      // Meaningful rich description entered by the user
      descBody = rawDesc;
      if (phones) {
        descBody += ` • تواصل: ${phones}`;
      }
    } else {
      // Short or empty description: prominently show phones + category + location
      const parts: string[] = [];
      if (rawDesc) parts.push(rawDesc);
      if (phones) parts.push(`تواصل: ${phones}`);
      parts.push(`${category} - ${locationStr}`);
      descBody = parts.join(' • ');
    }

    const shareDesc = [ratingPart, descBody].filter(Boolean).join(' • ');
    const cleanShareDesc = shareDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

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

    // ⚡ WhatsApp, Facebook & iMessage strictly mandate direct 200 OK image URLs.
    // If the venue has an enhanced Supabase/CDN photo URL, use it directly!
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
      // Fallback: Dynamic branded card generator
      const photoVer = directPhoto ? directPhoto.length : (biz.created_at || '');
      ogImageUrl = `${origin}/api/biz-og?biz=${encodeURIComponent(biz.id)}${photoVer ? `&v=${encodeURIComponent(photoVer)}` : ''}`;
      ogImageType = 'image/png';
    }

    // Resolve clean semantic SEO slug
    let customSlug = '';
    if (typeof biz.notes === 'string' && biz.notes.includes('customDirectoryUrl')) {
      try {
        const parsed = JSON.parse(biz.notes);
        if (parsed.customDirectoryUrl) customSlug = parsed.customDirectoryUrl;
      } catch {}
    }
    const nameSlug = slugify(nameAr) || 'نشاط';
    const citySlug = biz.city ? slugify(biz.city) : '';
    const locPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
    const canonicalPageUrl = `${origin}/biz/${biz.id}`;
    const pageUrl = canonicalPageUrl;

    const schemaType = resolveSchemaType(biz.category);
    const numLat = Number(biz.lat);
    const numLng = Number(biz.lng);
    const hasValidCoords = Number.isFinite(numLat) && Number.isFinite(numLng) && numLat !== 0 && numLng !== 0;
    const finalMapsUrl = googleMapsUrl || (hasValidCoords ? `https://www.google.com/maps?q=${numLat},${numLng}` : undefined);

    const jsonLdGraph: any[] = [
      {
        '@type': schemaType,
        '@id': `${canonicalPageUrl}#business`,
        name: nameAr,
        description: cleanShareDesc,
        url: canonicalPageUrl,
        telephone: phone || undefined,
        priceRange: '$',
        currenciesAccepted: 'EGP',
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
        ...(googleRating && googleRating >= 1 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: googleRating.toFixed(1),
            reviewCount: googleReviewsCount || 1,
            bestRating: '5',
            worstRating: '1',
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

    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': jsonLdGraph,
    };
    const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLdData).replace(/</g, '\\u003c')}</script>`;

    let html = template;

    if (!html) {
      // Minimal standalone fallback HTML if no template found on disk
      html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cleanPageTitle)}</title>
    <meta name="title" content="${escapeHtml(cleanPageTitle)}" />
    <meta name="description" content="${escapeHtml(cleanShareDesc)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="منصة دليلك - Dalelak" />
    <meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />
    <meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />
    <meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:alt" content="${escapeHtml(nameAr)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />
    ${jsonLdTag}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body style="background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;">
      <h2>جاري تحويلك إلى ${escapeHtml(nameAr)}...</h2>
      <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
    </div>
  </body>
</html>`;
    } else {
      // Fix relative paths for assets
      html = html.replace(/(src|href)="\.\//g, '$1="/');

      // Replace Meta Tags
      html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(cleanPageTitle)}</title>`);
      html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(cleanShareDesc)}" />`);

      // Open Graph Tags
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:type"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:type" content="${ogImageType}" />`);
      html = html.replace(/<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:alt" content="${escapeHtml(nameAr)}" />`);

      // Twitter Tags
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />`);
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
          ${phone ? `<p style="margin: 0.5rem 0;"><strong>رقم الهاتف المباشر:</strong> <a href="tel:${escapeHtml(phone)}" style="color: #d97706; font-weight: bold; text-decoration: none;">${escapeHtml(phone)}</a></p>` : ''}
          ${biz.working_hours ? `<p style="margin: 0.5rem 0;"><strong>ساعات العمل:</strong> ${escapeHtml(String(biz.working_hours))}</p>` : ''}
          ${biz.description ? `<div style="margin: 1rem 0;"><h2 style="font-size: 1.15rem; font-weight: 800; color: #1e293b;">نبذة عن النشاط</h2><p style="color: #334155; margin: 0.25rem 0;">${escapeHtml(String(biz.description))}</p></div>` : ''}
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
