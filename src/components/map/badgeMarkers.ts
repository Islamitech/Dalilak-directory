import { Business } from '../../types';
import { escapeHtml } from './constants/mapConstants';

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
 * Creates a modern, high-performance Activity Card (بطاقة النشاط الميدانية) for a business pin on the map.
 * Replaces the old round pins with an interactive card showing the activity name, category branding,
 * official verification checkmark, ratings, and optional top-3 prominence rank.
 */
export function createLightweightBadgeHtml(
  biz: Business,
  isSelected: boolean,
  isTopProminent: boolean = false,
  prominenceRank?: number
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const cfg = getCategoryBadgeConfig(biz.category);
  const isVerified = biz.verificationStatus === 'verified';
  const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
  const safeCategory = escapeHtml((biz.category || '').split('/')[0].trim());
  const ratingText = biz.googleRating ? `★ ${biz.googleRating.toFixed(1)}` : (biz.rating ? `★ ${biz.rating.toFixed(1)}` : '★ 4.9');

  const cardWidth = isSelected ? 195 : 180;
  const cardHeight = isTopProminent ? 48 : 44;
  const totalHeight = cardHeight + 10;

  const cardBorder = isSelected
    ? 'border: 2px solid #f59e0b; box-shadow: 0 0 24px rgba(245, 158, 11, 0.8), 0 8px 24px rgba(0,0,0,0.5);'
    : isTopProminent
    ? `border: 2px solid ${cfg.borderColor}; box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 0 12px ${cfg.borderColor}40;`
    : `border: 1.5px solid ${cfg.borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.35);`;

  const rankBadgeHtml = isTopProminent && prominenceRank
    ? `<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-size: 8.5px; font-weight: 900; padding: 0.5px 4.5px; border-radius: 4px; border: 0.5px solid #fef08a; flex-shrink: 0;">#${prominenceRank} الأبرز</span>`
    : '';

  const html = `
    <div class="activity-card-pin ${isTopProminent ? 'top-prominent-pin' : ''}" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: ${cardWidth}px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl;">
      <!-- Main Activity Card Body -->
      <div style="background: rgba(15, 23, 42, 0.94); ${cardBorder} color: #ffffff; padding: 4px 7px; border-radius: 12px; width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 7px; backdrop-filter: blur(10px);">
        <!-- Category Avatar Icon -->
        <div style="background: ${cfg.bg}; width: 25px; height: 25px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            ${cfg.iconSvg}
          </svg>
        </div>

        <!-- Activity Info Text -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
          <div style="display: flex; align-items: center; gap: 3px;">
            <span style="font-weight: 800; font-size: 11px; max-width: ${isTopProminent ? 95 : 110}px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #ffffff;">
              ${safeName}
            </span>
            ${rankBadgeHtml}
            ${isVerified && !rankBadgeHtml ? '<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 9px; font-weight: 900; padding: 0.5px 3px; border-radius: 4px; border: 0.5px solid rgba(52, 211, 153, 0.5); flex-shrink: 0;" title="موثق رسمياً">✓</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 3px; font-size: 9px; margin-top: 1.5px;">
            <span style="color: #fbbf24; font-weight: 800; font-family: monospace;">${ratingText}</span>
            <span style="color: #64748b;">•</span>
            <span style="color: #94a3b8; font-weight: 600; max-width: 75px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${safeCategory}
            </span>
          </div>
        </div>
      </div>

      <!-- Precision Anchor Pointer -->
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0f172a; margin-top: -1px;"></div>
      <div style="width: 6px; height: 6px; border-radius: 9999px; background: ${isSelected ? '#f59e0b' : cfg.bg}; margin-top: -2px; border: 1.5px solid #ffffff; box-shadow: 0 0 8px ${cfg.bg};"></div>
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
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border: 2.5px solid #ffffff; color: #ffffff; width: 42px; height: 42px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span style="font-size: 13px; font-weight: 900; line-height: 1;">${count}</span>
        <span style="font-size: 8px; font-weight: 800; color: #c7d2fe; line-height: 1;">نشاطاً</span>
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
 * Creates an interactive District Cluster Pill ("دبوس مجمع") for remaining activities in a zone.
 * When clicked, triggers camera zoom and bursts remaining activities into cards!
 */
export function createDistrictClusterHtml(
  count: number,
  categoryLabel?: string
): { html: string; iconSize: [number, number]; iconAnchor: [number, number] } {
  const width = 165;
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
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        color: #ffffff;
        border: 2px solid #818cf8;
        border-radius: 9999px;
        padding: 4px 10px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45), 0 2px 8px rgba(0,0,0,0.4);
      ">
        <span style="
          background: #4f46e5;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          padding: 1px 7px;
          border-radius: 9999px;
          border: 1px solid #c7d2fe;
          flex-shrink: 0;
        ">+${count}</span>
        <span style="
          font-size: 11px;
          font-weight: 800;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${safeLabel} إضافية 🔍</span>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0f172a; margin-top: -1px;"></div>
      <div style="width: 6px; height: 6px; border-radius: 50%; background: #818cf8; border: 1.5px solid #ffffff; margin-top: -2px; box-shadow: 0 0 8px #818cf8;"></div>
    </div>
  `;

  return {
    html,
    iconSize: [width, totalHeight],
    iconAnchor: [width / 2, totalHeight],
  };
}

