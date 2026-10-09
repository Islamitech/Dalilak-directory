import React, { useState } from 'react';
import { formatCount, formatRating, getWordRating } from '../../../../shared/lib/format';
import { Pressable } from '../../../../shared/ui';
import { ChevronDown } from 'lucide-react';

export interface BusinessCardRatingRowProps {
  rating?: number | null;
  reviewsCount?: number | null;
  businessName?: string;
}

export { getWordRating };

/**
 * Interactive, expandable rating summary accordion:
 * ★★★★★ 4.8 · ممتاز · 17 تقييم Google  [˅]
 * When expanded: reveals big score breakdown and review count.
 */
export const BusinessCardRatingRow: React.FC<BusinessCardRatingRowProps> = ({
  rating,
  reviewsCount,
  businessName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!rating || rating <= 0) return null;

  const pct = Math.min(100, Math.max(0, Math.round((rating / 5) * 100)));
  const word = getWordRating(rating);
  const formattedCount = reviewsCount ? formatCount(reviewsCount) : null;
  const ratingText = formatRating(rating) ?? '';

  return (
    <div className={`dl-rrow ${isExpanded ? 'dl-rrow-open' : ''}`}>
      <Pressable
        type="button"
        className="dl-rbtn"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        aria-expanded={isExpanded}
        aria-label={
          formattedCount
            ? `تقييم ${ratingText} من 5، ${word}، بناءً على ${formattedCount} تقييم من Google. اضغط لعرض التفاصيل.`
            : `تقييم ${ratingText} من 5، ${word}. اضغط لعرض التفاصيل.`
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
              <bdi dir="ltr">{formattedCount}</bdi> تقييم
            </span>
          </>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 ms-auto text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-amber-600' : ''
          }`}
          aria-hidden="true"
        />
      </Pressable>

      {isExpanded && (
        <div className="dl-rdet" onClick={(e) => e.stopPropagation()}>
          <div className="dl-rbig">
            <div className="dl-rbig-n" dir="ltr">
              {ratingText}
              <span className="text-caption text-slate-400 font-bold"> / 5</span>
            </div>
            <div className="dl-rbig-info">
              <span
                className="dl-stars"
                style={{ '--p': `${pct}%`, fontSize: '15px' } as React.CSSProperties}
                aria-hidden="true"
              >
                ★★★★★
              </span>
              <p className="text-caption text-slate-500 font-bold mt-0.5">
                {formattedCount
                  ? `بناءً على ${formattedCount} تقييم حقيقي من Google`
                  : 'تقييم معتمد من Google'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
