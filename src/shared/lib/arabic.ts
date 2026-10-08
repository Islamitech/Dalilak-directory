/**
 * 🔤 Comprehensive Arabic Text & Numeral Normalizer
 */

export function toWesternDigits(str?: string | null): string {
  if (!str) return '';
  return str
    .toString()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776));
}

export function normalizeArabicText(text?: string | null): string {
  if (!text) return '';
  return toWesternDigits(text)
    .trim()
    .toLowerCase()
    // 1. Remove Tashkeel / Harakat
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // 2. Normalize Alef variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // 3. Normalize Teh Marbuta and Heh (ة -> ه)
    .replace(/ة/g, 'ه')
    // 4. Normalize Alef Maksura and Yeh (ى, ی -> ي)
    .replace(/[ىی]/g, 'ي')
    // 5. Normalize Persian / Urdu letters (پ -> ب, ڤ -> ف, ک -> ك)
    .replace(/پ/g, 'ب')
    .replace(/ڤ/g, 'ف')
    .replace(/ک/g, 'ك')
    // 6. Remove Tatweel / Kashida (ـ)
    .replace(/ـ/g, '')
    // 7. Clean extra spaces
    .replace(/\s+/g, ' ');
}

export function matchesArabicSearch(target?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeArabicText(target);
  const normQuery = normalizeArabicText(query);

  if (!normQuery) return true;
  return normTarget.includes(normQuery);
}
