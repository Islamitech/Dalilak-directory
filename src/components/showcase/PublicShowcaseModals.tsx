import React from 'react';
import { Business } from '../../types';

const ActivityDetailModal = React.lazy(() =>
  import('../activity/ActivityDetailModal').then((m) => ({ default: m.ActivityDetailModal }))
);
const VideoPlayerModal = React.lazy(() =>
  import('../VideoPlayerModal').then((m) => ({ default: m.VideoPlayerModal }))
);

import { Modal, LoadingSkeleton, ErrorState, EmptyState, Toast } from '../../shared/ui';

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
  toastAction?: { label: string; onAction: () => void } | null;
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
  toastAction = null,
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

      <Toast message={toastMessage} action={toastAction} />
    </>
  );
};
