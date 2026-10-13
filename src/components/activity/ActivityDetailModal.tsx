import React, { useEffect, useState } from 'react';
import { Lock, Phone, ShieldCheck } from 'lucide-react';
import { Business } from '../../types';
import { getBusinessMapDetails, downloadBusinessVCard, getSmartWhatsAppUrl, getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { Modal, Button, ButtonLink, Pressable, EntitySheet, type EntitySheetSnap } from '../../shared/ui';
import { getBusinessEntryGate, formatBusinessAreaLabel } from '../../utils/hadayekZoneHelper';
import { requestBusinessNavigation } from '../../shared/lib/pendingNavigation';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';
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

  const fallbackCover = getCategoryFallbackCover(business.category);
  const rawCover = business.coverPhoto && !business.coverPhoto.includes('places.googleapis.com') ? business.coverPhoto : null;
  const peekPhotoSrc = getOptimizedImageUrl(photos[0] || rawCover || fallbackCover, 160, 160) || fallbackCover;
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
          <div className="ps-3 pe-14 py-2 flex items-center gap-2.5 h-[80px]">
            <Pressable
              type="button"
              onClick={() => setSnap('half')}
              className="flex-1 min-w-0 flex items-center gap-2.5 text-start cursor-pointer"
              aria-label={`عرض تفاصيل ${business.nameAr}`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80">
                <img
                  src={peekPhotoSrc}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackCover; }}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">{business.nameAr}</h4>
                  {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-caption font-medium text-slate-500 truncate mt-0.5">
                  <span className="font-bold text-amber-800">{business.category}</span>
                  {areaLabel ? <span className="text-slate-400"> • {areaLabel}</span> : null}
                </p>
                <div className="flex items-center gap-2 mt-1 text-caption font-bold text-slate-500">
                  {openStatus && (
                    <span className={`inline-flex items-center gap-1 shrink-0 ${openStatus.isOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
                      <i className={`w-1.5 h-1.5 rounded-pill ${openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>
                    </span>
                  )}
                </div>
              </div>
            </Pressable>
            {business.phone && business.phone.trim().length > 3 && (
              <ButtonLink
                href={`tel:${business.phone.trim().replace(/[^\d+]/g, '')}`}
                variant="secondary"
                size="sm"
                leadingIcon={<Phone className="w-4 h-4 text-emerald-600" />}
                aria-label="اتصال هاتفي مباشر"
                className="shrink-0 h-10 w-10 rounded-xl p-0 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 me-1"
              />
            )}
          </div>
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
