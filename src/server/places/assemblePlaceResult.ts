import {
  addPlacePhoto,
  cleanPlaceName,
  decodeHtmlEntities,
  extractHoursFromPayload,
  extractStructuredPlacePhotos,
  stripBiDiControls,
} from './placeText';
import { fetchOfficialPlacesPhotos } from './officialPlaces';

function normalizeEgyptianPhone(raw: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const digits = raw.replace(/[\s\-_()+]/g, '').trim();
  let local = digits;
  if (local.startsWith('+20')) local = '0' + local.slice(3);
  else if (local.startsWith('0020')) local = '0' + local.slice(4);
  else if (local.startsWith('20') && local.length >= 12) local = '0' + local.slice(2);
  else if (local.startsWith('1') && local.length === 10) local = '0' + local;
  if (local.startsWith('0') && (local.length === 10 || local.length === 11)) return local;
  return undefined;
}

function isBoilerplateAddress(t?: string): boolean {
  if (!t) return true;
  const l = t.toLowerCase();
  return (
    l.includes('find local businesses') ||
    l.includes('view maps') ||
    l.includes('driving directions') ||
    l.includes('معاينة الأنشطة') ||
    l.includes('خرائط google') ||
    l.includes('google maps')
  );
}

export async function assemblePlaceResult(destinationUrl: string, htmlContent: string, preloadPayload: string) {
  let placeName = '';
  let extractedAddressFromTitle: string | undefined;
  const placeUrlMatch = destinationUrl.match(/\/place\/([^/@?]+)/);
  if (placeUrlMatch) {
    let rawUrlName = '';
    try {
      rawUrlName = decodeURIComponent(placeUrlMatch[1]).replace(/\+/g, ' ').trim();
    } catch {
      rawUrlName = placeUrlMatch[1].replace(/\+/g, ' ').trim();
    }
    if (rawUrlName) {
      const cleaned = cleanPlaceName(rawUrlName);
      placeName = cleaned.name;
      if (cleaned.extraAddress) extractedAddressFromTitle = cleaned.extraAddress;
    }
  }

  if (!placeName) {
    try {
      const qParam = new URL(destinationUrl).searchParams.get('q');
      if (qParam && !qParam.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) {
        const cleaned = cleanPlaceName(qParam);
        if (cleaned.name) {
          placeName = cleaned.name;
          if (cleaned.extraAddress && !extractedAddressFromTitle) extractedAddressFromTitle = cleaned.extraAddress;
        }
      }
    } catch {
      /* ignore */
    }
  }

  let titleParts: string[] = [];
  const ogTitleMatch =
    htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
  if (ogTitleMatch?.[1]) {
    const rawOg = ogTitleMatch[1];
    if (rawOg.includes('·')) titleParts = rawOg.split('·').map((s) => s.trim());
    const cleanedOg = cleanPlaceName(rawOg);
    if (!placeName && cleanedOg.name) {
      placeName = cleanedOg.name;
      if (cleanedOg.extraAddress && !extractedAddressFromTitle) extractedAddressFromTitle = cleanedOg.extraAddress;
    }
  }

  if (!placeName) {
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      const cleanedTitle = cleanPlaceName(titleMatch[1]);
      if (cleanedTitle.name && !cleanedTitle.name.includes('خرائط Google') && !cleanedTitle.name.includes('Google Maps')) {
        placeName = cleanedTitle.name;
        if (cleanedTitle.extraAddress && !extractedAddressFromTitle) extractedAddressFromTitle = cleanedTitle.extraAddress;
      }
    }
  }

  let lat: number | undefined;
  let lng: number | undefined;
  const coordsMatch =
    destinationUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    destinationUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    destinationUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordsMatch) {
    lat = parseFloat(coordsMatch[1]);
    lng = parseFloat(coordsMatch[2]);
  } else {
    const embedMatch = htmlContent.match(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
    if (embedMatch) {
      lat = parseFloat(embedMatch[1]);
      lng = parseFloat(embedMatch[2]);
    }
  }

  let phone: string | undefined;
  if (preloadPayload) {
    try {
      let cleanJson = preloadPayload.trim();
      if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
      const gjson = JSON.parse(cleanJson);
      if (gjson?.[6]?.[178] && Array.isArray(gjson[6][178])) {
        for (const item of gjson[6][178]) {
          if (!item) continue;
          const candidates: string[] = [item[3], item[0], item[1]?.[1]?.[0], item[5]?.[0]].filter(Boolean) as string[];
          for (const c of candidates) {
            const n = normalizeEgyptianPhone(c.replace('tel:', ''));
            if (n) {
              phone = n;
              break;
            }
          }
          if (phone) break;
        }
      }
    } catch {
      /* ignore */
    }
  }
  const combinedContent = htmlContent + '\n' + preloadPayload;
  if (!phone) {
    const telMatch = combinedContent.match(/tel:([+0-9\s\-]{8,20})/i);
    if (telMatch) phone = normalizeEgyptianPhone(telMatch[1]) ?? undefined;
  }
  if (!phone) {
    const schemaMatch = htmlContent.match(/"telephone"\s*:\s*"([^"]+)"/i);
    if (schemaMatch) phone = normalizeEgyptianPhone(schemaMatch[1]) ?? undefined;
  }
  if (!phone) {
    const mobileMatches = combinedContent.match(/(?:^|[^0-9.])(\+?20\s*1[0125]\d{8}|01[0125]\d{8})(?=[^0-9]|$)/gm);
    if (mobileMatches?.[0]) {
      phone = normalizeEgyptianPhone(mobileMatches[0].replace(/(?:^[^0-9+])|(?:[^0-9]$)/g, '')) ?? undefined;
    }
  }

  let address: string | undefined;
  if (preloadPayload) {
    try {
      let cleanJson2 = preloadPayload.trim();
      if (cleanJson2.startsWith(")]}'")) cleanJson2 = cleanJson2.slice(4).trim();
      const gjson2 = JSON.parse(cleanJson2);
      if (gjson2?.[6]) {
        if (typeof gjson2[6][39] === 'string' && gjson2[6][39].trim().length > 3 && !isBoilerplateAddress(gjson2[6][39])) {
          address = gjson2[6][39].trim();
        } else if (Array.isArray(gjson2[6][2]) && !address) {
          const parts = (gjson2[6][2] as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
          const joined = parts.join('، ').trim();
          if (parts.length > 0 && !isBoilerplateAddress(joined)) address = joined;
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!address && extractedAddressFromTitle && !isBoilerplateAddress(extractedAddressFromTitle)) {
    address = extractedAddressFromTitle;
  }

  const photos: string[] = [];
  const seenHashes = new Set<string>();
  let officialGoogleCategory: string | undefined;
  const searchQuery = placeName || extractedAddressFromTitle;
  if (searchQuery) {
    try {
      const apiResult = await fetchOfficialPlacesPhotos(searchQuery, lat, lng, 5);
      for (const p of apiResult.photos || []) addPlacePhoto(p, photos, seenHashes, 5);
      if (!placeName && apiResult.displayName) placeName = apiResult.displayName;
      if (!address && apiResult.formattedAddress && !isBoilerplateAddress(apiResult.formattedAddress)) {
        address = apiResult.formattedAddress;
      }
      if (apiResult.googleCategory) officialGoogleCategory = apiResult.googleCategory;
    } catch {
      /* scraper fallback */
    }
  }
  if (photos.length < 5 && preloadPayload) {
    for (const p of extractStructuredPlacePhotos(preloadPayload, 5)) {
      if (photos.length >= 5) break;
      addPlacePhoto(p, photos, seenHashes, 5);
    }
  }
  if (photos.length === 0) {
    const ogImageMatch =
      htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
      const rawOg = ogImageMatch[1].replace(/&amp;/g, '&');
      if (!rawOg.includes('staticmap') && !rawOg.includes('google_maps_logo')) {
        addPlacePhoto(rawOg, photos, seenHashes, 5);
      }
    }
  }

  let rating: number | undefined;
  let reviewCount: number | undefined;
  const ogDescMatch =
    htmlContent.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
    htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
  if (ogDescMatch?.[1]) {
    const desc = decodeHtmlEntities(ogDescMatch[1]);
    const ratingMatch = desc.match(/([1-5](?:[.,]\d)?)\s*(?:★|نجمة|star)/i);
    if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
    const revMatch = desc.match(/\((\d+[\d,]*)\)/);
    if (revMatch) reviewCount = parseInt(revMatch[1].replace(/,/g, ''), 10);
    if (!address && !isBoilerplateAddress(desc)) address = desc;
  }

  let placeCategory: string | undefined = officialGoogleCategory;
  if (!placeCategory && preloadPayload) {
    try {
      let cleanJsonCat = preloadPayload.trim();
      if (cleanJsonCat.startsWith(")]}'")) cleanJsonCat = cleanJsonCat.slice(4).trim();
      const gjsonCat = JSON.parse(cleanJsonCat);
      if (gjsonCat?.[6]) {
        if (Array.isArray(gjsonCat[6][13])) {
          for (const item of gjsonCat[6][13]) {
            if (typeof item === 'string' && item.trim().length > 2) {
              placeCategory = item.trim();
              break;
            }
            if (Array.isArray(item) && typeof item[0] === 'string' && item[0].trim().length > 2) {
              placeCategory = item[0].trim();
              break;
            }
          }
        }
        if (!placeCategory && typeof gjsonCat[6][76] === 'string' && gjsonCat[6][76].trim().length > 2) {
          placeCategory = gjsonCat[6][76].trim();
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!placeCategory && htmlContent) {
    const typeMatch = htmlContent.match(/"@type"\s*:\s*"([A-Za-z]+)"/i);
    if (typeMatch?.[1] && !['LocalBusiness', 'Place', 'Organization', 'WebPage'].includes(typeMatch[1])) {
      placeCategory = typeMatch[1];
    }
    if (!placeCategory) {
      const itemPropCat =
        htmlContent.match(/itemprop=["'](?:category|title)["'][^>]*content=["']([^"']+)["']/i) ||
        htmlContent.match(/<meta[^>]+(?:name|property)=["']category["'][^>]*content=["']([^"']+)["']/i);
      if (itemPropCat?.[1]) placeCategory = itemPropCat[1].trim();
    }
  }
  if (!placeCategory && titleParts.length >= 3) {
    const candidateCat = titleParts[1];
    if (candidateCat && candidateCat.length >= 3 && candidateCat.length <= 40 && !candidateCat.includes('http')) {
      placeCategory = candidateCat;
    }
  }

  return {
    success: true,
    name: placeName ? stripBiDiControls(placeName) : undefined,
    category: placeCategory ? stripBiDiControls(placeCategory) : undefined,
    phone: phone || undefined,
    lat: lat && !isNaN(lat) ? Number(lat.toFixed(6)) : undefined,
    lng: lng && !isNaN(lng) ? Number(lng.toFixed(6)) : undefined,
    rating: rating || undefined,
    reviewCount: reviewCount || undefined,
    address: address ? stripBiDiControls(address) : undefined,
    workingHours: extractHoursFromPayload(preloadPayload || htmlContent) || undefined,
    photo: photos[0],
    photos: photos.length > 0 ? [photos[0]] : undefined,
    resolvedUrl: destinationUrl,
  };
}
