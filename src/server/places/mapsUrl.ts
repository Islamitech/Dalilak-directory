import { isPrivateOrLocalIp } from '../httpSecurity';

export function isValidGoogleMapsUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (isPrivateOrLocalIp(host) || host.endsWith('.internal') || host.endsWith('.local')) return false;
    const path = parsed.pathname.toLowerCase();
    return (
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host === 'consent.google.com' ||
      /^maps\.google\.(?:com|com\.eg|eg)$/.test(host) ||
      (/^(?:www\.)?google\.(?:com|com\.eg|eg)$/.test(host) && (path === '/maps' || path.startsWith('/maps/')))
    );
  } catch {
    return false;
  }
}

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

export async function safeReadResponseText(response: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<string> {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > maxBytes) throw new Error('Response body exceeds maximum allowed size');
  const text = await response.text();
  if (text.length > maxBytes) throw new Error('Response text exceeds maximum allowed size');
  return text;
}
