export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function stripBiDiControls(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(BIDI_CONTROL_REGEX, '').trim();
}

export function cleanPlaceName(rawName: string): { name: string; extraAddress?: string } {
  let name = stripBiDiControls(decodeHtmlEntities(rawName));
  name = name.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();
  if (/^(Google Maps|خرائط Google|Google)$/i.test(name)) {
    return { name: '' };
  }
  const parts = name.split(/\s*[\u060C,·|]\s*/).map((s) => stripBiDiControls(s)).filter(Boolean);
  if (parts.length <= 1) return { name: stripBiDiControls(name) };
  return {
    name: stripBiDiControls(parts[0]),
    extraAddress: parts.slice(1).filter(Boolean).join('، '),
  };
}

export function extractHoursFromPayload(text: string): string | undefined {
  let workingHours: string | undefined;
  try {
    let cleanJson = text.trim();
    if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
    const json = JSON.parse(cleanJson);
    if (json && json[6] && json[6][203]) {
      const hBlock = json[6][203];
      let statusStr = '';
      if (hBlock[1] && hBlock[1][4] && typeof hBlock[1][4][0] === 'string') {
        statusStr = hBlock[1][4][0].trim();
      }
      let timeRange = '';
      if (hBlock[0]?.[0] && Array.isArray(hBlock[0][0][3]) && typeof hBlock[0][0][3][0]?.[0] === 'string') {
        timeRange = hBlock[0][0][3][0][0].trim();
      }
      if (timeRange && statusStr) workingHours = `يومياً: ${timeRange} (${statusStr})`;
      else if (timeRange) workingHours = `يومياً: ${timeRange}`;
      else if (statusStr) workingHours = statusStr;
    }
  } catch {
    /* ignore */
  }
  if (!workingHours) {
    const statusMatch = text.match(/"((?:مغلق|مفتوح)\s*[·•\-]\s*[^"\\<]{3,60})"/);
    if (statusMatch) workingHours = statusMatch[1].trim();
  }
  return workingHours;
}

export function addPlacePhoto(rawUrl: string, list: string[], seen: Set<string>, limit = 1): void {
  if (!rawUrl || typeof rawUrl !== 'string' || list.length >= limit) return;
  if (
    rawUrl.includes('google_maps_logo') ||
    rawUrl.includes('staticmap') ||
    rawUrl.includes('maps_512dp') ||
    rawUrl.includes('photo.jpg') ||
    rawUrl.includes('streetviewpixels') ||
    rawUrl.includes('default_avatar') ||
    rawUrl.includes('default-user') ||
    rawUrl.includes('default-avatar')
  ) {
    return;
  }
  const clean = rawUrl.replace(/=w\d+.*$/, '=s1600').replace(/=s\d+.*$/, '=s1600');
  const baseKey = clean.split('=')[0];
  if (!seen.has(baseKey)) {
    seen.add(baseKey);
    list.push(clean.includes('=s1600') ? clean : `${clean}=s1600`);
  }
}

export function extractStructuredPlacePhotos(payload: string, limit = 1): string[] {
  const photos: string[] = [];
  const seenHashes = new Set<string>();
  if (!payload || typeof payload !== 'string') return photos;
  try {
    let cleanJson = payload.trim();
    if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
    const gjson = JSON.parse(cleanJson);
    const json6 = gjson && gjson[6];
    if (!json6 || !Array.isArray(json6)) return photos;

    const collectFromGroups = (groups: unknown) => {
      if (!Array.isArray(groups)) return;
      for (const group of groups) {
        if (!Array.isArray(group)) continue;
        for (const item of group) {
          if (item && Array.isArray(item[6]) && typeof item[6][0] === 'string') {
            addPlacePhoto(item[6][0], photos, seenHashes, limit);
          }
        }
      }
    };

    collectFromGroups(json6[72]);
    if (photos.length < limit) collectFromGroups(json6[51]);
    if (photos.length < limit && Array.isArray(json6[171])) {
      for (const tab of json6[171]) {
        if (tab?.[0] && Array.isArray(tab[0][3])) {
          for (const photoItem of tab[0][3]) {
            if (photoItem && Array.isArray(photoItem[6]) && typeof photoItem[6][0] === 'string') {
              addPlacePhoto(photoItem[6][0], photos, seenHashes, limit);
            }
          }
        }
      }
    }

    for (const k of [37, 105, 120]) {
      if (photos.length >= limit || !Array.isArray(json6[k])) continue;
      const searchSafe = (node: unknown): void => {
        if (photos.length >= limit || !node) return;
        if (typeof node === 'string') {
          if (/^https:\/\/lh[3-6]\.googleusercontent\.com\//.test(node)) {
            addPlacePhoto(node, photos, seenHashes, limit);
          }
        } else if (Array.isArray(node)) {
          node.forEach(searchSafe);
        }
      };
      searchSafe(json6[k]);
    }
  } catch {
    /* ignore */
  }
  return photos;
}
