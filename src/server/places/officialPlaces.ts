import { stripBiDiControls } from './placeText';

const GOOGLE_PLACES_API_KEY = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

export interface PlacesApiPhotoResult {
  photos: string[];
  displayName?: string;
  formattedAddress?: string;
  googleCategory?: string;
  googleType?: string;
}

export async function fetchOfficialPlacesPhotos(
  query: string,
  lat?: number,
  lng?: number,
  limit = 1
): Promise<PlacesApiPhotoResult> {
  if (!GOOGLE_PLACES_API_KEY || !query) return { photos: [] };

  try {
    const searchBody: Record<string, unknown> = { textQuery: query, languageCode: 'ar' };
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      searchBody.locationBias = {
        circle: { center: { latitude: lat, longitude: lng }, radius: 1000.0 },
      };
    }

    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.formattedAddress,places.photos',
      },
      body: JSON.stringify(searchBody),
      signal: AbortSignal.timeout(6000),
    });
    if (!searchRes.ok) return { photos: [] };

    const searchData = await searchRes.json();
    if (!searchData.places?.length) return { photos: [] };

    const matchedPlace = searchData.places[0];
    const googleCategory = matchedPlace.primaryTypeDisplayName?.text;
    const googleType = matchedPlace.primaryType;
    const rawPhotos = matchedPlace.photos;
    const base = {
      displayName: stripBiDiControls(matchedPlace.displayName?.text),
      formattedAddress: stripBiDiControls(matchedPlace.formattedAddress),
      googleCategory,
      googleType,
    };
    if (!Array.isArray(rawPhotos) || rawPhotos.length === 0) {
      return { photos: [], ...base };
    }

    const resolvedUrls = (
      await Promise.all(
        rawPhotos.slice(0, limit).map(async (p: { name?: string }) => {
          if (!p.name) return null;
          try {
            const mediaUrl = `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
            const mediaRes = await fetch(mediaUrl, { signal: AbortSignal.timeout(4000) });
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              if (typeof mediaData?.photoUri === 'string') return mediaData.photoUri as string;
            }
          } catch {
            return null;
          }
          return null;
        })
      )
    ).filter((u): u is string => Boolean(u));

    return { photos: resolvedUrls, ...base };
  } catch {
    return { photos: [] };
  }
}
