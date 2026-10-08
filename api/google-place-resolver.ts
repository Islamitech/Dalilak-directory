import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllowedCorsOrigin } from '../src/server/httpSecurity.js';
import { isValidGoogleMapsUrl } from '../src/server/places/mapsUrl.js';
import { checkRateLimit, getClientIp } from '../src/server/places/rateLimit.js';
import { fetchMapsPage } from '../src/server/places/fetchMapsPage.js';
import { assemblePlaceResult } from '../src/server/places/assemblePlaceResult.js';

export { stripBiDiControls } from '../src/server/places/placeText.js';
export { isValidGoogleMapsUrl } from '../src/server/places/mapsUrl.js';
export { checkRateLimit } from '../src/server/places/rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const corsOrigin = getAllowedCorsOrigin(req.headers.origin as string | undefined);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const limit = checkRateLimit(getClientIp(req));
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json({ error: 'عدد الطلبات كبير، يرجى المحاولة بعد قليل' });
  }

  try {
    const rawUrl = (req.query.url as string) || (req.body && req.body.url);
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'يرجى تزويد رابط خرائط Google صالح' });
    }
    const trimmedUrl = rawUrl.trim();
    if (!isValidGoogleMapsUrl(trimmedUrl)) {
      return res.status(400).json({ error: 'عذراً، الرابط المرسل ليس رابطاً معتمداً لخرائط Google' });
    }

    const page = await fetchMapsPage(trimmedUrl);
    if (page.error) return res.status(400).json({ error: page.error });

    const result = await assemblePlaceResult(page.destinationUrl, page.htmlContent, page.preloadPayload);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'حدث خطأ أثناء فك رابط خرائط Google';
    return res.status(500).json({ success: false, error: message });
  }
}
