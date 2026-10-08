import React from 'react';
import { Business } from '../../../types';
import { BusinessCardGridVariant, BusinessCardVariantProps } from './BusinessCardGridVariant';
import { BusinessCardCompactVariant } from './BusinessCardCompactVariant';
import { BusinessCardDetailVariant } from './BusinessCardDetailVariant';

export interface UnifiedBusinessCardProps extends BusinessCardVariantProps {
  variant?: 'grid' | 'compact' | 'detail';
}

export const UnifiedBusinessCard: React.FC<UnifiedBusinessCardProps> = ({
  variant = 'grid',
  ...props
}) => {
  switch (variant) {
    case 'compact':
      return <BusinessCardCompactVariant {...props} />;
    case 'detail':
      return <BusinessCardDetailVariant {...props} />;
    case 'grid':
    default:
      return <BusinessCardGridVariant {...props} />;
  }
};
