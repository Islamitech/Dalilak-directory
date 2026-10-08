import { isValidGoogleMapsUrl, safeReadResponseText } from './mapsUrl';

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchMapsPage(trimmedUrl: string): Promise<{
  destinationUrl: string;
  htmlContent: string;
  preloadPayload: string;
  error?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  let destinationUrl = trimmedUrl;
  let htmlContent = '';
  let preloadPayload = '';

  try {
    let currentHopUrl = trimmedUrl;
    let desktopResponse: Response | null = null;
    let hops = 0;
    const MAX_HOPS = 6;

    while (hops < MAX_HOPS) {
      if (!isValidGoogleMapsUrl(currentHopUrl)) {
        return { destinationUrl, htmlContent, preloadPayload, error: 'عذراً، إعادة توجيه الرابط تقود إلى نطاق غير معتمد' };
      }
      desktopResponse = await fetch(currentHopUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      if ([301, 302, 303, 307, 308].includes(desktopResponse.status)) {
        const nextLocation = desktopResponse.headers.get('location');
        if (!nextLocation) break;
        const resolvedNext = new URL(nextLocation, currentHopUrl).toString();
        if (!isValidGoogleMapsUrl(resolvedNext)) {
          return { destinationUrl, htmlContent, preloadPayload, error: 'عذراً، إعادة توجيه الرابط تقود إلى نطاق غير معتمد' };
        }
        currentHopUrl = resolvedNext;
        hops++;
      } else {
        break;
      }
    }

    if (!desktopResponse) {
      return { destinationUrl, htmlContent, preloadPayload, error: 'تعذر فتح الرابط' };
    }

    destinationUrl = currentHopUrl;
    htmlContent = await safeReadResponseText(desktopResponse);

    const preloadMatch = htmlContent.match(/<link\s+href="(\/maps\/preview\/place[^"]+)"\s+as="fetch"/i);
    if (preloadMatch) {
      const preloadUrl = 'https://www.google.com' + preloadMatch[1].replace(/&amp;/g, '&');
      try {
        const pRes = await fetch(preloadUrl, {
          headers: {
            'User-Agent': DESKTOP_UA,
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            Referer: 'https://www.google.com/maps',
          },
          signal: controller.signal,
        });
        if (pRes.ok) preloadPayload = await safeReadResponseText(pRes);
      } catch {
        /* fallback to HTML */
      }
    }

    if (!htmlContent.includes('og:title') && !htmlContent.includes('og:image')) {
      try {
        const botResponse = await fetch(destinationUrl, {
          headers: { 'User-Agent': 'Twitterbot/1.0', 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
          signal: controller.signal,
        });
        if (botResponse.ok) htmlContent += '\n' + (await safeReadResponseText(botResponse));
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* URL parsing fallback */
  } finally {
    clearTimeout(timeoutId);
  }

  return { destinationUrl, htmlContent, preloadPayload };
}
