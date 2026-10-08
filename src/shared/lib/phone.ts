/**
 * 📞 Pure Egyptian Phone Utilities
 * Handles normalization, validation, international dialing, and WhatsApp sanitization.
 */

export function normalizePhone(num?: string | null): string {
  return (num || '')
    .toString()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[\s\-_()]/g, '');
}

export function isValidEgyptianPhone(num?: string | null): boolean {
  const clean = normalizePhone(num);
  return /^(?:\+?20|0020)?0?1[0125]\d{8}$/.test(clean);
}

/**
 * Returns a normalized 11-digit national phone string (e.g. 01012345678)
 * or a trimmed string if it cannot be parsed as a standard mobile.
 */
export function toNationalEgyptianMobile(num?: string | null): string {
  const clean = normalizePhone(num);
  const match = clean.match(/(?:(?:\+?20|0020)?0?)(1[0125]\d{8})$/);
  return match ? `0${match[1]}` : clean;
}

/**
 * Sanitizes phone number for WhatsApp wa.me links (+201xxxxxxxxx -> 201xxxxxxxxx)
 */
export function cleanPhoneForWhatsApp(num?: string | null): string {
  const clean = normalizePhone(num);
  if (!clean) return '';
  // If already starts with 20 followed by 10 digits
  if (/^201[0125]\d{8}$/.test(clean)) return clean;
  // If starts with +20 or 0020
  if (/^(?:\+20|0020)1[0125]\d{8}$/.test(clean)) return clean.replace(/^\+?0*/, '');
  // If national 01xxxxxxxxx
  if (/^01[0125]\d{8}$/.test(clean)) return `20${clean.substring(1)}`;
  // If 1[0125]xxxxxxxx
  if (/^1[0125]\d{8}$/.test(clean)) return `20${clean}`;
  return clean.replace(/\D/g, '');
}

/**
 * Formats a phone number for legible RTL screen display
 */
export function formatDisplayPhone(num?: string | null): string {
  if (!num) return '';
  const national = toNationalEgyptianMobile(num);
  if (/^01[0125]\d{8}$/.test(national)) {
    return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
  }
  return num.trim();
}
