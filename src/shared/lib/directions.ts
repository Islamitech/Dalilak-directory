/**
 * 🗺️ Google Maps Directions & Geo Navigation Utilities
 */

export interface DirectionsParams {
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  destinationAddress?: string | null;
}

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  // Guard against Null Island (0, 0)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  // Valid latitude/longitude bounds
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Builds an official Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(params: DirectionsParams): string {
  const { lat, lng, destinationAddress, query } = params;

  if (isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const textTarget = destinationAddress || query;
  if (textTarget && textTarget.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(textTarget.trim())}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Builds a Google Maps search/pin preview URL
 */
export function getGoogleMapsSearchUrl(params: DirectionsParams): string {
  const { lat, lng, query, destinationAddress } = params;

  if (isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const textTarget = destinationAddress || query;
  if (textTarget && textTarget.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textTarget.trim())}`;
  }

  return 'https://www.google.com/maps';
}
