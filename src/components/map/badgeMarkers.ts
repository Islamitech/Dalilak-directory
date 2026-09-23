import { Business } from '../../types';
import { escapeHtml } from './constants/mapConstants';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { getBusinessHadayekZoneLetter } from '../../utils/hadayekZoneHelper';

export interface CategoryBadgeConfig {
  bg: string;
  borderColor: string;
  iconSvg: string;
}

/**
 * Lightweight, high-performance category logo badges:
 * Simple vector paths, zero SVG defs, zero filters, zero lag.
 */
export function getCategoryBadgeConfig(category: string = ''): CategoryBadgeConfig {
  const cat = (category || '').toLowerCase();

  // 1. Food & Cafes (Amber)
  if (
    cat.includes('مطاعم') ||
    cat.includes('مطعم') ||
    cat.includes('كافيه') ||
    cat.includes('مقهى') ||
    cat.includes('أكل') ||
    cat.includes('مأكولات') ||
    cat.includes('حلويات') ||
    cat.includes('مخبز') ||
    cat.includes('مشويات') ||
    cat.includes('عصائر')
  ) {
    return {
      bg: '#f59e0b',
      borderColor: '#fbbf24',
      iconSvg:
        '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v19M5 2v4a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3V2M8 9v12"/>',
    };
  }

  // 2. Supermarkets & Groceries (Emerald)
  if (
    cat.includes('سوبر') ||
    cat.includes('ماركت') ||
    cat.includes('بقالة') ||
    cat.includes('تموين') ||
    cat.includes('هايبر') ||
    cat.includes('خضروات') ||
    cat.includes('لحوم') ||
    cat.includes('جزارة') ||
    cat.includes('فواكه')
  ) {
    return {
      bg: '#10b981',
      borderColor: '#34d399',
      iconSvg:
        '<circle cx="8" cy="21" r="1.5" fill="#ffffff"/><circle cx="19" cy="21" r="1.5" fill="#ffffff"/><path d="M2.5 2.5h2.5l2.4 12a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 1.9-1.5l1.6-7.5H5.4"/>',
    };
  }

  // 3. Health, Clinics & Pharmacies (Sky Blue)
  if (
    cat.includes('صيدل') ||
    cat.includes('طبي') ||
    cat.includes('عياد') ||
    cat.includes('مستشفى') ||
    cat.includes('علاج') ||
    cat.includes('أسنان') ||
    cat.includes('صحة') ||
    cat.includes('تحاليل') ||
    cat.includes('أشعة')
  ) {
    return {
      bg: '#0284c7',
      borderColor: '#38bdf8',
      iconSvg:
        '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
    };
  }

  // 4. Fashion & Clothing (Purple)
  if (
    cat.includes('ملابس') ||
    cat.includes('أزياء') ||
    cat.includes('فاشون') ||
    cat.includes('أحذية') ||
    cat.includes('موضة') ||
    cat.includes('عبايات') ||
    cat.includes('بدل')
  ) {
    return {
      bg: '#8b5cf6',
      borderColor: '#a78bfa',
      iconSvg:
        '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    };
  }

  // 5. Automotive & Maintenance (Rose Red)
  if (
    cat.includes('سيار') ||
    cat.includes('صيانة') ||
    cat.includes('مركبات') ||
    cat.includes('أوتو') ||
    cat.includes('كاوتش') ||
    cat.includes('ميكانيك') ||
    cat.includes('زيوت')
  ) {
    return {
      bg: '#f43f5e',
      borderColor: '#fb7185',
      iconSvg:
        '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="1.8" fill="#ffffff"/><path d="M9 17h6"/><circle cx="17" cy="17" r="1.8" fill="#ffffff"/>',
    };
  }

  // 6. General Commercial & Services (Indigo)
  return {
    bg: '#6366f1',
    borderColor: '#818cf8',
    iconSvg:
      '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2ZM18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2ZM10 6h4M10 10h4M10 14h4M10 18h4"/>',
  };
}

/**
 * Creates an authentic, photo-rich Activity Card Pin (بطاقة النشاط الميدانية بالصور) for a business on the map.
 * Inspired directly by the visual identity and traits of Dalelak's BusinessCard:
 * - Cover photo with anti-extraction protective gradient
 * - Official verification badge (موثق) in emerald
 * - Top-3 prominence badge (#1 الأبرز, #2, #3) in golden amber
 * - Live open/closed status indicator
 * - Category in amber-700
 * - High-contrast business name in Cairo typography
 * - Star rating in monospace with amber pill
 * - Map pin downward pointer tip with amber location dot
 */
export function createLightweightBadgeHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = biz.coverPhoto || (biz.photos && biz.photos.length > 0 ? biz.photos[0] : fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 360, 160);
  const openStatus = getBusinessOpenStatus(biz.workingHours);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const ratingVal = (biz.googleRating || biz.rating || 4.9).toFixed(1);

  const cardWidth = isSelected ? 196 : 184;
  const photoHeight = isSelected ? 82 : 76;
  const bodyHeight = 58;
  const pointerHeight = 9;
  const totalHeight = photoHeight + bodyHeight + pointerHeight;

  // Border & shadow styling inspired by Dalelak BusinessCard
  const cardBorder = isSelected
    ? 'border: 2px solid #f59e0b; box-shadow: 0 0 24px rgba(245, 158, 11, 0.8), 0 8px 24px rgba(0,0,0,0.25);'
    : isTopProminent
    ? 'border: 2px solid #f59e0b; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0,0,0,0.12);'
    : 'border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0,0,0,0.06);';

  // Badges on photo
  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2px; font-size: 8.5px; font-weight: 900; padding: 1.5px 6px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; border: 0.5px solid #fef08a; box-shadow: 0 1px 4px rgba(0,0,0,0.35); line-height: 1.2;">#${prominenceRank} الأبرز</span>`
    : '';

  const verifiedBadgeHtml = isVerified
    ? `<span style="position: absolute; top: 5px; right: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 8.5px; font-weight: 900; padding: 1.5px 5.5px; border-radius: 9999px; background: #059669; color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); backdrop-filter: blur(4px); line-height: 1.2;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>موثق</span>`
    : '';

  const openStatusBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; bottom: 4px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 7.5px; font-weight: 800; padding: 1px 4.5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.82); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}; line-height: 1.2;"><span style="width: 3.5px; height: 3.5px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`
    : `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.85); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}; line-height: 1.2;"><span style="width: 4px; height: 4px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`;

  const html = `
    <div class="activity-card-pin ${isTopProminent ? 'top-prominent-pin' : ''}" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Card Container (replicates BusinessCard) -->
      <div style="background: #ffffff; ${cardBorder} border-radius: 14px; overflow: hidden; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 1. Visual Photo Header -->
        <div style="position: relative; width: 100%; height: ${photoHeight}px; background: #0f172a; overflow: hidden; border-top-left-radius: 12px; border-top-right-radius: 12px;">
          <img
            src="${photoUrl}"
            alt="${safeName}"
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
            onerror="if(this.src!=='${escapeHtml(fallbackCover)}'){this.src='${escapeHtml(fallbackCover)}';}"
            loading="lazy"
          />
          <!-- Anti-extraction gradient overlay -->
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.08) 45%, transparent 100%); pointer-events: none;"></div>
          ${verifiedBadgeHtml}
          ${rankBadgeHtml}
          ${openStatusBadgeHtml}
        </div>

        <!-- 2. Business Details Summary -->
        <div style="background: #ffffff; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; direction: rtl; text-align: right; box-sizing: border-box;">
          <!-- Category & Location -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; line-height: 1;">
            <span style="color: #b45309; font-weight: 800; font-size: 9.5px; max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeCategory}</span>
            <span style="color: #64748b; font-size: 8.5px; font-weight: 600; white-space: nowrap;">${safeLocation}</span>
          </div>

          <!-- Business Name -->
          <div style="font-size: 11.5px; font-weight: 900; color: #0f172a; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;" title="${safeName}">
            ${safeName}
          </div>

          <!-- Rating & Action Link -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 3.5px; margin-top: 2px;">
            <!-- Rating pill matching BusinessCard -->
            <span style="display: inline-flex; align-items: center; gap: 2.5px; font-family: monospace; font-size: 9.5px; font-weight: 900; color: #d97706; background: rgba(245, 158, 11, 0.12); padding: 0.5px 5px; border-radius: 5px; border: 0.5px solid rgba(245, 158, 11, 0.25); line-height: 1;">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${ratingVal}</span>
            </span>

            <!-- Mini Action Link -->
            <span style="font-size: 9px; font-weight: 800; color: #d97706; display: inline-flex; align-items: center; gap: 2px;">
              <span>التفاصيل</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Precision Anchor Pointer (White triangle with amber base dot) -->
      <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid #ffffff; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
      <div style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px rgba(245,158,11,0.85);"></div>
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, totalHeight],
    iconAnchor: [cardWidth / 2, totalHeight],
  };
}

