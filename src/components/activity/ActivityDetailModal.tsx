import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  downloadBusinessVCard,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { Modal, Button, EntitySheet, type EntitySheetSnap } from '../../shared/ui';
import { UnifiedBusinessCard } from '../../features/business-details';
import { getBusinessEntryGate } from '../../utils/hadayekZoneHelper';
import { requestBusinessNavigation } from '../../shared/lib/pendingNavigation';
import { ShowcasePhotoLightbox } from './PhotoLightbox';
import { useActivityPhotos } from './hooks/useActivityPhotos';
import { ActivityDetailHeader } from './ActivityDetailHeader';
import { ActivityDetailQuickActions } from './ActivityDetailActions';
import { ActivityDetailInfo } from './ActivityDetailInfo';
import { ActivityDetailFooter } from './ActivityDetailFooter';
import { classifyBusinessCategory, matchesCategoryFilter } from '../../utils/categoryMatcher';

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

function activitySheetPlacement(): 'map' | 'page' {
  const background = String(window.history.state?.directoryBackground || '');
  const path = (background || window.location.pathname).split('?')[0];
  return path === '/' || path === '/map' ? 'map' : 'page';
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
  const [snap, setSnap] = useState<EntitySheetSnap>('full');
  const entryGate = business ? getBusinessEntryGate(business) : null;

  useEffect(() => {
    if (!business || business.verificationStatus === 'rejected') return;
    const onMap = activitySheetPlacement() === 'map';
    setSnap(onMap ? 'peek' : 'full');
    if (onMap) window.dispatchEvent(new CustomEvent('map:stash-camera'));
    window.dispatchEvent(new CustomEvent('map:activity-sheet', { detail: { open: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('map:activity-sheet', { detail: { open: false } }));
    };
  }, [business]);

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
          <div className="w-14 h-14 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">هذا النشاط غير متاح حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            تم تعليق صفحة هذا النشاط بناءً على المراجعة الإدارية لمنظومة «دليلك».
          </p>
          <Button variant="primary" fullWidth onClick={onClose}>
            العودة للدليل
          </Button>
        </div>
      </Modal>
    );
  }

  const { effectiveUrl } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);

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

  const groupId = classifyBusinessCategory(business).mainCategoryId;
  const similarPlaces = allBusinesses
    .filter((b) => b.id !== business.id && groupId !== 'other' && matchesCategoryFilter(b, groupId))
    .slice(0, 3);

  const mapHost = activitySheetPlacement() === 'map' ? document.querySelector('[data-map-host]') : null;
  const placement = mapHost ? 'map' : 'page';
  const openFromGate = () => {
    if (!entryGate || !onShowOnMap) return;
    requestBusinessNavigation(business.id, entryGate.id);
    onShowOnMap(business);
  };
  const sheet = (
    <EntitySheet
      snap={snap}
      onSnapChange={setSnap}
      onClose={onClose}
      placement={placement}
      ariaLabel={business.nameAr || 'تفاصيل النشاط'}
      peek={
        <div className="p-3">
          <UnifiedBusinessCard
            variant="compact"
            business={business}
            onOpenBusiness={() => setSnap('half')}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      }
    >
      <div className="dl-dwrap text-start min-h-full">
          <ActivityDetailHeader
            business={business}
            photos={photos}
            onPreviewPhoto={(idx) => setPreviewPhotoIndex(idx)}
            onOpenVideoModal={onOpenVideoModal}
            onClose={onClose}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onShare={handleShare}
            copied={copied}
            copyError={copyError}
          />

          <div className="dl-dscroll">
            <div className="dl-db">
              <ActivityDetailInfo
                business={business}
                effectiveUrl={effectiveUrl}
                onShowOnMap={onShowOnMap}
                onSaveContact={handleSaveContact}
                vCardSaved={vCardSaved}
                gateLabel={entryGate?.label}
                onEnterFromGate={entryGate && onShowOnMap ? openFromGate : undefined}
              />

              <ActivityDetailFooter
                business={business}
                similarPlaces={similarPlaces}
                onSelectBusiness={onSelectBusiness}
                effectiveUrl={effectiveUrl}
                onShowOnMap={onShowOnMap}
                onNavigateToBusinessClaim={onNavigateToBusinessClaim}
              />
            </div>
          </div>

          {/* Primary actions pinned at the bottom, always reachable */}
          <div className="dl-dbar">
            <ActivityDetailQuickActions
              business={business}
              effectiveUrl={effectiveUrl}
              smartWhatsAppUrl={smartWhatsAppUrl}
              onShowOnMap={onShowOnMap}
            />
          </div>
      </div>
    </EntitySheet>
  );
  return (
    <>
      {mapHost ? createPortal(sheet, mapHost) : sheet}

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
