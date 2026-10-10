import { Business } from '../../types';
import { escapeHtml } from './constants/mapConstants';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getCategoryFallbackCover, isValidPhotoUrl } from '../../utils/categoryPhotos';

function getValidBusinessPhoto(biz: Business, fallbackCover: string): string {
  const validCover = isValidPhotoUrl(biz.coverPhoto) ? biz.coverPhoto : null;
  const validPhotos = (biz.photos || []).filter(isValidPhotoUrl);
  return validCover || (validPhotos.length > 0 ? validPhotos[0] : fallbackCover);
}
import {
  getBusinessOpenStatus,
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import { getBusinessHadayekZoneLetter } from '../../utils/hadayekZoneHelper';
import { displayBusinessName, formatActivityCountLabel, formatWorkingHoursLabel, getWordRating } from '../../shared/lib/format';
import { getBusinessPinCategoryId, getCategoryPinStyle } from './markers/categoryPinStyle';

/** The ONE teardrop outline shared by every activity pin (single or per-category cluster pin). */
const UNIFIED_PIN_PATH =
  'M15 37.2C15 37.2 4.2 24.4 4.2 15.2 4.2 8.6 9 3.8 15 3.8s10.8 4.8 10.8 11.4C25.8 24.4 15 37.2 15 37.2z';

/**
 * Inner SVG (viewBox 0 0 30 40) of the flat activity pin: solid category colour with a white rim.
 * The glyph is drawn by the caller on top.
 */
function buildActivityPinSvgInner(_categoryId: string, color: string): string {
  return `<path d="${UNIFIED_PIN_PATH}" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>`;
}
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
 * Safely format rating for display. Never fabricates a fake rating (like 4.9).
 * Returns null if rating is invalid, out of range (not between 1 and 5), or disabled.
 */
export function formatDisplayRating(biz: Business): { ratingText: string | null; reviewCountText: string | null; wordRating: string | null } {
  const rawRating =
    biz.googleRating !== undefined && biz.googleRating !== null
      ? biz.googleRating
      : biz.rating;

  if (typeof rawRating !== 'number' || isNaN(rawRating) || rawRating <= 0 || rawRating > 5) {
    return { ratingText: null, reviewCountText: null, wordRating: null };
  }

  if (biz.googleRatingEnabled === false && biz.googleRating !== undefined) {
    return { ratingText: null, reviewCountText: null, wordRating: null };
  }

  const ratingText = `★ ${rawRating.toFixed(1)}`;
  const count =
    typeof biz.googleReviewsCount === 'number' && !isNaN(biz.googleReviewsCount) && biz.googleReviewsCount > 0
      ? `(${biz.googleReviewsCount})`
      : null;

  return { ratingText, reviewCountText: count, wordRating: getWordRating(rawRating) };
}

/**
 * Validates and sanitizes a URL strictly ensuring only http, https, or relative paths are permitted.
 * Blocks javascript:, data:, vbscript:, and attribute escape characters.
 */
export function sanitizeSafeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return null;
  if (/["'<>\s]/.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return null;
}

/**
 * Sanitizes phone number to only contain digits and optional leading +.
 * Rejects any script or character injection.
 */
export function sanitizePhoneNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 7 || cleaned.length > 15) return null;
  return cleaned;
}

/**
 * Creates a sleek, compact activity pin marker anchored strictly at its true GPS location.
 * Uses category badge colors, vector icons, prominence badges, and screen-space pixel offsetting for coincident pins.
 */
