import React, { useState } from 'react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  downloadBusinessVCard,
} from '../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { Modal } from '../../shared/ui';
import { Lock } from 'lucide-react';
import { ShowcasePhotoLightbox } from './PhotoLightbox';
import { useActivityPhotos } from './hooks/useActivityPhotos';
import { UnifiedBusinessCard } from '../../features/business-details';
import { ActivityDetailFooter } from './ActivityDetailFooter';

export interface ActivityDetailModalProps {
  business: Business | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
  allBusinesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onNavigateToBusinessClaim?: (biz: Business) => void;
  onShowOnMap?: (biz: Business) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  business,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenVideoModal,
  allBusinesses = [],
  onSelectBusiness,
  onNavigateToBusinessClaim,
  onShowOnMap,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [vCardSaved, setVCardSaved] = useState(false);

  const photos = useActivityPhotos(business);

  if (!business) return null;

  if (business.verificationStatus === 'rejected') {
    return (
      <Modal
        isOpen={!!business}
        onClose={onClose}
        maxWidth="sm"
        hideDefaultHeader
        aria-label="نشاط غير متاح"
      >
        <div className="text-center space-y-4 p-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">هذا النشاط غير متاح حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            تم تعليق صفحة هذا النشاط بناءً على المراجعة الإدارية لمنظومة «دليلك».
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
          >
            العودة للدليل
          </button>
        </div>
      </Modal>
    );
  }

  const { effectiveUrl } = getBusinessMapDetails(business);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getPublicDirectoryUrl(business);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setCopyError(false);
        setTimeout(() => setCopied(false), 3000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      setCopyError(true);
      setCopied(false);
      setTimeout(() => setCopyError(false), 4000);
    }
  };

  const handleSaveContact = () => {
    downloadBusinessVCard(business);
    setVCardSaved(true);
    setTimeout(() => setVCardSaved(false), 3000);
  };

  const similarPlaces = allBusinesses
    .filter((b) => b.id !== business.id && (b.category === business.category || b.city === business.city))
    .slice(0, 3);

  return (
    <>
      <Modal
        isOpen={!!business}
        onClose={onClose}
        maxWidth="lg"
        hideDefaultHeader
        aria-labelledby="activity-detail-modal-title"
        className="!sheet-modal !rounded-t-3xl !rounded-b-none sm:!rounded-3xl !max-w-[480px] !w-full !max-h-[92dvh] !bg-white !border-slate-200 overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0 shadow-2xl"
        overlayClassName="!items-end sm:!items-center lg:!justify-end !p-0 sm:!p-6 lg:!ps-0 lg:!pe-6 !bg-slate-900/60 lg:!bg-slate-900/35 !backdrop-blur-xs"
        contentClassName="p-0 flex flex-col flex-1 min-h-0"
      >
        <div className="flex flex-col h-full text-start">
          <UnifiedBusinessCard
            variant="detail"
            business={business}
            photos={photos}
            onPreviewPhoto={(idx) => setPreviewPhotoIndex(idx)}
            onOpenVideoModal={onOpenVideoModal}
            onShowOnMap={onShowOnMap}
            onOpenBusiness={onSelectBusiness || (() => {})}
            onClose={onClose}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />

          <div className="px-4 pb-5 sm:px-5 sm:pb-6 space-y-4">
            <ActivityDetailFooter
              business={business}
              similarPlaces={similarPlaces}
              onSelectBusiness={onSelectBusiness}
              effectiveUrl={effectiveUrl}
              onShowOnMap={onShowOnMap}
              onNavigateToBusinessClaim={onNavigateToBusinessClaim}
              onShare={handleShare}
              copied={copied}
              copyError={copyError}
              vCardSaved={vCardSaved}
              onSaveContact={handleSaveContact}
            />
          </div>
        </div>
      </Modal>

      <ShowcasePhotoLightbox
        photos={photos}
        previewPhotoIndex={previewPhotoIndex}
        setPreviewPhotoIndex={setPreviewPhotoIndex}
        handlePrevPhoto={() => {
          if (photos.length === 0) return;
          setPreviewPhotoIndex((prev) => (prev === null ? 0 : (prev - 1 + photos.length) % photos.length));
        }}
        handleNextPhoto={() => {
          if (photos.length === 0) return;
          setPreviewPhotoIndex((prev) => (prev === null ? 0 : (prev + 1) % photos.length));
        }}
      />
    </>
  );
};
