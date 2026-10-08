import React from 'react';
import { formatCount, formatRating, getWordRating } from '../../../../shared/lib/format';

export interface BusinessCardRatingRowProps {
  rating?: number | null;
  reviewsCount?: number | null;
}

export { getWordRating };

/**
 * Single-line, non-interactive rating summary:
 * ★★★★★ 4.8 · ممتاز · 17 تقييم Google
 */
export const BusinessCardRatingRow: React.FC<BusinessCardRatingRowProps> = ({
  rating,
  reviewsCount,
}) => {
  if (!rating || rating <= 0) return null;

  const pct = Math.min(100, Math.max(0, Math.round((rating / 5) * 100)));
  const word = getWordRating(rating);
  const formattedCount = reviewsCount ? formatCount(reviewsCount) : null;
  const ratingText = formatRating(rating) ?? '';

  return (
    <div
      className="dl-rrow"
      aria-label={
        formattedCount
          ? `تقييم ${ratingText} من 5، ${word}، بناءً على ${formattedCount} تقييم من Google`
          : `تقييم ${ratingText} من 5، ${word}`
      }
    >
      <span
        className="dl-stars"
        style={{ '--p': `${pct}%` } as React.CSSProperties}
        aria-hidden="true"
      >
        ★★★★★
      </span>
      <span className="dl-rn" dir="ltr" aria-hidden="true">{ratingText}</span>
      <span className="dl-rsep" aria-hidden="true">·</span>
      <span className="dl-rw" aria-hidden="true">{word}</span>
      {formattedCount && (
        <>
          <span className="dl-rsep" aria-hidden="true">·</span>
          <span className="dl-rc" aria-hidden="true">
            <bdi dir="ltr">{formattedCount}</bdi> تقييم Google
          </span>
        </>
      )}
    </div>
  );
};
