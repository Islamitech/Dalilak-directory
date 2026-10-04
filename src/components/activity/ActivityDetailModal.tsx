import React, { useState } from 'react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  downloadBusinessVCard,
} from '../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { Modal, IconButton } from '../../shared/ui';
import { X, ShieldCheck, Share2, Heart, CheckCheck, AlertCircle, Lock } from 'lucide-react';
import { ShowcasePhotoLightbox } from './PhotoLightbox';
import { useActivityPhotos } from './hooks/useActivityPhotos';
import { UnifiedBusinessCard } from '../../features/business-details';
import { ActivityDetailFooter, ActivityDetailStickyBar } from './ActivityDetailFooter';

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
        <div className="text-center space-y-4">
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
        maxWidth="2xl"
        hideDefaultHeader
        aria-label={business.nameAr}
        className="!bg-[var(--bg-card)] !border-[var(--border-color)] !rounded-2xl sm:!rounded-3xl !max-h-[calc(100dvh-0.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:!max-h-[92dvh] overflow-hidden"
        overlayClassName="!bg-slate-900/60 !backdrop-blur-xs pt-[max(0.375rem,env(safe-area-inset-top))] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
        contentClassName="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden text-start">
          {/* Modal Top Bar */}
          <div className="p-3.5 sm:p-4 border-b border-[var(--border-color)] flex items-center justify-between gap-3 bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>معتمد</span>
              </span>
              <h3 id="activity-detail-modal-title" className="font-black text-sm sm:text-base text-[var(--text-primary)] truncate">
                {business.nameAr}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="مشاركة رابط النشاط"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : copyError ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'تم النسخ!' : copyError ? 'تعذر النسخ' : 'مشاركة'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(business.id)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                  isFavorite
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-rose-600'
                }`}
                title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-600' : ''}`} />
              </button>

              <IconButton
                aria-label="إغلاق"
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="!w-8 !h-8 !rounded-xl !bg-slate-100 hover:!bg-slate-200 !text-slate-600"
                icon={<X className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overscroll-contain flex-1 min-h-0 text-xs">
            <UnifiedBusinessCard
              variant="detail"
              business={business}
              photos={photos}
              onPreviewPhoto={(idx) => setPreviewPhotoIndex(idx)}
              onOpenVideoModal={onOpenVideoModal}
              onShowOnMap={onShowOnMap}
              onOpenBusiness={onSelectBusiness || (() => {})}
            />

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

          <ActivityDetailStickyBar
            business={business}
            effectiveUrl={effectiveUrl}
            onShowOnMap={onShowOnMap}
            onSaveContact={handleSaveContact}
            vCardSaved={vCardSaved}
          />
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
