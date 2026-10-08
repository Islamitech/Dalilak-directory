import { useDirectoryLoad } from '../../contexts/DirectoryLoadContext';
import React from 'react';
import { Business } from '../../types';
import { BusinessCard } from '../../features/business-details';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { EmptyState, Button, LoadingSkeleton, ErrorState, PageFrame } from '../../shared/ui';

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
    <PageFrame
      title="المفضلة"
      subtitle="الأنشطة التي حفظتها للرجوع إليها من نفس بطاقات الدليل."
      icon={<Heart className="h-6 w-6 fill-rose-500 text-rose-500" />}
      action={
        <Button variant="ghost" size="sm" onClick={() => onNavigate('/search')} icon={<ArrowLeft className="h-4 w-4" />}>
          استكشف المزيد
        </Button>
      }
    >

      {favoriteBusinesses.length === 0 && directoryLoad.pending ? (
        <LoadingSkeleton variant="grid" count={3} />
      ) : favoriteBusinesses.length === 0 && directoryLoad.error ? (
        <ErrorState
          title="تعذر تحميل الأنشطة المحفوظة"
          description="قائمتك ما زالت محفوظة على جهازك. تعذر الاتصال بالخادم لتحديث البيانات."
          onRetry={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
        />
      ) : favoriteBusinesses.length === 0 ? (
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
    </PageFrame>
  );
};