/**
 * Lightweight, modern cluster badge with gradient and activity count.
 */
export function createLightweightClusterHtml(
  count: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const html = `
    <div style="position: relative; cursor: pointer; user-select: none; font-family: 'Cairo', system-ui, sans-serif;">
      <div style="background: #ffffff; border: 2.5px solid #f59e0b; color: #0f172a; width: 44px; height: 44px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span style="font-size: 13px; font-weight: 900; line-height: 1; color: #d97706;">${count}</span>
        <span style="font-size: 8px; font-weight: 800; color: #64748b; line-height: 1;">نشاطاً</span>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  };
}

/**
 * Creates an interactive District Cluster Pill ("دبوس مجمع") matching the colors and theme of Dalelak.
 * When clicked, triggers camera zoom and bursts remaining activities into cards!
 */
export function createDistrictClusterHtml(
  count: number,
  categoryLabel?: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const width = 172;
  const height = 38;
  const totalHeight = height + 10;
  const safeLabel = escapeHtml(categoryLabel ? `${categoryLabel}` : 'أنشطة');

  const html = `
    <div class="district-cluster-pin" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      width: ${width}px;
      font-family: 'Cairo', system-ui, sans-serif;
      direction: rtl;
    ">
      <div style="
        background: #ffffff;
        color: #0f172a;
        border: 2px solid #f59e0b;
        border-radius: 9999px;
        padding: 4px 10px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0,0,0,0.12);
      ">
        <span style="
          background: #f59e0b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          padding: 1.5px 7px;
          border-radius: 9999px;
          box-shadow: 0 1px 4px rgba(245, 158, 11, 0.4);
          flex-shrink: 0;
        ">+${count}</span>
        <span style="
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${safeLabel} إضافية 🔍</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #ffffff; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
      <div style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px #f59e0b;"></div>
    </div>
  `;

  return {
    html,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight],
  };
}