export function createCompactActivityPinHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0],
  showName = false
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(displayBusinessName(biz.nameAr, biz.nameEn) || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const pinStyle = getCategoryPinStyle(getBusinessPinCategoryId(biz));
  const boxWidth = showName ? 120 : 50;
  const pinHeight = (showName ? 18 : 0) + 62;

  const [dx, dy] = pixelOffset;
  const anchorX = Math.round(boxWidth / 2) - dx;
  const anchorY = pinHeight - dy;

  const rankBadgeHtml =
    isTopProminent && prominenceRank
      ? `<span style="position:absolute;top:-4px;right:-4px;z-index:5;background:#f59e0b;color:#0f172a;font-size:8px;font-weight:800;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid #ffffff;">#${prominenceRank}</span>`
      : '';

  const verifiedDotHtml = isVerified
    ? `<span style="position:absolute;top:-3px;left:-3px;z-index:5;width:11px;height:11px;border-radius:50%;background:#d97706;border:1.5px solid #ffffff;display:flex;align-items:center;justify-content:center;"><svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/></svg></span>`
    : '';

  const nameHtml = showName
    ? `<div style="max-width:100px;margin-bottom:2px;padding:0 6px;border-radius:999px;background:rgba(255,255,255,.96);border:1px solid #e2e8f0;color:#0f172a;font-size:10px;font-weight:800;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeName}</div>`
    : '';

  const html = `
    <div class="activity-pin-wrapper marker-pin ${isSelected ? 'selected-pin active' : ''}" style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;user-select:none;width:${boxWidth}px;height:${pinHeight}px;font-family:'Cairo',system-ui,sans-serif;" title="${safeName} - ${safeCategory}">
      ${nameHtml}
      <div class="activity-pin-head" style="position:relative;width:42px;height:56px;flex:0 0 56px;filter:drop-shadow(0 2px 3px rgba(15,23,42,.28));">
        <svg width="42" height="56" viewBox="0 0 30 40" style="display:block;overflow:visible;">
          ${buildActivityPinSvgInner(pinStyle.id, pinStyle.color)}
        </svg>
        <div style="position:absolute;left:0;right:0;top:11px;height:22px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${pinStyle.iconSvg}</svg>
        </div>
        ${rankBadgeHtml}
        ${verifiedDotHtml}
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [boxWidth, pinHeight],
    iconAnchor: [anchorX, anchorY],
  };
}

/**
 * Creates a compact, comfortable preview card (كارت النشاط المصغر) for the selected business on the map.
 * Fulfills the user UX requirement:
 * - Smaller, comfortable card size that does not obscure the activity location on the map
 * - Thumbnail image (صورة مصغرة)
 * - Essential details: Business name, category, and district zone
 * - Smooth click affordance that zooms in the camera and opens the full details modal
 * - Safe close button (✕) to deselect
 */
/**
 * Unified Generator for Modern Horizontal Compact Cards (DNA of Image 3).
 * Used for both:
 * 1. Multi-activity city overview (isSelected: false, no ✕ button, hover lift, clean borders)
 * 2. Focused single activity state 1 (isSelected: true, ✕ button, glowing amber border)
 */
export function renderUnifiedCompactCardHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number]; fallbackCover: string } {
  const cardWidth = isSelected ? 232 : 224;
  const cardHeight = isSelected ? 62 : 58;
  const pointerHeight = 10;
  const totalHeight = cardHeight + pointerHeight;

  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(displayBusinessName(biz.nameAr, biz.nameEn) || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = getValidBusinessPhoto(biz, fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 240, 240);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const [dx, dy] = pixelOffset;
  const anchorX = Math.round(cardWidth / 2) - dx;
  const anchorY = totalHeight - dy;
  const hasOffset = dx !== 0 || dy !== 0;

  const { ratingText } = formatDisplayRating(biz);

  const containerBorder = isSelected
    ? 'border: 2px solid #f59e0b; box-shadow: 0 4px 20px rgba(0,0,0,0.18), 0 0 14px rgba(245, 158, 11, 0.35);'
    : isTopProminent
    ? 'border: 1.5px solid #f59e0b; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25), 0 1px 4px rgba(0,0,0,0.06);'
    : 'border: 1.5px solid #e2e8f0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.10), 0 1px 3px rgba(0,0,0,0.05);';

  const closeButtonHtml = isSelected
    ? `<button
        type="button"
        class="card-close-btn"
        style="position: absolute; top: -12px; left: -12px; z-index: 20; min-width: 44px; min-height: 44px; padding: 12px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; touch-action: manipulation;"
        title="إغلاق والعودة للخريطة"
      ><span style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; color: #ffffff; border: 1.5px solid #ffffff; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.35); pointer-events: none;">✕</span></button>`
    : '';

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 2px; left: 2px; z-index: 3; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: #f59e0b; color: #020617;">#${prominenceRank}</span>`
    : '';

  // Bottom action cue / rating text
  let bottomActionHtml = '';
  if (isSelected) {
    bottomActionHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: 1px;">
        <span style="font-size: 8.5px; font-weight: 800; color: #d97706; display: inline-flex; align-items: center; gap: 2px;">
          <span>انقر لعرض كامل التفاصيل</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </span>
      </div>`;
  } else {
    bottomActionHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: 1px;">
        ${ratingText ? `
          <span style="display: inline-flex; align-items: center; gap: 2px; font-family: monospace; font-size: 9px; font-weight: 800; color: #d97706; background: rgba(245, 158, 11, 0.1); padding: 0.5px 4.5px; border-radius: 4px;">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${ratingText}</span>
          </span>
        ` : `
          <span style="font-size: 8.5px; font-weight: 800; color: #b45309; background: rgba(217, 119, 6, 0.10); padding: 0.5px 5px; border-radius: 4px;">
            ${isVerified ? 'معتمد رسمي' : 'مسجل'}
          </span>
        `}
        <span style="font-size: 8px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 1px;">
          <span>التفاصيل</span>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </span>
      </div>`;
  }

  const thumbSize = isSelected ? 50 : 46;

  const html = `
    <div class="${isSelected ? 'compact-selected-card-pin' : 'compact-overview-card-pin activity-card-pin'}" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl; transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);">
      <!-- Compact Horizontal Card Container -->
      <div style="background: #ffffff; ${containerBorder} border-radius: 12px; width: 100%; height: ${cardHeight}px; box-sizing: border-box; display: flex; align-items: center; padding: 5px 6px; gap: 7px; position: relative;">
        ${closeButtonHtml}

        <!-- 1. Thumbnail Photo -->
        <div class="biz-card-frame" style="position: relative; width: ${thumbSize}px; height: ${thumbSize}px; min-width: ${thumbSize}px; border-radius: 8px; overflow: hidden; background: #0f172a; border: 1px solid ${isSelected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(226, 232, 240, 0.8)'};">
          <img
            class="biz-card-photo"
            src="${escapeHtml(photoUrl)}"
            alt="${safeName}"
            width="${thumbSize}"
            height="${thumbSize}"
            loading="lazy"
            decoding="async"
          />
          <div class="biz-card-shade"></div>
          ${rankBadgeHtml}
          ${isVerified ? `
            <span style="position: absolute; bottom: 2px; right: 2px; z-index: 2; width: 13px; height: 13px; border-radius: 50%; background: #d97706; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="موثق">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
          ` : ''}
        </div>

        <!-- 2. Business Details -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 1.5px; text-align: right;">
          <!-- Category & Zone Tags -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 3px; line-height: 1;">
            <span style="color: #b45309; font-weight: 800; font-size: 9px; background: #fef3c7; padding: 1px 5px; border-radius: 4px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${safeCategory}
            </span>
            <span style="color: #64748b; font-size: 8.5px; font-weight: 700; white-space: nowrap;">
              ${safeLocation}
            </span>
          </div>

          <!-- Business Name -->
          <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${safeName}">
            ${safeName}
          </div>

          <!-- Action / Rating Bar -->
          ${bottomActionHtml}
        </div>
      </div>

      <!-- Precision Ground Pointer / Leader Line -->
      ${
        hasOffset
          ? `
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: -1;">
              <path d="M ${cardWidth / 2} ${totalHeight - 8} Q ${cardWidth / 2} ${(totalHeight - 8 + anchorY) / 2} ${anchorX} ${anchorY}" stroke="${isSelected ? '#f59e0b' : '#94a3b8'}" stroke-width="2.2" stroke-dasharray="5,4" fill="none" stroke-linecap="round" />
              <circle cx="${anchorX}" cy="${anchorY}" r="4" fill="${isSelected ? '#f59e0b' : '#64748b'}" stroke="#ffffff" stroke-width="1.8" filter="drop-shadow(0 0 4px rgba(0,0,0,0.3))" />
            </svg>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? '#f59e0b' : '#94a3b8'}; margin-top: -1px;"></div>
          `
          : `
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #ffffff; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.12));"></div>
            <div style="width: 7px; height: 7px; border-radius: 50%; background: ${isSelected ? '#f59e0b' : '#0284c7'}; border: 1.5px solid #ffffff; margin-top: -3px; box-shadow: 0 0 6px rgba(0,0,0,0.25);"></div>
          `
      }
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, totalHeight],
    iconAnchor: [anchorX, anchorY],
    fallbackCover,
  };
}

/**
 * Creates the modern, low-profile Horizontal Compact Card for unselected activities
 * at City Overview level (Image 3 DNA adapted for multi-entity discovery).
 */
export function createCompactOverviewBadgeHtml(
  biz: Business,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
) {
  return renderUnifiedCompactCardHtml(biz, false, isTopProminent, prominenceRank, pixelOffset);
}

/**
 * Creates the large photo-rich activity card used for a selected business or close-zoom preview.
 * Both variants include direct actions; only the selected variant shows a close button.
 * 100% secure: ZERO inline onclick or onerror attributes in HTML strings.
 */
export function createExpandedActivityCardHtml(
  biz: Business,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0],
  isSelected: boolean = true
): { html: string; iconSize: [number, number]; iconAnchor: [number, number]; fallbackCover: string } {
  const cardWidth = 256;
  const photoHeight = 132;
  const pointerHeight = 9;

  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(displayBusinessName(biz.nameAr, biz.nameEn) || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = getValidBusinessPhoto(biz, fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 640, 280);
  const openStatus = getBusinessOpenStatus(biz.workingHours);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const { ratingText, reviewCountText, wordRating } = formatDisplayRating(biz);
  const hoursLabel = formatWorkingHoursLabel(biz.workingHours);
  const hoursLine = hoursLabel
    ? `${openStatus.badgeText} · ${hoursLabel}`
    : (biz.workingHours?.trim() ? 'ساعات العمل غير واضحة' : '');

  const phone = sanitizePhoneNumber(biz.phone || biz.secondaryPhone || '');
  const { effectiveUrl } = getBusinessMapDetails(biz);
  const safeEffectiveUrl = sanitizeSafeUrl(effectiveUrl);
  const smartWhatsAppUrl = sanitizeSafeUrl(getSmartWhatsAppUrl(biz));

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 6px; left: 36px; z-index: 4; display: inline-flex; align-items: center; gap: 2px; font-size: 8.5px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; border: 0.5px solid #fef08a; box-shadow: 0 1px 4px rgba(0,0,0,0.35); line-height: 1.2;">#${prominenceRank} الأبرز</span>`
    : '';

  const verifiedBadgeHtml = isVerified
    ? `<span style="position: absolute; top: 6px; right: 6px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 8.5px; font-weight: 800; padding: 2px 6.5px; border-radius: 9999px; background: #047857; color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); backdrop-filter: blur(4px); line-height: 1.2;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>موثق</span>`
    : '';

  const openStatusBadgeHtml = hoursLabel ? `
    <span style="position: absolute; bottom: 6px; right: 6px; z-index: 4; display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; background: rgba(15, 23, 42, 0.88); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}; line-height: 1.2;">
      <span style="width: 4px; height: 4px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>
      ${openStatus.isOpen ? 'مفتوح' : 'مغلق'}
    </span>
  ` : '';

  const [dx, dy] = pixelOffset;
  const estimatedTotalHeight = photoHeight + 155 + pointerHeight;
  const anchorX = Math.round(cardWidth / 2) - dx;
  const anchorY = estimatedTotalHeight - dy;
  const hasOffset = dx !== 0 || dy !== 0;

  const html = `
    <div class="activity-card-pin ${isSelected ? 'selected-expanded-pin' : 'detailed-activity-preview-pin'}" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: ${isSelected ? 'default' : 'pointer'}; user-select: none; width: ${cardWidth}px; height: ${estimatedTotalHeight}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Card Container with glowing golden amber border -->
      <div style="background: #ffffff; border: ${isSelected ? '2.5px solid #f59e0b' : '1.5px solid #e2e8f0'}; box-shadow: ${isSelected ? '0 0 28px rgba(245, 158, 11, 0.85), 0 12px 36px rgba(0,0,0,0.3)' : '0 8px 24px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(0,0,0,0.08)'}; border-radius: 18px; overflow: hidden; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        
        <!-- 1. Visual Photo Header with Fixed Dimensions (Zero CLS) -->
        <div class="biz-card-frame" style="position: relative; width: 100%; height: ${photoHeight}px; background: #0f172a; overflow: hidden; border-top-left-radius: 16px; border-top-right-radius: 16px;">
          <img
            class="biz-card-photo"
            src="${escapeHtml(photoUrl)}"
            alt="${safeName}"
            width="${cardWidth}"
            height="${photoHeight}"
            decoding="async"
          />
          <div class="biz-card-shade"></div>

          <!-- Close Button (✕) to deselect and return to 3 cards view (DOM listener bound via class) -->
          ${isSelected ? `
            <button
              type="button"
              class="card-close-btn"
              style="position: absolute; top: 0px; left: 0px; z-index: 10; min-width: 44px; min-height: 44px; padding: 10px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; touch-action: manipulation;"
              title="إغلاق والعودة للخريطة"
            ><span style="width: 24px; height: 24px; border-radius: 50%; background: rgba(15, 23, 42, 0.85); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.35); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); pointer-events: none;">✕</span></button>
          ` : ''}

          ${verifiedBadgeHtml}
          ${rankBadgeHtml}
          ${openStatusBadgeHtml}
        </div>

        <!-- 2. Rich Business Details -->
        <div style="background: #ffffff; padding: 8px 10px 10px 10px; display: flex; flex-direction: column; gap: 4px; direction: rtl; text-align: right; box-sizing: border-box;">
          <!-- Category and Location Zone -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; line-height: 1.2;">
            <span style="color: #b45309; font-weight: 800; font-size: 10px; background: #fef3c7; padding: 1.5px 7px; border-radius: 6px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeCategory}</span>
            <span style="color: #64748b; font-size: 9.5px; font-weight: 700; white-space: nowrap;">${safeLocation}</span>
          </div>

          <!-- Business Name (Bold Cairo) -->
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;" title="${safeName}">
            ${safeName}
          </div>

          <!-- Street / Exact Address if available -->
          ${hoursLine ? `
            <div style="font-size: 9.5px; font-weight: 700; color: #334155; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(hoursLine)}</div>
          ` : ''}

          <!-- Rating & Review Count (Authentic - never fake 4.9) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 1px;">
            ${ratingText ? `
              <span style="display: inline-flex; align-items: center; gap: 2.5px; font-family: monospace; font-size: 10px; font-weight: 800; color: #7a5a12; background: rgba(245, 158, 11, 0.12); padding: 1px 6px; border-radius: 5px; border: 0.5px solid rgba(245, 158, 11, 0.25); line-height: 1;">
                <svg width="9.5" height="9.5" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${ratingText}${wordRating ? ` ${escapeHtml(wordRating)}` : ''}</span>
              </span>
            ` : `
              <span style="display: inline-flex; align-items: center; gap: 2px; font-size: 9px; font-weight: 800; color: #64748b; background: #f8fafc; padding: 1px 6px; border-radius: 5px;">
                <span>${isVerified ? 'موثق' : 'نشاط مسجل'}</span>
              </span>
            `}
            <span style="font-size: 9px; color: #64748b; font-weight: 700;">
              ${reviewCountText || ''}
            </span>
          </div>

          <!-- Direct Quick Action Trio (Directions, WhatsApp, Call) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 3px;">
            ${safeEffectiveUrl ? `
              <a href="${escapeHtml(safeEffectiveUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link" data-dl-nav="directions" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="خرائط Google">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                <span>اتجاهات</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>اتجاهات</span>
              </span>
            `}
            ${smartWhatsAppUrl ? `
              <a href="${escapeHtml(smartWhatsAppUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="محادثة واتساب">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>واتساب</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>واتساب</span>
              </span>
            `}
            ${phone ? `
              <a href="tel:${escapeHtml(phone)}" class="card-action-link" style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f59e0b; color: #0f172a; border: 1px solid #fbbf24; border-radius: 8px; padding: 4.5px 2px; text-decoration: none; font-size: 9.5px; font-weight: 800; cursor: pointer;" title="اتصال هاتفي">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>اتصال</span>
              </a>
            ` : `
              <span style="display: flex; align-items: center; justify-content: center; gap: 3px; background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4.5px 2px; font-size: 9.5px; font-weight: 800;">
                <span>اتصال</span>
              </span>
            `}
          </div>
        </div>
      </div>

      <!-- Precision Anchor Pointer / Leader Line -->
      ${
        hasOffset
          ? `
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: -1;">
              <path d="M ${cardWidth / 2} ${estimatedTotalHeight - 12} Q ${cardWidth / 2} ${(estimatedTotalHeight - 12 + anchorY) / 2} ${anchorX} ${anchorY}" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,4" fill="none" stroke-linecap="round" />
              <circle cx="${anchorX}" cy="${anchorY}" r="7" fill="rgba(245,158,11,0.3)" />
              <circle cx="${anchorX}" cy="${anchorY}" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 8px rgba(245,158,11,1))" />
            </svg>
            <div style="width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 10px solid #f59e0b; margin-top: -1px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));"></div>
          `
          : `
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 9px solid #f59e0b; margin-top: -1px;"></div>
            <div style="width: 10px; height: 10px; margin-top: -2px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(15,23,42,0.35);"></div>
          `
      }
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, estimatedTotalHeight],
    iconAnchor: [anchorX, anchorY],
    fallbackCover,
  };
}

/**
 * Creates an authentic, photo-rich Activity Card Pin (بطاقة النشاط الميدانية بالصور) for a business on the map.
 * Replicates the visual design of Dalelak's BusinessCard:
 * - Cover photo with anti-extraction protective gradient and zero layout shift
 * - Official verification badge (موثق) in emerald
 * - Top-3 prominence badge (#1 الأبرز, #2, #3) in golden amber
 * - Live open/closed status indicator
 * - Category and zone location
 * - High-contrast business name in Cairo typography
 * - Authentic star rating (NEVER fake 4.9)
 * - Downward pointer tip with amber location dot or SVG leader line
 * - When isSelected is true, delegates to createExpandedActivityCardHtml.
 */
export function createLightweightBadgeHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number]; fallbackCover: string } {
  if (isSelected) {
    return createExpandedActivityCardHtml(biz, isTopProminent, prominenceRank, pixelOffset);
  }

  const cardWidth = 184;
  const photoHeight = 104;
  const bodyHeight = 72;
  const pointerHeight = 9;
  const totalHeight = photoHeight + bodyHeight + pointerHeight;

  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(displayBusinessName(biz.nameAr, biz.nameEn) || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const rawPhoto = getValidBusinessPhoto(biz, fallbackCover);
  const photoUrl = getOptimizedImageUrl(rawPhoto, 640, 280);
  const openStatus = getBusinessOpenStatus(biz.workingHours);

  // Determine district / location label
  const zoneLetter = getBusinessHadayekZoneLetter(biz);
  const locationLabel = zoneLetter
    ? `منطقة ${zoneLetter}`
    : (biz.city || (biz.street ? biz.street.split('،')[0].trim() : '') || 'حدائق الأهرام');
  const safeLocation = escapeHtml(locationLabel);

  const { ratingText, wordRating } = formatDisplayRating(biz);
  const hoursLabel = formatWorkingHoursLabel(biz.workingHours);
  const hoursLine = hoursLabel
    ? `${openStatus.badgeText} · ${hoursLabel}`
    : (biz.workingHours?.trim() ? 'ساعات العمل غير واضحة' : '');

  const cardBorder = isTopProminent
    ? 'border: 2px solid #f59e0b; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0,0,0,0.12);'
    : 'border: 1.5px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0,0,0,0.06);';

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2px; font-size: 8.5px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; border: 0.5px solid #fef08a; box-shadow: 0 1px 4px rgba(0,0,0,0.35); line-height: 1.2;">#${prominenceRank} الأبرز</span>`
    : '';

  const verifiedBadgeHtml = isVerified
    ? `<span style="position: absolute; top: 5px; right: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 8.5px; font-weight: 800; padding: 1.5px 5.5px; border-radius: 9999px; background: #047857; color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.35); backdrop-filter: blur(4px); line-height: 1.2;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>موثق</span>`
    : '';

  const openStatusBadgeHtml = !hoursLabel
    ? ''
    : isTopProminent && prominenceRank
    ? `<span style="position: absolute; bottom: 4px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 2.5px; font-size: 7.5px; font-weight: 800; padding: 1px 4.5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.82); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}; line-height: 1.2;"><span style="width: 3.5px; height: 3.5px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`
    : `<span style="position: absolute; top: 5px; left: 5px; z-index: 4; display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 9999px; background: rgba(15, 23, 42, 0.85); color: ${openStatus.isOpen ? '#34d399' : '#f87171'}; border: 0.5px solid ${openStatus.isOpen ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}; line-height: 1.2;"><span style="width: 4px; height: 4px; border-radius: 50%; background: ${openStatus.isOpen ? '#34d399' : '#f87171'};"></span>${openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>`;

  const [dx, dy] = pixelOffset;
  const anchorX = Math.round(cardWidth / 2) - dx;
  const anchorY = totalHeight - dy;
  const hasOffset = dx !== 0 || dy !== 0;

  const html = `
    <div class="activity-card-pin ${isTopProminent ? 'top-prominent-pin' : ''}" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Card Container (Fixed 184px, zero layout shift) -->
      <div style="background: #ffffff; ${cardBorder} border-radius: 16px; overflow: hidden; width: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 1. Visual Photo Header with Fixed Dimensions -->
        <div class="biz-card-frame" style="position: relative; width: 100%; height: ${photoHeight}px; background: #0f172a; overflow: hidden; border-top-left-radius: 14px; border-top-right-radius: 14px;">
          <img
            class="biz-card-photo"
            src="${escapeHtml(photoUrl)}"
            alt="${safeName}"
            width="${cardWidth}"
            height="${photoHeight}"
            loading="lazy" decoding="async"
          />
          <div class="biz-card-shade"></div>
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
          <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;" title="${safeName}">
            ${safeName}
          </div>
          ${hoursLine ? `<div style="font-size: 9px; font-weight: 700; color: #334155; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(hoursLine)}</div>` : ''}

          <!-- Rating & Action Link (Authentic - never fake 4.9) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 3.5px; margin-top: 2px;">
            ${ratingText ? `
              <span style="display: inline-flex; align-items: center; gap: 2.5px; font-family: monospace; font-size: 9.5px; font-weight: 800; color: #7a5a12; background: rgba(245, 158, 11, 0.12); padding: 0.5px 5px; border-radius: 5px; border: 0.5px solid rgba(245, 158, 11, 0.25); line-height: 1;">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${ratingText}${wordRating ? ` ${escapeHtml(wordRating)}` : ''}</span>
              </span>
            ` : `
              <span style="font-size: 8.5px; font-weight: 800; color: #b45309; background: rgba(217, 119, 6, 0.10); padding: 0.5px 4.5px; border-radius: 4px;">
                ${isVerified ? 'معتمد' : 'مسجل'}
              </span>
            `}

            <!-- Mini Action Link -->
            <span style="font-size: 9px; font-weight: 800; color: #d97706; display: inline-flex; align-items: center; gap: 2px;">
              <span>التفاصيل</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Precision Ground Pointer / Leader Line -->
      ${
        hasOffset
          ? `
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: -1;">
              <path d="M ${cardWidth / 2} ${totalHeight - 8} Q ${cardWidth / 2} ${(totalHeight - 8 + anchorY) / 2} ${anchorX} ${anchorY}" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="5,4" fill="none" stroke-linecap="round" />
              <circle cx="${anchorX}" cy="${anchorY}" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(245,158,11,0.9))" />
            </svg>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #f59e0b; margin-top: -1px;"></div>
          `
          : `
            <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid #ffffff; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px rgba(245,158,11,0.85);"></div>
          `
      }
    </div>
  `;

  return {
    html,
    iconSize: [cardWidth, totalHeight],
    iconAnchor: [anchorX, anchorY],
    fallbackCover,
  };
}

/**
 * Attaches DOM event listeners to Leaflet marker element safely without inline HTML attributes:
 * - Image onError fallback to fallbackCover
 * - Close button (✕) click listener with stopPropagation
 * - Action links stopPropagation
 */
export function attachCardDomListeners(
  marker: any,
  fallbackCover: string,
  onClose?: () => void,
  onDirections?: () => void
): void {
  const bind = () => {
    const el = marker.getElement ? marker.getElement() : null;
    if (!el) return;

    // 1. Safe image fallback
    const img = el.querySelector('img.biz-card-photo');
    if (img && fallbackCover) {
      img.addEventListener('error', () => {
        if (img.src !== fallbackCover) {
          img.src = fallbackCover;
        }
      }, { once: true });
    }

    // 2. Safe close button
    const closeBtn = el.querySelector('.card-close-btn');
    if (closeBtn && onClose) {
      closeBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      });
    }

    // 3. Action links stopPropagation
    const actionLinks = el.querySelectorAll('.card-action-link');
    actionLinks.forEach((link: Element) => {
      link.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        // Directions start in-app navigation (Google Maps stays the fallback when no handler is wired).
        if (onDirections && (link as HTMLElement).dataset.dlNav === 'directions') {
          e.preventDefault();
          onDirections();
        }
      });
    });
  };

  if (marker.getElement && marker.getElement()) {
    bind();
  } else if (marker.once) {
    marker.once('add', bind);
  }
}

/**
 * Lightweight, modern cluster badge with gradient and activity count.
 */
export function createLightweightClusterHtml(
  count: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const html = `
    <div style="position: relative; cursor: pointer; user-select: none; font-family: 'Cairo', system-ui, sans-serif;">
      <div style="background: #334155; border: 2.5px solid #ffffff; color: #ffffff; width: 42px; height: 42px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.28); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span style="font-size: 13px; font-weight: 800; line-height: 1;">${count}</span>
        <span style="font-size: 8px; font-weight: 800; color: #e2e8f0; line-height: 1;">${formatActivityCountLabel(count)}</span>
      </div>
    </div>
  `;

  return {
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  };
}

/**
 * 📍 Unified per-category pin for a cluster ("تجمع").
 *
 * Same teardrop as every single-activity pin; colour + glyph come from the category.
 * A count badge shows how many activities of THIS category sit in the cluster
 * (hidden when the category has exactly one activity there).
 * `pixelOffset` fans several category pins out around the same cluster centre:
 *   dx        → horizontal shift (px, positive = right)
 *   rowOffset → lift for wrapped rows (px, positive = up)
 * The marker latlng is the cluster centre; the pin tip is placed via iconAnchor.
 */
export function createCategoryClusterPinHtml(
  categoryId: string,
  count: number,
  pixelOffset: [number, number] = [0, 0]
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const style = getCategoryPinStyle(categoryId);
  const [dx, rowOffset] = pixelOffset;
  const boxWidth = 50;
  const pinHeight = 62;
  const safeLabel = escapeHtml(style.label);
  const countLabel = escapeHtml(`${style.label}: ${count} ${formatActivityCountLabel(count)}`);

  // Activity counts are intentionally not drawn on pins (pins always represent real activities).
  const badgeHtml = '';

  const html = `
    <div class="category-cluster-pin" data-category="${escapeHtml(categoryId)}" style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;user-select:none;width:${boxWidth}px;height:${pinHeight}px;font-family:'Cairo',system-ui,sans-serif;" title="${count > 1 ? countLabel : safeLabel}">
      <div class="activity-pin-head" style="position:relative;width:42px;height:56px;flex:0 0 56px;filter:drop-shadow(0 2px 3px rgba(15,23,42,.28));">
        <svg width="42" height="56" viewBox="0 0 30 40" style="display:block;overflow:visible;">
          ${buildActivityPinSvgInner(style.id, style.color)}
        </svg>
        <div style="position:absolute;left:0;right:0;top:11px;height:22px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${style.iconSvg}</svg>
        </div>
        ${badgeHtml}
      </div>
    </div>
  `;

  // Tip of the pin (bottom centre of the box) should land at (dx, +22 - rowOffset) from the cluster centre,
  // so a single row of pins is vertically centred on the cluster point.
  return {
    html,
    iconSize: [boxWidth, pinHeight],
    iconAnchor: [Math.round(boxWidth / 2 - dx), Math.round(pinHeight / 2 + rowOffset)],
  };
}

/**
 * 🧭 Navigation Route Pins (Origin & Destination)
 */
const NAV_FLAG_ICON =
  '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>';
const NAV_BUILDING_ICON =
  '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>';

/** Teardrop pin (same outline as every activity pin) with a white glyph and an optional name card above it. */
function buildTeardropPinHtml(opts: {
  className: string;
  color: string;
  iconSvg: string;
  title?: string;
  subtitle?: string;
  pulse?: boolean;
}): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const width = 150;
  const cardHeight = opts.title ? (opts.subtitle ? 40 : 28) : 0;
  const gap = opts.title ? 4 : 0;
  const pinHeight = 40;
  const totalHeight = cardHeight + gap + pinHeight + 4;
  const card = opts.title
    ? `<div class="nav-pin-card" style="border-color:${opts.color};">
         <b>${escapeHtml(opts.title)}</b>${opts.subtitle ? `<small>${escapeHtml(opts.subtitle)}</small>` : ''}
       </div>`
    : '';
  const html = `
    <div class="${opts.className}" style="position:relative;width:${width}px;height:${totalHeight}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font-family:'Cairo',system-ui,sans-serif;direction:rtl;pointer-events:auto;">
      ${card}
      <div style="position:relative;width:30px;height:${pinHeight}px;margin-top:${gap}px;filter:drop-shadow(0 3px 4px rgba(15,23,42,.35));">
        ${opts.pulse ? `<span class="nav-pin-ring" style="--c:${opts.color};"></span>` : ''}
        <svg width="30" height="40" viewBox="0 0 30 40" style="display:block;overflow:visible;position:relative;">
          <path d="${UNIFIED_PIN_PATH}" fill="${opts.color}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <div style="position:absolute;left:0;right:0;top:11px;height:22px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${opts.iconSvg}</svg>
        </div>
      </div>
    </div>
  `;
  return { html, iconSize: [width, totalHeight], iconAnchor: [width / 2, totalHeight - 3] };
}

/** Building pin (target building / navigation destination for buildings). */
export function createBuildingPinHtml(
  title: string,
  subtitle?: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  return buildTeardropPinHtml({
    className: 'nav-building-pin',
    color: '#d97706',
    iconSvg: NAV_BUILDING_ICON,
    title,
    subtitle,
    pulse: true,
  });
}

export function createNavigationPinHtml(
  type: 'origin' | 'destination',
  label: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const isOrigin = type === 'origin';
  const safeLabel = label || (isOrigin ? 'نقطة الانطلاق' : 'الوجهة');

  if (!isOrigin) {
    return buildTeardropPinHtml({
      className: 'nav-route-pin nav-dest-pin',
      color: '#d97706',
      iconSvg: NAV_FLAG_ICON,
      title: safeLabel,
      pulse: true,
    });
  }

  // Origin: a pulsing blue "you are here" dot with a small name pill.
  const width = 150;
  const totalHeight = 54;
  const html = `
    <div class="nav-route-pin nav-origin-pin" style="position:relative;width:${width}px;height:${totalHeight}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font-family:'Cairo',system-ui,sans-serif;direction:rtl;pointer-events:auto;">
      <div class="nav-pin-card" style="border-color:#2563eb;"><b>${escapeHtml(safeLabel)}</b></div>
      <div style="position:relative;width:22px;height:22px;margin-top:4px;">
        <span class="nav-pin-ring" style="--c:#2563eb;"></span>
        <span style="position:absolute;inset:3px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(37,99,235,.55);"></span>
      </div>
    </div>
  `;
  return { html, iconSize: [width, totalHeight], iconAnchor: [width / 2, totalHeight - 11] };
}
