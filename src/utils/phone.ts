export function normalizePhone(num: string): string {
  return (num || '')
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[\s\-_()]/g, '');
}

export function isValidEgyptianPhone(num: string): boolean {
  const clean = normalizePhone(num);
  return /^(?:\+?20|0020)?0?1[0125]\d{8}$/.test(clean);
}
