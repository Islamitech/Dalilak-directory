import { Business } from '../types';
import { getPublicDirectoryUrl } from './directoryUrl';

/**
 * Calculates real geographical distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into localized Arabic readable string (e.g., "350 م" or "2.4 كم")
 */
export function formatDistanceString(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

export interface OpenStatusResult {
  isOpen: boolean;
  badgeText: string;
  is24Hours: boolean;
  statusClass: string;
  dotColor: string;
}

/**
 * Parses working hours and determines if business is currently open
 */
export function getBusinessOpenStatus(workingHours?: string, now = new Date()): OpenStatusResult {
 const result=(isOpen:boolean,badgeText:string,is24Hours=false):OpenStatusResult=>({isOpen,badgeText,is24Hours,statusClass:isOpen?'bg-emerald-500/15 text-emerald-600 border-emerald-500/30':'bg-slate-100 text-slate-600 border-slate-200',dotColor:isOpen?'bg-emerald-500':'bg-slate-400'});
 const unknown=()=>result(false,'ساعات العمل غير متاحة');
 if(!workingHours?.trim())return unknown();
 const clean=workingHours.toLowerCase().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\u064B-\u065F\u0670\u0640]/g,'').trim();
 if(/مغلق|تحت الصيانة|closed/.test(clean))return result(false,'مغلق حالياً');
 if(/24\s*(?:ساعة|ساعه|hours?|\/\s*7)|مدار الساعة|طوال اليوم|طوال الوقت/.test(clean))return result(true,'مفتوح 24 ساعة',true);
 // Unstructured weekly schedules need an explicit day model; do not guess from the first pair.
 if(/السبت|الاحد|الأحد|الاثنين|الإثنين|الثلاثاء|الاربعاء|الأربعاء|الخميس|الجمعة/.test(clean))return unknown();
 const matches=[...clean.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(صباحا?|مساء|am|pm|ص|م)?/g)];
 if(matches.length!==2)return unknown();
 const minutes=matches.map(m=>{let h=Number(m[1]);const min=Number(m[2]||0);if(min>59||h>24||(h===24&&min!==0))return NaN;const period=m[3];if(period){if(h<1||h>12)return NaN;h=h%12+(/^(م|مساء|pm)/.test(period)?12:0);}return h*60+min;});
 if(minutes.some(n=>!Number.isFinite(n))||minutes[0]===minutes[1])return unknown();
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const current=Number(parts.find(p=>p.type==='hour')?.value)*60+Number(parts.find(p=>p.type==='minute')?.value);
 const [open,close]=minutes;const isOpen=close>open?current>=open&&current<close:current>=open||current<close;
 return result(isOpen,isOpen?'مفتوح الآن':'مغلق حالياً');
}

/**
 * Generates and triggers downloading of a standardized vCard (.vcf)
 * Allows users to add the business to their smartphone contacts instantly.
 */
