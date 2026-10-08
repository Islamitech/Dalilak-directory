import { Business } from '../../../types';

export function formatDisplayRating(biz: Business): { ratingText: string | null; reviewCountText: string | null } {
  const rawRating =
    biz.googleRating !== undefined && biz.googleRating !== null ? biz.googleRating : biz.rating;

  if (typeof rawRating !== 'number' || isNaN(rawRating) || rawRating <= 0 || rawRating > 5) {
    return { ratingText: null, reviewCountText: null };
  }
  if (biz.googleRatingEnabled === false && biz.googleRating !== undefined) {
    return { ratingText: null, reviewCountText: null };
  }

  const ratingText = `★ ${rawRating.toFixed(1)}`;
  const count =
    typeof biz.googleReviewsCount === 'number' && !isNaN(biz.googleReviewsCount) && biz.googleReviewsCount > 0
      ? `(${biz.googleReviewsCount})`
      : null;
  return { ratingText, reviewCountText: count };
}

export function sanitizeSafeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return null;
  if (/["'<>\s]/.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return null;
}

export function sanitizePhoneNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 7 || cleaned.length > 15) return null;
  return cleaned;
}
