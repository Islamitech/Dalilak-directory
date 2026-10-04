import React from 'react';
import { UnifiedBusinessCard, UnifiedBusinessCardProps } from '../../features/business-details/components/UnifiedBusinessCard';

export type BusinessCardProps = UnifiedBusinessCardProps;

export const BusinessCard: React.FC<BusinessCardProps> = (props) => {
  return <UnifiedBusinessCard {...props} />;
};

export default BusinessCard;
