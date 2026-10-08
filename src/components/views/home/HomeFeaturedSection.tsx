import React from 'react';
import { ArrowLeft, Store } from 'lucide-react';
import { Business } from '../../../types';
import { BusinessCard } from '../../../features/business-details';
import { LoadingSkeleton, EmptyState } from '../../../shared/ui';

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
          className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>عرض كل الأنشطة ({businesses.length})</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Cards Grid */}
      {loading && featuredBusinesses.length === 0 ? (
        <LoadingSkeleton variant="grid" count={6} />
      ) : featuredBusinesses.length === 0 ? (
        <EmptyState
          icon={<Store className="w-8 h-8 text-amber-600" />}
          title="لا توجد أنشطة موثقة معروضة حالياً"
          description="يمكنك تصفح كامل الدليل الجغرافي أو إضافة نشاطك الميداني."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBusinesses.map((biz, index) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(biz.id)}
              userCoords={userCoords}
              onOpenVideoModal={onOpenVideoModal}
              priority={index < 2}
            />
          ))}
        </div>
      )}
    </section>
  );
};
