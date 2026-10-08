/**
 * 📐 Pure Formatting Utilities
 */

/**
 * Formats a kilometer distance into localized Arabic text (e.g. "350 م" or "2.4 كم")
 */
export function formatDistanceString(distanceKm?: number | null): string {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * Puts the Arabic name first when a record stores "English | Arabic".
 */
export function displayBusinessName(nameAr?: string | null, nameEn?: string | null): string {
  const raw = (nameAr || '').trim();
  const source = raw || (nameEn || '').trim();
  if (!source) return '';
  const parts = source.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return source;
  const arabic = parts.filter((part) => /[\u0600-\u06FF]/.test(part));
  const latin = parts.filter((part) => !/[\u0600-\u06FF]/.test(part));
  if (!arabic.length || !latin.length) return source;
  return [...arabic, ...latin].join(' | ');
}

/**
 * Shows a readable hours label, and hides ranges whose AM/PM markers are detached.
 */
export function formatWorkingHoursLabel(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const text = raw.trim().replace(/[–—]/g, '-');
  const times = text.match(/\d{1,2}(?::\d{2})?/g) || [];
  const boundPeriods = text.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm|ص|م)/gi) || [];
  const loosePeriods = text.match(/(?:^|[\s-])(?:am|pm)(?=$|[\s-])/gi) || [];
  if (times.length >= 2 && loosePeriods.length > 0 && boundPeriods.length < times.length) return null;
  if (/[A-Za-z]{3,}/.test(text.replace(/\b(?:am|pm)\b/gi, ''))) return null;
  return text
    .replace(/\s*am\b/gi, ' ص')
    .replace(/\s*pm\b/gi, ' م')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats rating strictly between 1.0 and 5.0. Returns null if unrated.
 * NEVER fabricates fake 4.9 or 5.0 for unrated businesses (Safety Net Contract A5.2).
 */
export function formatActivityCountLabel(count: number): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return 'نشاط';
  if (n === 2) return 'نشاطان';
  if (n >= 3 && n <= 10) return 'أنشطة';
  return 'نشاطاً';
}

export function formatNearbyActivityCount(count: number): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 0) return 'لا أنشطة قريبة';
  if (n === 1) return 'نشاط واحد قريب';
  if (n === 2) return 'نشاطان قريبان';
  if (n <= 10) return `${n} أنشطة قريبة`;
  return `${n} نشاطاً قريباً`;
}

export function getWordRating(rating: number): string {
  if (rating >= 4.5) return 'ممتاز';
  if (rating >= 4) return 'جيد جداً';
  if (rating >= 3) return 'جيد';
  if (rating >= 2) return 'مقبول';
  return 'ضعيف';
}

/** Integer counts with Latin digits across the app. */
export function formatCount(count?: number | null): string {
  if (typeof count !== 'number' || !Number.isFinite(count)) return '0';
  return Math.trunc(count).toLocaleString('en-US');
}

export function formatRating(rating?: number | null): string | null {
  if (typeof rating !== 'number' || !Number.isFinite(rating)) {
    return null;
  }
  if (rating < 1 || rating > 5) {
    return null;
  }
  return rating.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
