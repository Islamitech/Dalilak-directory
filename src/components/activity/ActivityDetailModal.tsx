import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { Business } from '../../types';
import { getBusinessMapDetails, downloadBusinessVCard, getSmartWhatsAppUrl, getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { Modal, Button, EntitySheet, type EntitySheetSnap } from '../../shared/ui';
import { getBusinessEntryGate, formatBusinessAreaLabel } from '../../utils/hadayekZoneHelper';
import { requestBusinessNavigation } from '../../shared/lib/pendingNavigation';
import { ShowcasePhotoLightbox } from './PhotoLightbox';
import { useActivityPhotos } from './hooks/useActivityPhotos';
import { ActivityDetailHeader } from './ActivityDetailHeader';
import { ActivityDetailQuickActions } from './ActivityDetailActions';
import { ActivityDetailInfo } from './ActivityDetailInfo';
import { ActivityDetailFooter } from './ActivityDetailFooter';
import { ActivityDetailPeek } from './ActivityDetailPeek';
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
  initialSnap?: EntitySheetSnap;
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
  initialSnap,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [vCardSaved, setVCardSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const photos = useActivityPhotos(business);
  const isMapContext = () => {
    const bg = typeof window !== 'undefined' ? (window.history.state?.directoryBackground || '').split('?')[0] : '';
    return typeof window !== 'undefined' && (window.location.pathname.startsWith('/map') || window.location.pathname === '/' || bg === '/' || bg.startsWith('/map'));
  };

  const [snap, setSnap] = useState<EntitySheetSnap>(() => {
    if (initialSnap) return initialSnap;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    return isDesktop || !isMapContext() ? 'full' : 'peek';
  });
  const entryGate = business ? getBusinessEntryGate(business) : null;

  useEffect(() => {
    if (!business || business.verificationStatus === 'rejected') return;
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    const targetSnap = initialSnap ?? (isDesktop || !isMapContext() ? 'full' : 'peek');
    setSnap(targetSnap);
    window.dispatchEvent(new Event('directory:subscribe'));
    window.dispatchEvent(new CustomEvent('map:activity-sheet', { detail: { open: true, snap: targetSnap } }));
    return () => { window.dispatchEvent(new CustomEvent('map:activity-sheet', { detail: { open: false } })); };
  }, [business, initialSnap]);

  if (!business) return null;

  if (business.verificationStatus === 'rejected') {
    return (
      <Modal isOpen onClose={onClose} maxWidth="sm" hideDefaultHeader aria-label="نشاط غير متاح">
        <div className="text-center space-y-4 p-5">
          <div className="w-14 h-14 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center mx-auto"><Lock className="w-7 h-7" /></div>
          <h3 className="font-extrabold text-base text-slate-900">هذا النشاط غير متاح حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">تم تعليق صفحة هذا النشاط بناءً على المراجعة الإدارية لمنظومة «دليلك».</p>
          <Button variant="primary" fullWidth onClick={onClose}>العودة للدليل</Button>
        </div>
      </Modal>
    );
  }

  const { effectiveUrl } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(getPublicDirectoryUrl(business));
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    }
  };

  const handleSaveContact = () => {
    downloadBusinessVCard(business);
    setVCardSaved(true);
    setTimeout(() => setVCardSaved(false), 3000);
  };

  const groupId = classifyBusinessCategory(business).mainCategoryId;
  const similarPlaces = allBusinesses.filter((b) => b.id !== business.id && groupId !== 'other' && matchesCategoryFilter(b, groupId)).slice(0, 3);
  const placement = 'page' as const;
  const openFromGate = () => {
    if (!entryGate || !onShowOnMap) return;
    requestBusinessNavigation(business.id, entryGate.id);
    onShowOnMap(business);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top > 40 && !isScrolled) setIsScrolled(true);
    else if (top <= 15 && isScrolled) setIsScrolled(false);
  };

  const isVerified = business.verificationStatus === 'verified' || Boolean(business.packageId?.includes('verified'));
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const areaLabel = formatBusinessAreaLabel(business) || business.street || business.city || '';

  return (
    <>
      <EntitySheet
        snap={snap}
        onSnapChange={setSnap}
        onClose={onClose}
        placement={placement}
        showClose={snap === 'peek'}
        ariaLabel={business.nameAr || 'تفاصيل النشاط'}
        ariaLabelledBy="activity-detail-modal-title"
        peek={
          <ActivityDetailPeek
            business={business}
            photos={photos}
            onExpand={() => setSnap('half')}
            onDirections={onShowOnMap ? () => { requestBusinessNavigation(business.id, entryGate?.id); onShowOnMap(business); } : undefined}
            isVerified={isVerified}
            areaLabel={areaLabel}
            openStatus={openStatus}
            smartWhatsAppUrl={smartWhatsAppUrl}
          />
        }
      >
        <div className="dl-dwrap text-start min-h-full" data-scrolled={isScrolled ? 'true' : 'false'}>
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
          <div className="dl-dscroll" onScroll={handleScroll}>
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
          <div className="dl-dbar">
            <ActivityDetailQuickActions
              business={business}
              effectiveUrl={effectiveUrl}
              smartWhatsAppUrl={smartWhatsAppUrl}
              onShowOnMap={onShowOnMap}
              onDirections={() => {
                if (onShowOnMap) { requestBusinessNavigation(business.id, entryGate?.id); onShowOnMap(business); }
                else if (effectiveUrl) window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
              }}
            />
          </div>
        </div>
      </EntitySheet>
      <ShowcasePhotoLightbox
        photos={photos}
        previewPhotoIndex={previewPhotoIndex}
        setPreviewPhotoIndex={setPreviewPhotoIndex}
        handlePrevPhoto={() => setPreviewPhotoIndex((p) => p !== null && photos.length ? (p - 1 + photos.length) % photos.length : 0)}
        handleNextPhoto={() => setPreviewPhotoIndex((p) => p !== null && photos.length ? (p + 1) % photos.length : 0)}
      />
    </>
  );
};
