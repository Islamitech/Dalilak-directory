# Source: api/google-place-resolver.ts

``typescript
   1: import type { VercelRequest, VercelResponse } from '@vercel/node';
   2: 
   3: function decodeHtmlEntities(str: string): string {
   4:   return str
   5:     .replace(/&amp;/g, '&')
   6:     .replace(/&lt;/g, '<')
   7:     .replace(/&gt;/g, '>')
   8:     .replace(/&quot;/g, '"')
   9:     .replace(/&#039;/g, "'")
  10:     .replace(/&#39;/g, "'");
  11: }
  12: 
  13: const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;
  14: 
  15: export function stripBiDiControls(str?: string): string {
  16:   if (!str || typeof str !== 'string') return '';
  17:   return str.replace(BIDI_CONTROL_REGEX, '').trim();
  18: }
  19: 
  20: function cleanPlaceName(rawName: string): { name: string; extraAddress?: string } {
  21:   let name = stripBiDiControls(decodeHtmlEntities(rawName));
  22:   name = name.replace(/\s*[-Â·|â€“]\s*(Google Maps|Ø®Ø±Ø§Ø¦Ø· Google|Google).*$/i, '').trim();
  23: 
  24:   // Guard: if name itself is purely "Google Maps" or "Ø®Ø±Ø§Ø¦Ø· Google" or "Google", discard it
  25:   if (/^(Google Maps|Ø®Ø±Ø§Ø¦Ø· Google|Google)$/i.test(name)) {
  26:     return { name: '' };
  27:   }
  28: 
  29:   // Split by common Google Maps delimiters: Arabic comma (ØŒ), English comma (,), middle dot (Â·), pipe (|)
  30:   const parts = name.split(/\s*[\u060C,Â·|]\s*/).map(s => stripBiDiControls(s)).filter(Boolean);
  31:   if (parts.length <= 1) {
  32:     return { name: stripBiDiControls(name) };
  33:   }
  34: 
  35:   const clean = stripBiDiControls(parts[0]);
  36:   const extraAddress = parts.slice(1).map(s => stripBiDiControls(s)).filter(Boolean).join('ØŒ ');
  37:   return { name: clean, extraAddress };
  38: }
  39: 
  40: function extractHoursFromPayload(text: string): string | undefined {
  41:   let workingHours: string | undefined = undefined;
  42:   try {
  43:     let cleanJson = text.trim();
  44:     if (cleanJson.startsWith(")]}'")) {
  45:       cleanJson = cleanJson.slice(4).trim();
  46:     }
  47:     const json = JSON.parse(cleanJson);
  48:     if (json && json[6] && json[6][203]) {
  49:       const hBlock = json[6][203];
  50:       let statusStr = '';
  51:       if (hBlock[1] && hBlock[1][4] && typeof hBlock[1][4][0] === 'string') {
  52:         statusStr = hBlock[1][4][0].trim();
  53:       }
  54:       let timeRange = '';
  55:       if (
  56:         hBlock[0] &&
  57:         hBlock[0][0] &&
  58:         Array.isArray(hBlock[0][0][3]) &&
  59:         hBlock[0][0][3][0] &&
  60:         typeof hBlock[0][0][3][0][0] === 'string'
  61:       ) {
  62:         timeRange = hBlock[0][0][3][0][0].trim();
  63:       }
  64: 
  65:       if (timeRange && statusStr) {
  66:         workingHours = `ÙŠÙˆÙ…ÙŠØ§Ù‹: ${timeRange} (${statusStr})`;
  67:       } else if (timeRange) {
  68:         workingHours = `ÙŠÙˆÙ…ÙŠØ§Ù‹: ${timeRange}`;
  69:       } else if (statusStr) {
  70:         workingHours = statusStr;
  71:       }
  72:     }
  73:   } catch {
  74:     // Fallback if not JSON
  75:   }
  76: 
  77:   if (!workingHours) {
  78:     const statusMatch = text.match(/"((?:Ù…ØºÙ„Ù‚|Ù…ÙØªÙˆØ­)\s*[Â·â€¢\-]\s*[^"\\<]{3,60})"/);
  79:     if (statusMatch) {
  80:       workingHours = statusMatch[1].trim();
  81:     }
  82:   }
  83: 
  84:   return workingHours;
  85: }
  86: 
  87: function addPlacePhoto(rawUrl: string, list: string[], seen: Set<string>, limit = 1): void {
  88:   if (!rawUrl || typeof rawUrl !== 'string' || list.length >= limit) return;
  89:   if (
  90:     rawUrl.includes('google_maps_logo') ||
  91:     rawUrl.includes('staticmap') ||
  92:     rawUrl.includes('maps_512dp') ||
  93:     rawUrl.includes('photo.jpg') ||
  94:     rawUrl.includes('streetviewpixels') ||
  95:     rawUrl.includes('default_avatar') ||
  96:     rawUrl.includes('default-user') ||
  97:     rawUrl.includes('default-avatar')
  98:   ) {
  99:     return;
 100:   }
 101:   const clean = rawUrl.replace(/=w\d+.*$/, '=s1600').replace(/=s\d+.*$/, '=s1600');
 102:   const baseKey = clean.split('=')[0];
 103:   if (!seen.has(baseKey)) {
 104:     seen.add(baseKey);
 105:     list.push(clean.includes('=s1600') ? clean : `${clean}=s1600`);
 106:   }
 107: }
 108: 
 109: /**
 110:  * Extracts photos exclusively belonging to the target place from Google Maps structured JSON (Update 39).
 111:  * Isolates place photos and strictly excludes competitor/nearby recommendation blocks (nodes [99] and [204]).
 112:  */
 113: function extractStructuredPlacePhotos(payload: string, limit = 1): string[] {
 114:   const photos: string[] = [];
 115:   const seenHashes = new Set<string>();
 116:   if (!payload || typeof payload !== 'string') return photos;
 117: 
 118:   try {
 119:     let cleanJson = payload.trim();
 120:     if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
 121:     const gjson = JSON.parse(cleanJson);
 122:     const json6 = gjson && gjson[6];
 123: 
 124:     if (json6 && Array.isArray(json6)) {
 125:       // 1. Primary Featured & Storefront Photos: json[6][72]
 126:       if (json6[72] && Array.isArray(json6[72])) {
 127:         for (const group of json6[72]) {
 128:           if (Array.isArray(group)) {
 129:             for (const item of group) {
 130:               if (item && Array.isArray(item[6]) && typeof item[6][0] === 'string') {
 131:                 addPlacePhoto(item[6][0], photos, seenHashes, limit);
 132:               }
 133:             }
 134:           }
 135:         }
 136:       }
 137: 
 138:       // 2. Identity / Hero Photo: json[6][51]
 139:       if (photos.length < limit && json6[51] && Array.isArray(json6[51])) {
 140:         for (const group of json6[51]) {
 141:           if (Array.isArray(group)) {
 142:             for (const item of group) {
 143:               if (item && Array.isArray(item[6]) && typeof item[6][0] === 'string') {
 144:                 addPlacePhoto(item[6][0], photos, seenHashes, limit);
 145:               }
 146:             }
 147:           }
 148:         }
 149:       }
 150: 
 151:       // 3. User Photos Gallery Tab ("All"): json[6][171]
 152:       if (photos.length < limit && json6[171] && Array.isArray(json6[171])) {
 153:         for (const tab of json6[171]) {
 154:           if (tab && tab[0] && Array.isArray(tab[0][3])) {
 155:             for (const photoItem of tab[0][3]) {
 156:               if (photoItem && Array.isArray(photoItem[6]) && typeof photoItem[6][0] === 'string') {
 157:                 addPlacePhoto(photoItem[6][0], photos, seenHashes, limit);
 158:               }
 159:             }
 160:           }
 161:         }
 162:       }
 163: 
 164:       // 4. Safe place-specific media arrays (excluding competitor/nearby recommendation nodes: 99, 204)
 165:       const safeKeys = [37, 105, 120];
 166:       for (const k of safeKeys) {
 167:         if (photos.length >= limit) break;
 168:         if (json6[k] && Array.isArray(json6[k])) {
 169:           const searchSafe = (node: unknown): void => {
 170:             if (photos.length >= limit || !node) return;
 171:             if (typeof node === 'string') {
 172:               if (
 173:                 node.startsWith('https://lh3.googleusercontent.com/') ||
 174:                 node.startsWith('https://lh5.googleusercontent.com/') ||
 175:                 node.startsWith('https://lh4.googleusercontent.com/') ||
 176:                 node.startsWith('https://lh6.googleusercontent.com/')
 177:               ) {
 178:                 addPlacePhoto(node, photos, seenHashes, limit);
 179:               }
 180:             } else if (Array.isArray(node)) {
 181:               node.forEach(searchSafe);
 182:             }
 183:           };
 184:           searchSafe(json6[k]);
 185:         }
 186:       }
 187:     }
 188:   } catch {
 189:     // Ignore parse errors, fallback cleanly
 190:   }
 191: 
 192:   return photos;
 193: }
 194: 
 195: const GOOGLE_PLACES_API_KEY = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
 196: 
 197: interface PlacesApiPhotoResult {
 198:   photos: string[];
 199:   displayName?: string;
 200:   formattedAddress?: string;
 201:   googleCategory?: string;
 202:   googleType?: string;
 203: }
 204: 
 205: /**
 206:  * Fetches verified official business photos directly from Google Places API (New) (Update 40 & 41).
 207:  * Retrieves up to 5-10 high-resolution (s1600) photos strictly belonging to the target business profile,
 208:  * and extracts official localized Arabic category from primaryTypeDisplayName.
 209:  */
 210: async function fetchOfficialPlacesPhotos(
 211:   query: string,
 212:   lat?: number,
 213:   lng?: number,
 214:   limit = 1
 215: ): Promise<PlacesApiPhotoResult> {
 216:   if (!GOOGLE_PLACES_API_KEY || !query) {
 217:     return { photos: [] };
 218:   }
 219: 
 220:   try {
 221:     const searchBody: Record<string, unknown> = {
 222:       textQuery: query,
 223:       languageCode: 'ar',
 224:     };
 225: 
 226:     if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
 227:       searchBody.locationBias = {
 228:         circle: {
 229:           center: { latitude: lat, longitude: lng },
 230:           radius: 1000.0,
 231:         },
 232:       };
 233:     }
 234: 
 235:     const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
 236:       method: 'POST',
 237:       headers: {
 238:         'Content-Type': 'application/json',
 239:         'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
 240:         'X-Goog-FieldMask':
 241:           'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.formattedAddress,places.photos',
 242:       },
 243:       body: JSON.stringify(searchBody),
 244:       signal: AbortSignal.timeout(6000),
 245:     });
 246: 
 247:     if (!searchRes.ok) {
 248:       return { photos: [] };
 249:     }
 250: 
 251:     const searchData = await searchRes.json();
 252:     if (!searchData.places || !Array.isArray(searchData.places) || searchData.places.length === 0) {
 253:       return { photos: [] };
 254:     }
 255: 
 256:     const matchedPlace = searchData.places[0];
 257:     const googleCategory = matchedPlace.primaryTypeDisplayName?.text;
 258:     const googleType = matchedPlace.primaryType;
 259:     const rawPhotos = matchedPlace.photos;
 260:     if (!Array.isArray(rawPhotos) || rawPhotos.length === 0) {
 261:       return {
 262:         photos: [],
 263:         displayName: stripBiDiControls(matchedPlace.displayName?.text),
 264:         formattedAddress: stripBiDiControls(matchedPlace.formattedAddress),
 265:         googleCategory,
 266:         googleType,
 267:       };
 268:     }
 269: 
 270:     const targetPhotos = rawPhotos.slice(0, limit);
 271:     const resolvedUrls = (
 272:       await Promise.all(
 273:         targetPhotos.map(async (p: { name?: string }) => {
 274:           if (!p.name) return null;
 275:           try {
 276:             const mediaUrl = `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
 277:             const mediaRes = await fetch(mediaUrl, { signal: AbortSignal.timeout(4000) });
 278:             if (mediaRes.ok) {
 279:               const mediaData = await mediaRes.json();
 280:               if (mediaData && mediaData.photoUri && typeof mediaData.photoUri === 'string') {
 281:                 return mediaData.photoUri as string;
 282:               }
 283:             }
 284:           } catch {
 285:             // Continue fetching other photos
 286:           }
 287:           return null;
 288:         })
 289:       )
 290:     ).filter((u): u is string => Boolean(u));
 291: 
 292:     return {
 293:       photos: resolvedUrls,
 294:       displayName: stripBiDiControls(matchedPlace.displayName?.text),
 295:       formattedAddress: stripBiDiControls(matchedPlace.formattedAddress),
 296:       googleCategory,
 297:       googleType,
 298:     };
 299:   } catch {
 300:     return { photos: [] };
 301:   }
 302: }
 303: 
 304: // ðŸ›¡ï¸ SSRF Guard: Validates that URL strictly targets official Google Maps domains and blocks private/loopback addresses
 305: export function isValidGoogleMapsUrl(urlStr: string): boolean {
 306:   try {
 307:     const parsed = new URL(urlStr);
 308:     if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
 309: 
 310:     const host = parsed.hostname.toLowerCase();
 311:     // Block loopback, RFC1918 private subnets, link-local, cloud metadata
 312:     if (
 313:       host === 'localhost' ||
 314:       host === '127.0.0.1' ||
 315:       host === '0.0.0.0' ||
 316:       host === '::1' ||
 317:       host.startsWith('10.') ||
 318:       host.startsWith('192.168.') ||
 319:       host.startsWith('169.254.') ||
 320:       host.endsWith('.internal') ||
 321:       host.endsWith('.local')
 322:     ) {
 323:       return false;
 324:     }
 325: 
 326:     // Google Maps official domains
 327:     const isGoogleHost =
 328:       host === 'maps.app.goo.gl' ||
 329:       host === 'goo.gl' ||
 330:       host === 'google.com' ||
 331:       host === 'www.google.com' ||
 332:       host === 'maps.google.com' ||
 333:       /^(?:[a-z0-9-]+\.)*google\.(?:com|com\.eg|eg|net|co\.[a-z]{2})$/i.test(host);
 334: 
 335:     return isGoogleHost;
 336:   } catch {
 337:     return false;
 338:   }
 339: }
 340: 
 341: export default async function handler(req: VercelRequest, res: VercelResponse) {
 342:   res.setHeader('Access-Control-Allow-Origin', '*');
 343:   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
 344:   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 345: 
 346:   if (req.method === 'OPTIONS') {
 347:     return res.status(204).end();
 348:   }
 349: 
 350:   try {
 351:     const rawUrl = (req.query.url as string) || (req.body && req.body.url);
 352:     if (!rawUrl || typeof rawUrl !== 'string') {
 353:       return res.status(400).json({ error: 'ÙŠØ±Ø¬Ù‰ ØªØ²ÙˆÙŠØ¯ Ø±Ø§Ø¨Ø· Ø®Ø±Ø§Ø¦Ø· Google ØµØ§Ù„Ø­' });
 354:     }
 355: 
 356:     const trimmedUrl = rawUrl.trim();
 357:     if (!isValidGoogleMapsUrl(trimmedUrl)) {
 358:       return res.status(400).json({ error: 'Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ø±Ø³Ù„ Ù„ÙŠØ³ Ø±Ø§Ø¨Ø·Ø§Ù‹ Ù…Ø¹ØªÙ…Ø¯Ø§Ù‹ Ù„Ø®Ø±Ø§Ø¦Ø· Google' });
 359:     }
 360: 
 361:     let destinationUrl = trimmedUrl;
 362: 
 363:     const controller = new AbortController();
 364:     const timeoutId = setTimeout(() => controller.abort(), 6000);
 365: 
 366:     let htmlContent = '';
 367:     let preloadPayload = '';
 368: 
 369:     try {
 370:       // 1. Fetch with Desktop Chrome to unfurl redirects and obtain preload place data, validating each hop
 371:       let currentHopUrl = trimmedUrl;
 372:       let desktopResponse: Response | null = null;
 373:       let hops = 0;
 374:       const MAX_HOPS = 6;
 375: 
 376:       while (hops < MAX_HOPS) {
 377:         if (!isValidGoogleMapsUrl(currentHopUrl)) {
 378:           return res.status(400).json({ error: 'Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø¥Ø¹Ø§Ø¯Ø© ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ø±Ø§Ø¨Ø· ØªÙ‚ÙˆØ¯ Ø¥Ù„Ù‰ Ù†Ø·Ø§Ù‚ ØºÙŠØ± Ù…Ø¹ØªÙ…Ø¯' });
 379:         }
 380: 
 381:         desktopResponse = await fetch(currentHopUrl, {
 382:           method: 'GET',
 383:           redirect: 'manual',
 384:           headers: {
 385:             'User-Agent':
 386:               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
 387:             'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
 388:             Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
 389:           },
 390:           signal: controller.signal,
 391:         });
 392: 
 393:         if ([301, 302, 303, 307, 308].includes(desktopResponse.status)) {
 394:           const nextLocation = desktopResponse.headers.get('location');
 395:           if (!nextLocation) break;
 396:           const resolvedNext = new URL(nextLocation, currentHopUrl).toString();
 397:           if (!isValidGoogleMapsUrl(resolvedNext)) {
 398:             return res.status(400).json({ error: 'Ø¹Ø°Ø±Ø§Ù‹ØŒ Ø¥Ø¹Ø§Ø¯Ø© ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ø±Ø§Ø¨Ø· ØªÙ‚ÙˆØ¯ Ø¥Ù„Ù‰ Ù†Ø·Ø§Ù‚ ØºÙŠØ± Ù…Ø¹ØªÙ…Ø¯' });
 399:           }
 400:           currentHopUrl = resolvedNext;
 401:           hops++;
 402:         } else {
 403:           break;
 404:         }
 405:       }
 406: 
 407:       if (!desktopResponse) {
 408:         return res.status(400).json({ error: 'ØªØ¹Ø°Ø± ÙØªØ­ Ø§Ù„Ø±Ø§Ø¨Ø·' });
 409:       }
 410: 
 411:       destinationUrl = currentHopUrl;
 412:       htmlContent = await desktopResponse.text();
 413: 
 414:       // Check if place has preload link for detailed hours & multi-photos
 415:       const preloadMatch = htmlContent.match(/<link\s+href="(\/maps\/preview\/place[^"]+)"\s+as="fetch"/i);
 416:       if (preloadMatch) {
 417:         const preloadUrl = 'https://www.google.com' + preloadMatch[1].replace(/&amp;/g, '&');
 418:         try {
 419:           const pRes = await fetch(preloadUrl, {
 420:             headers: {
 421:               'User-Agent':
 422:                 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
 423:               'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
 424:               Referer: 'https://www.google.com/maps',
 425:             },
 426:             signal: controller.signal,
 427:           });
 428:           if (pRes.ok) {
 429:             preloadPayload = await pRes.text();
 430:           }
 431:         } catch {
 432:           // Preload fetch failed, fallback to main HTML
 433:         }
 434:       }
 435: 
 436:       // If place name or og metadata wasn't in desktop HTML, try crawler SSR
 437:       if (!htmlContent.includes('og:title') && !htmlContent.includes('og:image')) {
 438:         try {
 439:           const botResponse = await fetch(destinationUrl, {
 440:             headers: {
 441:               'User-Agent': 'Twitterbot/1.0',
 442:               'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
 443:             },
 444:             signal: controller.signal,
 445:           });
 446:           if (botResponse.ok) {
 447:             const botHtml = await botResponse.text();
 448:             htmlContent += '\n' + botHtml;
 449:           }
 450:         } catch {
 451:           // Ignore bot fetch errors
 452:         }
 453:       }
 454:     } catch {
 455:       // If network fetch fails, proceed with URL parsing
 456:     } finally {
 457:       clearTimeout(timeoutId);
 458:     }
 459: 
 460:     let placeName = '';
 461:     let extractedAddressFromTitle: string | undefined = undefined;
 462: 
 463:     const placeUrlMatch = destinationUrl.match(/\/place\/([^/@?]+)/);
 464:     if (placeUrlMatch) {
 465:       let rawUrlName = '';
 466:       try {
 467:         rawUrlName = decodeURIComponent(placeUrlMatch[1]).replace(/\+/g, ' ').trim();
 468:       } catch {
 469:         rawUrlName = placeUrlMatch[1].replace(/\+/g, ' ').trim();
 470:       }
 471:       if (rawUrlName) {
 472:         const cleaned = cleanPlaceName(rawUrlName);
 473:         placeName = cleaned.name;
 474:         if (cleaned.extraAddress) {
 475:           extractedAddressFromTitle = cleaned.extraAddress;
 476:         }
 477:       }
 478:     }
 479: 
 480:     // Support query parameter q (e.g. /maps?q=... or shortlink redirect target)
 481:     if (!placeName) {
 482:       try {
 483:         const urlObj = new URL(destinationUrl);
 484:         const qParam = urlObj.searchParams.get('q');
 485:         if (qParam && !qParam.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) {
 486:           const cleaned = cleanPlaceName(qParam);
 487:           if (cleaned.name) {
 488:             placeName = cleaned.name;
 489:             if (cleaned.extraAddress && !extractedAddressFromTitle) {
 490:               extractedAddressFromTitle = cleaned.extraAddress;
 491:             }
 492:           }
 493:         }
 494:       } catch {
 495:         // Ignore invalid URL
 496:       }
 497:     }
 498: 
 499:     let titleParts: string[] = [];
 500:     const ogTitleMatch =
 501:       htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
 502:       htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
 503:     if (ogTitleMatch && ogTitleMatch[1]) {
 504:       const rawOg = ogTitleMatch[1];
 505:       if (rawOg.includes('Â·')) {
 506:         titleParts = rawOg.split('Â·').map(s => s.trim());
 507:       }
 508:       const cleanedOg = cleanPlaceName(rawOg);
 509:       if (!placeName && cleanedOg.name) {
 510:         placeName = cleanedOg.name;
 511:         if (cleanedOg.extraAddress && !extractedAddressFromTitle) {
 512:           extractedAddressFromTitle = cleanedOg.extraAddress;
 513:         }
 514:       }
 515:     }
 516: 
 517:     if (!placeName) {
 518:       const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
 519:       if (titleMatch && titleMatch[1]) {
 520:         const cleanedTitle = cleanPlaceName(titleMatch[1]);
 521:         if (cleanedTitle.name && !cleanedTitle.name.includes('Ø®Ø±Ø§Ø¦Ø· Google') && !cleanedTitle.name.includes('Google Maps')) {
 522:           placeName = cleanedTitle.name;
 523:           if (cleanedTitle.extraAddress && !extractedAddressFromTitle) {
 524:             extractedAddressFromTitle = cleanedTitle.extraAddress;
 525:           }
 526:         }
 527:       }
 528:     }
 529: 
 530:     let lat: number | undefined = undefined;
 531:     let lng: number | undefined = undefined;
 532: 
 533:     const coordsMatch =
 534:       destinationUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
 535:       destinationUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
 536:       destinationUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
 537: 
 538:     if (coordsMatch) {
 539:       lat = parseFloat(coordsMatch[1]);
 540:       lng = parseFloat(coordsMatch[2]);
 541:     } else {
 542:       const embedMatch = htmlContent.match(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
 543:       if (embedMatch) {
 544:         lat = parseFloat(embedMatch[1]);
 545:         lng = parseFloat(embedMatch[2]);
 546:       }
 547:     }
 548: 
 549:     // â”€â”€â”€ Multi-Strategy Phone Extraction (Update 34) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 550:     const normalizeEgyptianPhone = (raw: string): string | undefined => {
 551:       if (!raw || typeof raw !== 'string') return undefined;
 552:       const digits = raw.replace(/[\s\-_()+]/g, '').trim();
 553:       let local = digits;
 554:       if (local.startsWith('+20')) local = '0' + local.slice(3);
 555:       else if (local.startsWith('0020')) local = '0' + local.slice(4);
 556:       else if (local.startsWith('20') && local.length >= 12) local = '0' + local.slice(2);
 557:       else if (local.startsWith('1') && local.length === 10) local = '0' + local;
 558:       if (local.startsWith('0') && (local.length === 10 || local.length === 11)) return local;
 559:       return undefined;
 560:     };
 561: 
 562:     let phone: string | undefined = undefined;
 563: 
 564:     // Strategy 1: Structured Google Maps Preload JSON â†’ json[6][178]
 565:     if (preloadPayload && !phone) {
 566:       try {
 567:         let cleanJson = preloadPayload.trim();
 568:         if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
 569:         const gjson = JSON.parse(cleanJson);
 570:         if (gjson && gjson[6] && gjson[6][178] && Array.isArray(gjson[6][178])) {
 571:           for (const item of gjson[6][178]) {
 572:             if (!item) continue;
 573:             const candidates: string[] = [
 574:               item[3], item[0],
 575:               item[1] && item[1][1] && item[1][1][0],
 576:               item[5] && item[5][0],
 577:             ].filter(Boolean) as string[];
 578:             for (const c of candidates) {
 579:               const n = normalizeEgyptianPhone(c.replace('tel:', ''));
 580:               if (n) { phone = n; break; }
 581:             }
 582:             if (phone) break;
 583:           }
 584:         }
 585:         if (!phone) {
 586:           const searchTel = (node: unknown): void => {
 587:             if (phone) return;
 588:             if (typeof node === 'string') {
 589:               if (node.startsWith('tel:')) {
 590:                 const n = normalizeEgyptianPhone(node.slice(4));
 591:                 if (n) phone = n;
 592:               }
 593:             } else if (Array.isArray(node)) {
 594:               node.forEach(searchTel);
 595:             } else if (node && typeof node === 'object') {
 596:               Object.values(node as Record<string, unknown>).forEach(searchTel);
 597:             }
 598:           };
 599:           searchTel(gjson);
 600:         }
 601:       } catch { /* ignore parse errors */ }
 602:     }
 603: 
 604:     // Strategy 2: Explicit tel: link in HTML or combined text
 605:     if (!phone) {
 606:       const combinedContent = htmlContent + '\n' + preloadPayload;
 607:       const telMatch = combinedContent.match(/tel:([+0-9\s\-]{8,20})/i);
 608:       if (telMatch) phone = normalizeEgyptianPhone(telMatch[1]) ?? undefined;
 609:     }
 610: 
 611:     // Strategy 3: Schema.org telephone
 612:     if (!phone) {
 613:       const schemaMatch = htmlContent.match(/"telephone"\s*:\s*"([^"]+)"/i);
 614:       if (schemaMatch) phone = normalizeEgyptianPhone(schemaMatch[1]) ?? undefined;
 615:     }
 616: 
 617:     // Strategy 4: Egyptian mobile strict boundary
 618:     if (!phone) {
 619:       const mobileMatches = (htmlContent + '\n' + preloadPayload).match(
 620:         /(?:^|[^0-9.])(\+?20\s*1[0125]\d{8}|01[0125]\d{8})(?=[^0-9]|$)/gm
 621:       );
 622:       if (mobileMatches && mobileMatches.length > 0) {
 623:         const raw = mobileMatches[0].replace(/(?:^[^0-9+])|(?:[^0-9]$)/g, '');
 624:         phone = normalizeEgyptianPhone(raw) ?? undefined;
 625:       }
 626:     }
 627:     // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 628: 
 629:     // â”€â”€â”€ Address Extraction with Boilerplate Guard (Update 34) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 630:     const isBoilerplateAddress = (t?: string): boolean => {
 631:       if (!t) return true;
 632:       const l = t.toLowerCase();
 633:       return (
 634:         l.includes('find local businesses') ||
 635:         l.includes('view maps') ||
 636:         l.includes('driving directions') ||
 637:         l.includes('Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø£Ù†Ø´Ø·Ø©') ||
 638:         l.includes('Ø®Ø±Ø§Ø¦Ø· google') ||
 639:         l.includes('google maps')
 640:       );
 641:     };
 642: 
 643:     let address: string | undefined = undefined;
 644: 
 645:     // Try structured preload JSON first
 646:     if (preloadPayload) {
 647:       try {
 648:         let cleanJson2 = preloadPayload.trim();
 649:         if (cleanJson2.startsWith(")]}'")) cleanJson2 = cleanJson2.slice(4).trim();
 650:         const gjson2 = JSON.parse(cleanJson2);
 651:         if (gjson2 && gjson2[6]) {
 652:           if (typeof gjson2[6][39] === 'string' && gjson2[6][39].trim().length > 3 && !isBoilerplateAddress(gjson2[6][39])) {
 653:             address = gjson2[6][39].trim();
 654:           } else if (Array.isArray(gjson2[6][2]) && !address) {
 655:             const parts = (gjson2[6][2] as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
 656:             if (parts.length > 0) {
 657:               const joined = parts.join('ØŒ ').trim();
 658:               if (!isBoilerplateAddress(joined)) address = joined;
 659:             }
 660:           }
 661:         }
 662:       } catch { /* ignore */ }
 663:     }
 664:     // Fallback to og:title extracted part
 665:     if (!address && extractedAddressFromTitle && !isBoilerplateAddress(extractedAddressFromTitle)) {
 666:       address = extractedAddressFromTitle;
 667:     }
 668:     // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 669:     let rating: number | undefined = undefined;
 670:     let reviewCount: number | undefined = undefined;
 671:     const seenHashes = new Set<string>();
 672: 
 673:     // â”€â”€â”€ Photo Extraction (Update 40: Google Places API New + Anti-Bleed Scraper Hybrid) â”€â”€â”€
 674:     const photos: string[] = [];
 675:     let officialGoogleCategory: string | undefined = undefined;
 676: 
 677:     // Strategy 1 (Top Priority): Official Places API (New) (5 guaranteed high-res photos)
 678:     const searchQuery = placeName || extractedAddressFromTitle;
 679:     if (searchQuery) {
 680:       try {
 681:         const apiResult = await fetchOfficialPlacesPhotos(searchQuery, lat, lng, 5);
 682:         if (apiResult.photos && apiResult.photos.length > 0) {
 683:           for (const p of apiResult.photos) {
 684:             addPlacePhoto(p, photos, seenHashes, 5);
 685:           }
 686:         }
 687:         if (!placeName && apiResult.displayName) {
 688:           placeName = apiResult.displayName;
 689:         }
 690:         if (!address && apiResult.formattedAddress && !isBoilerplateAddress(apiResult.formattedAddress)) {
 691:           address = apiResult.formattedAddress;
 692:         }
 693:         if (apiResult.googleCategory) {
 694:           officialGoogleCategory = apiResult.googleCategory;
 695:         }
 696:       } catch {
 697:         // Fallback silently to scraper
 698:       }
 699:     }
 700: 
 701:     // Strategy 2: Preload JSON Structured Photos (Update 39 Anti-Bleed Isolation) fallback / backfill
 702:     if (photos.length < 5 && preloadPayload) {
 703:       const scraperPhotos = extractStructuredPlacePhotos(preloadPayload, 5);
 704:       for (const p of scraperPhotos) {
 705:         if (photos.length >= 5) break;
 706:         addPlacePhoto(p, photos, seenHashes, 5);
 707:       }
 708:     }
 709: 
 710:     // Strategy 3: OpenGraph Cover Photo fallback (only if still no photos)
 711:     if (photos.length === 0) {
 712:       const ogImageMatch =
 713:         htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
 714:         htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
 715:       if (ogImageMatch && ogImageMatch[1]) {
 716:         const rawOg = ogImageMatch[1].replace(/&amp;/g, '&');
 717:         if (!rawOg.includes('staticmap') && !rawOg.includes('google_maps_logo')) {
 718:           addPlacePhoto(rawOg, photos, seenHashes, 5);
 719:         }
 720:       }
 721:     }
 722: 
 723:     const photo = photos.length > 0 ? photos[0] : undefined;
 724: 
 725:     // 5. Working Hours Extraction (from preload payload and HTML)
 726:     let workingHours: string | undefined = undefined;
 727:     if (preloadPayload) {
 728:       workingHours = extractHoursFromPayload(preloadPayload);
 729:     }
 730:     if (!workingHours && htmlContent) {
 731:       workingHours = extractHoursFromPayload(htmlContent);
 732:     }
 733: 
 734:     const ogDescMatch =
 735:       htmlContent.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
 736:       htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
 737:     if (ogDescMatch && ogDescMatch[1]) {
 738:       const desc = decodeHtmlEntities(ogDescMatch[1]);
 739:       const ratingMatch = desc.match(/([1-5](?:[.,]\d)?)\s*(?:â˜…|Ù†Ø¬Ù…Ø©|star)/i);
 740:       if (ratingMatch) {
 741:         rating = parseFloat(ratingMatch[1].replace(',', '.'));
 742:       }
 743:       const revMatch = desc.match(/\((\d+[\d,]*)\)/);
 744:       if (revMatch) {
 745:         reviewCount = parseInt(revMatch[1].replace(/,/g, ''), 10);
 746:       }
 747:       // Only use description as address fallback if not already found and not boilerplate
 748:       if (!address && !isBoilerplateAddress(desc)) {
 749:         address = desc;
 750:       }
 751:     }
 752: 
 753:     // â”€â”€â”€ 6. Category Extraction from Google Places (Update 36 & 41) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 754:     let placeCategory: string | undefined = officialGoogleCategory;
 755: 
 756:     // A. From preloadPayload JSON (internal Google Places structure fallback)
 757:     if (!placeCategory && preloadPayload) {
 758:       try {
 759:         let cleanJsonCat = preloadPayload.trim();
 760:         if (cleanJsonCat.startsWith(")]}'")) cleanJsonCat = cleanJsonCat.slice(4).trim();
 761:         const gjsonCat = JSON.parse(cleanJsonCat);
 762:         if (gjsonCat && gjsonCat[6]) {
 763:           if (Array.isArray(gjsonCat[6][13])) {
 764:             for (const item of gjsonCat[6][13]) {
 765:               if (typeof item === 'string' && item.trim().length > 2) {
 766:                 placeCategory = item.trim();
 767:                 break;
 768:               } else if (Array.isArray(item) && typeof item[0] === 'string' && item[0].trim().length > 2) {
 769:                 placeCategory = item[0].trim();
 770:                 break;
 771:               }
 772:             }
 773:           }
 774:           if (!placeCategory && typeof gjsonCat[6][76] === 'string' && gjsonCat[6][76].trim().length > 2) {
 775:             placeCategory = gjsonCat[6][76].trim();
 776:           }
 777:         }
 778:       } catch { /* ignore */ }
 779:     }
 780: 
 781:     // B. From HTML Schema.org JSON-LD or meta/itemprop tags
 782:     if (!placeCategory && htmlContent) {
 783:       const typeMatch = htmlContent.match(/"@type"\s*:\s*"([A-Za-z]+)"/i);
 784:       if (typeMatch && typeMatch[1] && !['LocalBusiness', 'Place', 'Organization', 'WebPage'].includes(typeMatch[1])) {
 785:         placeCategory = typeMatch[1];
 786:       }
 787:       if (!placeCategory) {
 788:         const itemPropCat = htmlContent.match(/itemprop=["'](?:category|title)["'][^>]*content=["']([^"']+)["']/i) ||
 789:                             htmlContent.match(/<meta[^>]+(?:name|property)=["']category["'][^>]*content=["']([^"']+)["']/i);
 790:         if (itemPropCat && itemPropCat[1]) {
 791:           placeCategory = itemPropCat[1].trim();
 792:         }
 793:       }
 794:     }
 795: 
 796:     // C. From og:title if it has 3 parts (Name Â· Category Â· Location)
 797:     if (!placeCategory && titleParts.length >= 3) {
 798:       const candidateCat = titleParts[1];
 799:       if (candidateCat && candidateCat.length >= 3 && candidateCat.length <= 40 && !candidateCat.includes('http')) {
 800:         placeCategory = candidateCat;
 801:       }
 802:     }
 803: 
 804:     return res.status(200).json({
 805:       success: true,
 806:       name: placeName ? stripBiDiControls(placeName) : undefined,
 807:       category: placeCategory ? stripBiDiControls(placeCategory) : undefined,
 808:       phone: phone || undefined,
 809:       lat: lat && !isNaN(lat) ? Number(lat.toFixed(6)) : undefined,
 810:       lng: lng && !isNaN(lng) ? Number(lng.toFixed(6)) : undefined,
 811:       rating: rating || undefined,
 812:       reviewCount: reviewCount || undefined,
 813:       address: address ? stripBiDiControls(address) : undefined,
 814:       workingHours: workingHours || undefined,
 815:       photo,
 816:       photos: photos.length > 0 ? [photos[0]] : undefined,
 817:       resolvedUrl: destinationUrl,
 818:     });
 819:   } catch (err: any) {
 820:     return res.status(500).json({
 821:       success: false,
 822:       error: err?.message || 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ÙÙƒ Ø±Ø§Ø¨Ø· Ø®Ø±Ø§Ø¦Ø· Google',
 823:     });
 824:   }
 825: }
``
