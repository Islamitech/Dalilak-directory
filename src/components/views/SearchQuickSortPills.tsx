import React from 'react';
import { MapPin, Star, Clock, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { Pressable } from '../../shared/ui';

export interface SearchQuickSortPillsProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  verifiedOnly?: boolean;
  onToggleVerified?: () => void;
  onRequestLocation?: () => void;
  isLocatingUser?: boolean;
  onOpenEmergency?: () => void;
}

export const SearchQuickSortPills: React.FC<SearchQuickSortPillsProps> = ({
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  verifiedOnly = false,
  onToggleVerified,
  onRequestLocation,
  isLocatingUser = false,
  onOpenEmergency,
}) => {
  const isNearest = sortBy === 'nearest';
  const isTopRated = sortBy === 'rating';

  const handleNearestClick = () => {
    if (isNearest) {
      onSortChange('default');
    } else {
      if (onRequestLocation) onRequestLocation();
      onSortChange('nearest');
    }
  };

  const handleRatingClick = () => {
    onSortChange(isTopRated ? 'default' : 'rating');
  };

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto py-2.5 px-0.5 no-scrollbar select-none"
      role="region"
      aria-label="خيارات الفرز والفلترة السريعة"
    >
      {/* 1. الافتراضي / الترتيب المميز */}
      <Pressable
        onClick={() => onSortChange('default')}
        className={`dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
          sortBy === 'default' && !openNowOnly && !verifiedOnly
            ? 'dl-sort-pill-active shadow-sm'
            : 'dl-sort-pill-inactive opacity-85 hover:opacity-100'
        }`}
        aria-pressed={sortBy === 'default'}
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        <span>المميز</span>
      </Pressable>

      {/* 2. الأقرب لي */}
      <Pressable
        onClick={handleNearestClick}
        disabled={isLocatingUser}
        className={`dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
          isNearest
            ? 'dl-sort-pill-active shadow-sm'
            : 'dl-sort-pill-inactive opacity-85 hover:opacity-100'
        }`}
        aria-pressed={isNearest}
      >
        <MapPin className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-bounce' : ''}`} aria-hidden="true" />
        <span>{isLocatingUser ? 'جارٍ التحديد...' : 'الأقرب إليك'}</span>
      </Pressable>

      {/* 3. الأعلى تقييماً */}
      <Pressable
        onClick={handleRatingClick}
        className={`dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
          isTopRated
            ? 'dl-sort-pill-active shadow-sm'
            : 'dl-sort-pill-inactive opacity-85 hover:opacity-100'
        }`}
        aria-pressed={isTopRated}
      >
        <Star className="w-3.5 h-3.5" aria-hidden="true" />
        <span>الأعلى تقييماً</span>
      </Pressable>

      {/* 4. مفتوح الآن */}
      <Pressable
        onClick={onToggleOpenNow}
        className={`dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
          openNowOnly
            ? 'dl-sort-pill-active shadow-sm'
            : 'dl-sort-pill-inactive opacity-85 hover:opacity-100'
        }`}
        aria-pressed={openNowOnly}
      >
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        <span>مفتوح الآن</span>
        {openNowOnly && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        )}
      </Pressable>

      {/* 5. موثق فقط */}
      {onToggleVerified && (
        <Pressable
          onClick={onToggleVerified}
          className={`dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            verifiedOnly
              ? 'dl-sort-pill-active shadow-sm'
              : 'dl-sort-pill-inactive opacity-85 hover:opacity-100'
          }`}
          aria-pressed={verifiedOnly}
        >
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>موثق بالدليل</span>
        </Pressable>
      )}

      {/* 6. خطوط الطوارئ والإنقاذ */}
      {onOpenEmergency && (
        <Pressable
          onClick={onOpenEmergency}
          className="dl-sort-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25"
          aria-label="فتح أرقام وخدمات طوارئ حدائق الأهرام"
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>طوارئ 24س</span>
        </Pressable>
      )}
    </div>
  );
};
