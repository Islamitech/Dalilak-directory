import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Business } from '../../../types';
import { getBusinessMapDetails, getSmartWhatsAppUrl } from '../../../utils/directoryEnhancements';
import { ActivityDetailHeader } from '../../../components/activity/ActivityDetailHeader';
import { ActivityDetailQuickActions } from '../../../components/activity/ActivityDetailActions';
import { ActivityDetailInfo } from '../../../components/activity/ActivityDetailInfo';
import { useActivityPhotos } from '../../../components/activity/hooks/useActivityPhotos';
import type { BusinessCardVariantProps } from './BusinessCardGridVariant';

export const BusinessCardDetailVariant: React.FC<BusinessCardVariantProps> = ({
  business,
  onOpenVideoModal,
  onShowOnMap,
  photos: propPhotos,
  onPreviewPhoto,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const fetchedPhotos = useActivityPhotos(business);
  const photos = propPhotos || fetchedPhotos;
  const { effectiveUrl } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);
  const isVerified = business.verificationStatus === 'verified' || business.packageId?.includes('verified');

  return (
    <div className="dl-dwrap text-start">
      <ActivityDetailHeader
        business={business}
        photos={photos}
        onPreviewPhoto={onPreviewPhoto || (() => {})}
        onOpenVideoModal={onOpenVideoModal}
        onClose={onClose}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="dl-dscroll">
        <div className="dl-dnm">
          <h2 id="activity-detail-modal-title">
            <bdi dir="auto">{business.nameAr}</bdi>
            {isVerified && (
              <ShieldCheck className="w-[18px] h-[18px] text-emerald-500 shrink-0" aria-label="موثق" />
            )}
          </h2>
          <span className="dl-c">
            {[business.category, business.city || business.governorate || 'حدائق الأهرام'].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div className="dl-db">
          <ActivityDetailQuickActions
            business={business}
            effectiveUrl={effectiveUrl}
            smartWhatsAppUrl={smartWhatsAppUrl}
            onShowOnMap={onShowOnMap}
          />

          <ActivityDetailInfo
            business={business}
            effectiveUrl={effectiveUrl}
            onShowOnMap={onShowOnMap}
          />
        </div>
      </div>
    </div>
  );
};
