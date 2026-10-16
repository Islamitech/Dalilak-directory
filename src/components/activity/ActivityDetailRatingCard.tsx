import React from 'react';
import { Star, ExternalLink } from 'lucide-react';

export interface ActivityDetailRatingCardProps {
  ratingText: string;
  reviewCount: string | null;
  mapsUrl: string | null;
  wordRating: string;
}

export const ActivityDetailRatingCard: React.FC<ActivityDetailRatingCardProps> = ({
  ratingText,
  reviewCount,
  mapsUrl,
  wordRating,
}) => {
  return (
    <div className="dl-detail-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center shrink-0">
            <span className="text-base font-extrabold text-amber-800 leading-none" dir="ltr">
              {ratingText}
            </span>
            <div className="flex items-center text-amber-500 mt-1">
              <Star className="w-3 h-3 fill-amber-500" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
              <span>تقييم Google</span>
              <span className="text-caption font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                {wordRating}
              </span>
            </div>
            <p className="text-caption text-slate-500 font-medium truncate mt-0.5">
              {reviewCount ? `بناءً على ${reviewCount} مراجعة معتمدة` : 'مراجعات وتقييمات موثقة'}
            </p>
          </div>
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-caption font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-2.5 py-1.5 rounded-lg transition-colors"
            aria-label="عرض التقييمات على خرائط Google"
          >
            <span>الآراء</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