export function downloadBusinessVCard(biz: Business): void {
  const name = biz.nameAr || biz.nameEn || 'منشأة معتمدة';
  const phone = biz.phone || biz.secondaryPhone || '';
  const street = biz.street || '';
  const city = biz.city || '';
  const gov = biz.governorate || '';
  const mapsUrl = biz.googleMapsUrl || (biz.lat && biz.lng ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}` : '');
  const directoryUrl = getPublicDirectoryUrl(biz);
  const note = `منصة دليلك المعتمدة | ${biz.category} | ${biz.workingHours || ''}`;

  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${name}`,
    `ORG;CHARSET=UTF-8:${name} - ${biz.category}`,
    `TITLE;CHARSET=UTF-8:${biz.category}`,
    phone ? `TEL;TYPE=WORK,VOICE:${phone}` : '',
    biz.secondaryPhone ? `TEL;TYPE=CELL,VOICE:${biz.secondaryPhone}` : '',
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${street};${city};${gov};;مصر`,
    directoryUrl ? `URL;TYPE=DIRECTORY:${directoryUrl}` : '',
    mapsUrl ? `URL;TYPE=MAP:${mapsUrl}` : '',
    `NOTE;CHARSET=UTF-8:${note}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFileName = `${name.replace(/[\\/:*?"<>|]/g, '_')}.vcf`;
  link.setAttribute('download', safeFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Smart contextual WhatsApp message generator tuned to business category
 */
export function getSmartWhatsAppUrl(biz: Business): string {
  const targetPhone = (biz.whatsapp || biz.phone || '')
    .replace(/\D/g, '')
    .replace(/^0/, '');

  if (!targetPhone) return '';

  const cat = (biz.category || '').toLowerCase();
  let message = '';

  if (cat.includes('مطعم') || cat.includes('كافيه') || cat.includes('حلويات') || cat.includes('أغذية') || cat.includes('مأكولات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن قائمة الأسعار (المنيو) ومواعيد التوصيل في "${biz.nameAr}" عبر منصة دليلك.`;
  } else if (cat.includes('طبيب') || cat.includes('عيادة') || cat.includes('مستشفى') || cat.includes('صيدلية') || cat.includes('أسنان') || cat.includes('عيادات')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن مواعيد الكشف والحجز في "${biz.nameAr}" المعروض على منصة دليلك.`;
  } else if (cat.includes('صيانة') || cat.includes('حرف') || cat.includes('خدمات منزلية') || cat.includes('سيارات') || cat.includes('سباكة') || cat.includes('كهرباء')) {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن حجز موعد ومعاينة فنية من "${biz.nameAr}" عبر منصة دليلك.`;
  } else {
    message = `السلام عليكم ورحمة الله 👋\nأود الاستفسار عن المنتجات والخدمات المتاحة لدى "${biz.nameAr}" عبر منصة دليلك.`;
  }

  return `https://wa.me/20${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Dynamically updates document title, meta description, and canonical link
 * Ensures full SEO synchronization during client-side SPA navigation.
 */
export function updatePageMetadata(options: {
  title: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}): void {
  if (typeof document === 'undefined') return;

  if (options.title) {
    if (document.title !== options.title) {
      document.title = options.title;
    }
    const metaTitle = document.querySelector('meta[name="title"]') as HTMLMetaElement | null;
    if (metaTitle) metaTitle.content = options.title;
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (ogTitle) ogTitle.content = options.title;
    const twTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null;
    if (twTitle) twTitle.content = options.title;
  }

  if (options.description) {
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = options.description;

    const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (ogDesc) ogDesc.content = options.description;

    const twDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement | null;
    if (twDesc) twDesc.content = options.description;
  }

  if (options.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = options.canonicalUrl;

    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (ogUrl) ogUrl.content = options.canonicalUrl;

    const twUrl = document.querySelector('meta[name="twitter:url"]') as HTMLMetaElement | null;
    if (twUrl) twUrl.content = options.canonicalUrl;
  }

  if (options.ogImage) {
    const ogImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    if (ogImg) ogImg.content = options.ogImage;
    const ogImgSec = document.querySelector('meta[property="og:image:secure_url"]') as HTMLMetaElement | null;
    if (ogImgSec) ogImgSec.content = options.ogImage;
    const twImg = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement | null;
    if (twImg) twImg.content = options.ogImage;
  }
}

/**
 * Injects or updates Schema.org JSON-LD structured data for Google SEO rich snippets
 */
export function injectBusinessSchemaLd(biz: Business | null): void {
  if (typeof document === 'undefined') return;

  const scriptId = 'dalelak-schema-localbusiness';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!biz) {
    if (script) script.remove();
    return;
  }

  let googleRating: number | null = null;
  let googleReviewsCount: number | null = null;
  if (typeof biz.notes === 'string' && biz.notes.startsWith('{')) {
    try {
      const parsed = JSON.parse(biz.notes);
      if (parsed.googleRating !== undefined && parsed.googleRating !== null) {
        googleRating = Number(parsed.googleRating);
      }
      if (parsed.googleReviewsCount !== undefined && parsed.googleReviewsCount !== null) {
        googleReviewsCount = Number(parsed.googleReviewsCount);
      }
    } catch {}
  }

  const category = (biz.category || '').toLowerCase();
  let schemaType = 'LocalBusiness';
  if (category.includes('صيدل') || category.includes('أدوي')) schemaType = 'Pharmacy';
  else if (category.includes('مطعم') || category.includes('مأكول') || category.includes('وجب')) schemaType = 'Restaurant';
  else if (category.includes('كافيه') || category.includes('مقهى') || category.includes('قهو')) schemaType = 'CafeOrCoffeeShop';
  else if (category.includes('أسنان')) schemaType = 'Dentist';
  else if (category.includes('طبي') || category.includes('عياد') || category.includes('دكتور')) schemaType = 'MedicalBusiness';
  else if (category.includes('سيار') || category.includes('ميكانيك')) schemaType = 'AutoRepair';
  else if (category.includes('سوبر') || category.includes('ماركت') || category.includes('بقال')) schemaType = 'GroceryStore';
  else if (category.includes('حلوي') || category.includes('مخبز') || category.includes('أفران')) schemaType = 'Bakery';

  const schemaData: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: biz.nameAr || biz.nameEn,
    description: biz.description || `${biz.category} في ${biz.governorate}، ${biz.city}`,
    telephone: biz.phone,
    priceRange: '$$',
    currenciesAccepted: 'EGP',
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.street || undefined,
      addressLocality: biz.city,
      addressRegion: biz.governorate,
      addressCountry: 'EG',
    },
    url: getPublicDirectoryUrl(biz),
    image: biz.photos && biz.photos.length > 0 ? biz.photos[0] : undefined,
  };

  if (typeof biz.lat === 'number' && typeof biz.lng === 'number' && biz.lat !== 0 && biz.lng !== 0) {
    schemaData.geo = {
      '@type': 'GeoCoordinates',
      latitude: biz.lat,
      longitude: biz.lng,
    };
  }

  if (googleRating && googleRating >= 1) {
    schemaData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: googleRating.toFixed(1),
      reviewCount: googleReviewsCount || 1,
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (biz.workingHours) {
    schemaData.openingHours = biz.workingHours;
  }

  if (biz.googleMapsUrl) {
    schemaData.hasMap = biz.googleMapsUrl;
    schemaData.sameAs = [biz.googleMapsUrl];
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schemaData);
}

/**
 * Resolves the appropriate map link and status for a business
 * Prioritizes official Google Maps URL for verified businesses,
 * falling back to rep GPS field location or latitude/longitude coordinates.
 */
export function getBusinessMapDetails(biz: Business): {
  effectiveUrl: string | null;
  isOfficial: boolean;
  hasLocation: boolean;
} {
  const officialUrl =
    biz.googleMapsUrl &&
    typeof biz.googleMapsUrl === 'string' &&
    biz.googleMapsUrl.trim().startsWith('http') &&
    !biz.googleMapsUrl.includes('search/?api=1&query=') &&
    !biz.googleMapsUrl.includes('maps?q=') &&
    !biz.googleMapsUrl.includes('google.com/maps?q=')
      ? biz.googleMapsUrl.trim()
      : null;

  const repUrl =
    biz.repLocationUrl &&
    typeof biz.repLocationUrl === 'string' &&
    biz.repLocationUrl.trim().startsWith('http')
      ? biz.repLocationUrl.trim()
      : biz.lat && biz.lng
      ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}`
      : null;

  const effectiveUrl = officialUrl || repUrl;
  const isOfficial = Boolean(officialUrl);

  return {
    effectiveUrl,
    isOfficial,
    hasLocation: Boolean(effectiveUrl),
  };
}

/**
 * 🎁 دالة توليد رابط استلام هدية تصميم باركود QR المجاني للمنشأة
 * 
 * 💡 الغرض التسويقي والتحفيزي (مخفي برمجياً للفهم والتطوير):
 * تحفيز أصحاب المنشآت والعملاء عند فتح رابط المنشأة بالدليل العام على الضغط على الزر
 * لطلب واستلام تصميم الباركود المجاني، مما يفتح محادثة WhatsApp مباشرة وموثقة مع إدارة المنصة
 * (01556221141) لتعزيز ولاء العميل، توطيد العلاقة، وفتح قنوات تقديم الخدمات النوعية لمنظومة دليلك.
 */
export function getGiftBarcodeWhatsAppUrl(biz: Business): string {
  const adminPhone = '201556221141';
  const cleanName = biz.nameAr || biz.name || biz.nameEn || 'المنشأة';
  const location = [biz.city, biz.governorate].filter(Boolean).join(' - ') || 'مصر';
  const venueUrl = getPublicDirectoryUrl(biz);

  const message =
    `السلام عليكم ورحمة الله وبركاته 👋\n` +
    `أنا صاحب / إدارة «${cleanName}» (${location}).\n\n` +
    `🎁 أود استلام هديتي المعتمدة من منصة دليلك:\n` +
    `*تصميم باركود QR مخصص لمنشأتنا مجاناً (0.00 ج)* جاهز للطباعة والتعليق في المقر لسهولة مسحه وتقييم المكان.\n\n` +
    `🔗 رابط صفحة منشأتنا بالدليل العام:\n${venueUrl}`;

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * 🔀 Fast, deterministic pseudo-random shuffle (Mulberry32 PRNG)
 * Ensures fair, randomized distribution across all businesses
 * while maintaining strict UI stability during a browsing session.
 */
export function shuffleBusinessesWithSeed(list: Business[], seed: number): Business[] {
  const result = [...list];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    currentSeed = (currentSeed + 0x6d2b79f5) | 0;
    let t = Math.imul(currentSeed ^ (currentSeed >>> 15), 1 | currentSeed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const rand = ((t >>> 0) / 4294967296);
    const j = Math.floor(rand * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
