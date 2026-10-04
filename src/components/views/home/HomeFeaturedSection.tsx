import React from 'react';
import { ArrowLeft, Store } from 'lucide-react';
import { Business } from '../../../types';
import { BusinessCard } from '../../../features/business-details';

export interface HomeFeaturedSectionProps {
  businesses: Business[];
  loading: boolean;
  featuredBusinesses: Business[];
  onNavigate: (path: string) => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
}

export const HomeFeaturedSection: React.FC<HomeFeaturedSectionProps> = ({
  businesses,
  loading,
  featuredBusinesses,
  onNavigate,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onOpenVideoModal,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
              أنشطة مميزة وموثقة بالحدائق
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            أماكن تم التحقق من بياناتها ومواقعها بواسطة فريق دليلك الميداني
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/search')}
          className="text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>عرض كل الأنشطة ({businesses.length})</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && featuredBusinesses.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between animate-pulse"
            >
              <div className="aspect-[4/3] w-full bg-slate-800/60" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-800/60 rounded w-3/4" />
                <div className="h-3 bg-slate-800/40 rounded w-1/2" />
                <div className="h-8 bg-slate-800/60 rounded w-full mt-4" />
              </div>
            </div>
          ))
        ) : featuredBusinesses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--text-secondary)]">
            <Store className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-sm">لم يتم العثور على أنشطة مطابقة حالياً.</p>
          </div>
        ) : (
          featuredBusinesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(biz.id)}
              userCoords={userCoords}
              onOpenVideoModal={onOpenVideoModal}
            />
          ))
        )}
      </div>
    </section>
  );
};
