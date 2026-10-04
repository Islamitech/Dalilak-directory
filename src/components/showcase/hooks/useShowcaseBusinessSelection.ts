import { useState, useEffect, useRef } from 'react';
import { Business } from '../../../types';
import { getDirectoryPath } from '../../../utils/directoryUrl';

interface UseShowcaseBusinessSelectionParams {
  selectedBiz: Business | null;
  initialBizId?: string;
  filterState: {
    handleCategoryChange: (cat: string) => void;
    setHadayekZoneFilter: (zone: string) => void;
  };
  routing: {
    open: (path: string) => void;
    close: () => void;
  };
  handleNavigate: (path: string) => void;
}

export function useShowcaseBusinessSelection({
  selectedBiz,
  initialBizId,
  filterState,
  routing,
  handleNavigate,
}: UseShowcaseBusinessSelectionParams) {
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const [pinnedDirectBizId, setPinnedDirectBizId] = useState<string | null>(null);
  const [focusedMapBiz, setFocusedMapBiz] = useState<Business | null>(null);
  const isDirectLinkOpenRef = useRef(Boolean(initialBizId));

  useEffect(() => {
    if (isDirectLinkOpenRef.current && selectedBiz) {
      isDirectLinkOpenRef.current = false;
      setPinnedDirectBizId(selectedBiz.id);
      filterState.handleCategoryChange(selectedBiz.category);
    }
  }, [selectedBiz, filterState]);

  const handleShowBusinessOnMap = (biz: Business) => {
    filterState.setHadayekZoneFilter('all');
    setFocusedMapBiz(biz);
    handleNavigate('/map');
  };

  const handleOpenBusiness = (biz: Business) => {
    isDirectLinkOpenRef.current = false;
    routing.open(getDirectoryPath(biz));
  };

  const handleCloseBusiness = routing.close;

  return {
    selectedVideoBiz,
    setSelectedVideoBiz,
    pinnedDirectBizId,
    focusedMapBiz,
    setFocusedMapBiz,
    handleShowBusinessOnMap,
    handleOpenBusiness,
    handleCloseBusiness,
  };
}
