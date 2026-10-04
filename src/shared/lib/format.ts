/**
 * 📐 Pure Formatting Utilities
 */

/**
 * Formats a kilometer distance into localized Arabic text (e.g. "350 م" or "2.4 كم")
 */
export function formatDistanceString(distanceKm?: number | null): string {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * Formats rating strictly between 1.0 and 5.0. Returns null if unrated.
 * NEVER fabricates fake 4.9 or 5.0 for unrated businesses (Safety Net Contract A5.2).
 */
export function formatRating(rating?: number | null): string | null {
  if (typeof rating !== 'number' || !Number.isFinite(rating)) {
    return null;
  }
  if (rating < 1 || rating > 5) {
    return null;
  }
  return rating.toFixed(1);
}
