import React from 'react';
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

  return (
    <div className="sheet-modal-content text-start font-['Cairo',sans-serif]">
      <ActivityDetailHeader
        business={business}
        photos={photos}
        onPreviewPhoto={onPreviewPhoto || (() => {})}
        onOpenVideoModal={onOpenVideoModal}
        onClose={onClose}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="sheet-body p-4 sm:p-5 space-y-4">
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
  );
};
