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
}) => {
  const fetchedPhotos = useActivityPhotos(business);
  const photos = propPhotos || fetchedPhotos;
  const { effectiveUrl } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);

  return (
    <div className="space-y-6 text-start font-['Cairo',sans-serif]">
      <ActivityDetailHeader
        business={business}
        photos={photos}
        onPreviewPhoto={onPreviewPhoto || (() => {})}
        onOpenVideoModal={onOpenVideoModal}
      />

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
  );
};
