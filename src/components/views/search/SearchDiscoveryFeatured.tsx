import React from 'react';
import { Business } from '../../../types';
import { BusinessCard } from '../../cards/BusinessCard';
import { Sparkles, Store, ArrowLeft } from 'lucide-react';
import { Button } from '../../../shared/ui';

export interface SearchDiscoveryFeaturedProps {
  featuredBusinesses: Business[];
  allBusinessesCount: number;
  onShowAll: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
  onNavigate: (path: string) => void;
}

export const SearchDiscoveryFeatured: React.FC<SearchDiscoveryFeaturedProps> = ({
  featuredBusinesses,
  allBusinessesCount,
  onShowAll,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onOpenVideoModal,
  onNavigate,
}) => {
  return (
    <div className="space-y-7 sm:space-y-10">
      {/* ⭐ قسم الأنشطة المميزة والموثقة («وجهتك التالية تبدأ من هنا») */}
      <section className="space-y-3 pt-2">
        <div className="flex items-baseline justify-between px-0.5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>اختيارات من الدليل</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              وجهتك التالية تبدأ من هنا
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              تعرّف على المكان، واحفظ ما يعجبك
            </p>
          </div>
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>عرض الجميع ({allBusinessesCount})</span>
            <span>←</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredBusinesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(biz.id)}
              userCoords={userCoords}
              onOpenVideoModal={onOpenVideoModal}
            />
          ))}
        </div>
      </section>

      {/* 💼 بانر أصحاب الأعمال («مكانك موجود. خلّي الناس توصله.») */}
      <section className="bg-white border border-amber-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xs">
        <div className="space-y-1 text-center md:text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700">
            <Store className="w-4 h-4" />
            <span>أصحاب المحلات والأنشطة</span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-slate-900">
            مكانك موجود. خلّي الناس توصله.
          </h2>
          <p className="text-xs text-slate-600 font-medium max-w-lg">
            أضف نشاطك وعرّف عملاء منطقتك بخدماتك على مدار الساعة لتصل إلى عملائك المستهدفين.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('/for-business')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          أضف نشاطك الآن
        </Button>
      </section>
    </div>
  );
};
