import { useDirectoryLoad } from '../../contexts/DirectoryLoadContext';
import React from 'react';
import { Business } from '../../types';
import { BusinessCard } from '../../features/business-details';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { EmptyState, Button } from '../../shared/ui';

export interface FavoritesViewProps {
  businesses: Business[];
  favorites: string[];
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  businesses,
  favorites,
  onOpenBusiness,
  onToggleFavorite,
  userCoords,
  onNavigate,
  onOpenVideoModal,
}) => {
  const directoryLoad = useDirectoryLoad();
  const favoriteBusinesses = businesses.filter((b) => favorites.includes(b.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>الأنشطة المحفوظة (المفضلة)</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            الأماكن والخدمات التي قمت بحفظها لسرعة الرجوع إليها
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/search')}
          className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
        >
          <span>استكشف المزيد</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {favoriteBusinesses.length === 0 && (directoryLoad.pending || directoryLoad.error) ? <p role="status">{directoryLoad.pending?'جارٍ تحميل الأنشطة المحفوظة…':'تعذر تحميل الأنشطة المحفوظة؛ قائمتك ما زالت محفوظة على الجهاز.'}</p> : favoriteBusinesses.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8 text-rose-500 fill-rose-500" />}
          title="قائمة المفضلة فارغة حالياً"
          description="انقر على علامة القلب في أي بطاقة نشاط لحفظها هنا والوصول إليها لاحقاً بضغطة زر."
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('/search')}
            icon={<Search className="w-4 h-4" />}
          >
            تصفح الأنشطة الآن
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteBusinesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              isFavorite={true}
              userCoords={userCoords}
              onOpenVideoModal={onOpenVideoModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
