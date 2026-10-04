import React from 'react';
import { Business } from '../../types';
import { Drawer } from '../../shared/ui';
import { UnifiedBusinessCard } from '../../features/business-details';

export interface MapSelectedBusinessDrawerProps {
  selectedBiz: Business | null;
  setSelectedBiz: (biz: Business | null) => void;
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
}

export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  selectedBiz,
  setSelectedBiz,
  onSelectBusiness,
  onStartNavigation,
}) => {
  if (!selectedBiz) return null;

  return (
    <Drawer
      isOpen={!!selectedBiz}
      onClose={() => setSelectedBiz(null)}
      position="bottom"
      hideDefaultHeader
      aria-label={`إجراءات ${selectedBiz.nameAr}`}
      className="!border-2 !border-slate-200/90 !rounded-t-2xl sm:!rounded-3xl sm:bottom-4 sm:inset-x-4 max-w-2xl mx-auto shadow-2xl !max-h-[80vh]"
      contentClassName="p-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-3 flex flex-col gap-2 font-['Cairo',sans-serif]"
    >
      <UnifiedBusinessCard
        business={selectedBiz}
        variant="map-popup"
        onOpenBusiness={(biz) => {
          setSelectedBiz(null);
          if (onSelectBusiness) onSelectBusiness(biz);
        }}
        onStartNavigation={onStartNavigation}
        onClose={() => setSelectedBiz(null)}
      />
    </Drawer>
  );
};
