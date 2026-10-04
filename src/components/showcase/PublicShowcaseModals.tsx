import React from 'react';
import { Business } from '../../types';

const ActivityDetailModal = React.lazy(() =>
  import('../activity/ActivityDetailModal').then((m) => ({ default: m.ActivityDetailModal }))
);
const VideoPlayerModal = React.lazy(() =>
  import('../VideoPlayerModal').then((m) => ({ default: m.VideoPlayerModal }))
);

import { Modal, LoadingSkeleton, ErrorState, EmptyState } from '../../shared/ui';

export interface PublicShowcaseModalsProps {
  selectedBiz: Business | null;
  routingToken?: string | null;
  directoryLoad: { pending: boolean; error: unknown };
  handleCloseBusiness: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setSelectedVideoBiz: (biz: Business | null) => void;
  publicBusinesses: Business[];
  handleOpenBusiness: (biz: Business) => void;
  handleShowBusinessOnMap: (biz: Business) => void;
  handleNavigate: (path: string) => void;
  selectedVideoBiz: Business | null;
  toastMessage: string | null;
}

export const PublicShowcaseModals: React.FC<PublicShowcaseModalsProps> = ({
  selectedBiz,
  routingToken,
  directoryLoad,
  handleCloseBusiness,
  favorites,
  toggleFavorite,
  setSelectedVideoBiz,
  publicBusinesses,
  handleOpenBusiness,
  handleShowBusinessOnMap,
  handleNavigate,
  selectedVideoBiz,
  toastMessage,
}) => {
  return (
    <>
      {routingToken && !selectedBiz && (
        <Modal
          isOpen={true}
          onClose={handleCloseBusiness}
          title={
            directoryLoad.pending
              ? 'جارٍ تحميل النشاط…'
              : directoryLoad.error
              ? 'تعذر تحميل النشاط'
              : 'النشاط غير متاح'
          }
          maxWidth="md"
        >
          {directoryLoad.pending ? (
            <LoadingSkeleton variant="detail" />
          ) : directoryLoad.error ? (
            <ErrorState
              title="تعذر تحميل تفاصيل النشاط"
              description="حدث خطأ أثناء محاولة جلب تفاصيل هذا النشاط. تحقق من اتصالك بالإنترنت."
              onRetry={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
            />
          ) : (
            <EmptyState
              title="النشاط غير متاح"
              description="قد يكون الرابط قديمًا أو النشاط غير منشور حالياً في الدليل."
              actionLabel="العودة للدليل"
              onAction={handleCloseBusiness}
            />
          )}
        </Modal>
      )}

      {selectedBiz && (
        <React.Suspense fallback={null}>
          <ActivityDetailModal
            key={selectedBiz.id}
            business={selectedBiz}
            onClose={handleCloseBusiness}
            isFavorite={favorites.includes(selectedBiz.id)}
            onToggleFavorite={toggleFavorite}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            allBusinesses={publicBusinesses}
            onSelectBusiness={handleOpenBusiness}
            onNavigateToBusinessClaim={() => {
              handleCloseBusiness();
              handleNavigate('/for-business');
            }}
            onShowOnMap={handleShowBusinessOnMap}
          />
        </React.Suspense>
      )}

      {selectedVideoBiz && (
        <React.Suspense fallback={null}>
          <VideoPlayerModal
            business={selectedVideoBiz}
            onClose={() => setSelectedVideoBiz(null)}
          />
        </React.Suspense>
      )}

      {toastMessage && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black shadow-2xl border border-amber-500/30 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
