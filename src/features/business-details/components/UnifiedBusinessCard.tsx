import React from 'react';
import { Business } from '../../../types';
import { BusinessCardGridVariant, BusinessCardVariantProps } from './BusinessCardGridVariant';
import { BusinessCardCompactVariant } from './BusinessCardCompactVariant';
import { BusinessCardMapPopupVariant } from './BusinessCardMapPopupVariant';
import { BusinessCardDetailVariant } from './BusinessCardDetailVariant';

export interface UnifiedBusinessCardProps extends BusinessCardVariantProps {
  variant?: 'grid' | 'compact' | 'map-popup' | 'map-drawer' | 'detail';
}

export const UnifiedBusinessCard: React.FC<UnifiedBusinessCardProps> = ({
  variant = 'grid',
  ...props
}) => {
  switch (variant) {
    case 'compact':
      return <BusinessCardCompactVariant {...props} />;
    case 'map-popup':
    case 'map-drawer':
      return <BusinessCardMapPopupVariant {...props} />;
    case 'detail':
      return <BusinessCardDetailVariant {...props} />;
    case 'grid':
    default:
      return <BusinessCardGridVariant {...props} />;
  }
};
