export const CANONICAL_HOST = 'www.dalilaak.com';
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

export const ALLOWED_HOSTS = new Set([
  'www.dalilaak.com',
  'dalilaak.com',
  'dalilak.vercel.app',
  'localhost:5173',
  'localhost:3000',
  '127.0.0.1:5173',
  '127.0.0.1:3000',
]);

export const ALLOWED_CORS_ORIGINS = new Set([
  'https://www.dalilaak.com',
  'https://dalilaak.com',
  'https://dalilak.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return false;
  const value = ip.toLowerCase();
  if (value === 'localhost' || value === '127.0.0.1' || value === '0.0.0.0' || value === '::1') return true;
  if (/^10\./.test(value)) return true;
  if (/^192\.168\./.test(value)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(value)) return true;
  if (/^169\.254\./.test(value)) return true;
  if (/^fc00:|^fe80:/i.test(value)) return true;
  return false;
}

export function resolveRequestOrigin(hostHeader: string | undefined, forwardedProto?: string): string {
  const host = (hostHeader || '').toLowerCase().trim();
  if (!ALLOWED_HOSTS.has(host)) return CANONICAL_ORIGIN;
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = forwardedProto === 'http' && isLocal ? 'http' : 'https';
  return `${proto}://${host}`;
}

export function getAllowedCorsOrigin(originHeader: string | undefined): string {
  if (!originHeader) return CANONICAL_ORIGIN;
  try {
    const parsed = new URL(originHeader);
    const host = parsed.host.toLowerCase();
    if (ALLOWED_HOSTS.has(host) && ALLOWED_CORS_ORIGINS.has(originHeader)) {
      return originHeader;
    }
  } catch {
    return CANONICAL_ORIGIN;
  }
  return CANONICAL_ORIGIN;
}
