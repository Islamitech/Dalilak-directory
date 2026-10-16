import React, { useCallback, useState, useEffect } from 'react';
import { UnifiedMapSearch } from './UnifiedMapSearch';
import { ViewSegmentedSwitch, DirectoryViewMode } from './ViewSegmentedSwitch';
import { UnifiedSearchFilterBar } from '../../features/search';
import { Business } from '../../types';

export interface FloatingBottomDockProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  businesses: Business[];
  confineToHadayek?: boolean;
  onSelectBusiness?: (business: Business) => void;
}

/**
 * 🏝️ FloatingBottomDock
 *
 * Unified Floating Bottom Dock (Thumb-zone clearance):
 * - Tier 1: UnifiedSearchFilterBar (Category & Zone selectors)
 * - Tier 2: Search capsule (UnifiedMapSearch + ViewSegmentedSwitch)
 */
export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  currentPath,
  onNavigate,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  businesses,
  confineToHadayek = true,
  onSelectBusiness,
}) => {
  const isListView = currentPath === '/search';
  const activeView: DirectoryViewMode = isListView ? 'list' : 'map';
  const [sheetOpen, setSheetOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-entity-sheet][data-placement="page"]'))
  );
  const [navOpen, setNavOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('.dl-navpill'))
  );
  const [buildingOpen, setBuildingOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-entity-sheet][data-placement="map"]'))
  );
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(Boolean(document.querySelector('[data-entity-sheet][data-placement="page"]')));
    setNavOpen(Boolean(document.querySelector('.dl-navpill')));
    setBuildingOpen(Boolean(document.querySelector('[data-entity-sheet][data-placement="map"]')));

    const handleSheet = (e: Event) => setSheetOpen(Boolean((e as CustomEvent).detail?.open));
    const handleNav = (e: Event) => setNavOpen(Boolean((e as CustomEvent).detail?.active));
    const handleBuilding = (e: Event) => setBuildingOpen(Boolean((e as CustomEvent).detail?.active));

    window.addEventListener('map:activity-sheet', handleSheet);
    window.addEventListener('map:navigation-active', handleNav);
    window.addEventListener('map:building-active', handleBuilding);
    return () => {
      window.removeEventListener('map:activity-sheet', handleSheet);
      window.removeEventListener('map:navigation-active', handleNav);
      window.removeEventListener('map:building-active', handleBuilding);
    };
  }, []);

  const isHiddenByOverlay = sheetOpen || navOpen || buildingOpen;

  const handleViewChange = useCallback(
    (nextView: DirectoryViewMode) => {
      if (nextView === 'list' && !isListView) {
        onNavigate('/search');
      } else if (nextView === 'map' && isListView) {
        onNavigate('/map');
      }
    },
    [isListView, onNavigate]
  );

  const handleSelectBuilding = useCallback(
    (building: {
      buildingNumber: string;
      zoneLetter: string;
      lat: number;
      lng: number;
    }) => {
      const isMap = currentPath === '/' || currentPath === '/map';
      if (!isMap) {
        onNavigate(`/map?zone=${encodeURIComponent(building.zoneLetter)}&bldg=${encodeURIComponent(building.buildingNumber)}`);
        return;
      }
      window.dispatchEvent(new CustomEvent('map:searchBuilding', { detail: building }));
    },
    [currentPath, onNavigate]
  );

  return (
    <div
      dir="rtl"
      aria-hidden={isHiddenByOverlay}
      className={`fixed bottom-3 sm:bottom-5 inset-x-0 z-[1000] flex flex-col items-center pointer-events-none px-3 min-[380px]:px-4 pb-[env(safe-area-inset-bottom,0px)] gap-1.5 transition-all duration-300 ${
        isHiddenByOverlay ? 'translate-y-[140%] opacity-0 invisible pointer-events-none [&_*]:pointer-events-none' : 'translate-y-0 opacity-100 visible'
      }`}
    >
      {/* Tier 1: شريط الفلاتر المصغر */}
      <div
        className={`rounded-pill bg-white/95 border border-slate-200/80 shadow-floating backdrop-blur-md px-1 py-0.5 transition-all duration-200 ${
          searchDropdownOpen || isHiddenByOverlay
            ? 'opacity-0 translate-y-1 pointer-events-none invisible'
            : 'opacity-100 translate-y-0 pointer-events-auto visible'
        }`}
      >
        <UnifiedSearchFilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          selectedZone={selectedZone}
          onZoneChange={onZoneChange}
          businesses={businesses}
          showZone={confineToHadayek}
          variant={isListView ? 'list' : 'map'}
        />
      </div>

      {/* Tier 2: كبسولة البحث والتبديل */}
      <div className="pointer-events-auto w-full max-w-xl flex items-center gap-1.5 p-1 rounded-pill bg-white/95 border border-slate-200/80 shadow-floating backdrop-blur-md">
        <div className="flex-1 min-w-0">
          <UnifiedMapSearch
            value={searchQuery}
            onChange={onSearchChange}
            zone={selectedZone}
            businesses={businesses}
            confineToHadayek={confineToHadayek}
            onSelectBuilding={handleSelectBuilding}
            onSelectBusiness={onSelectBusiness}
            onOpenChange={setSearchDropdownOpen}
          />
        </div>
        <div className="shrink-0">
          <ViewSegmentedSwitch
            activeView={activeView}
            size="sm"
            onViewChange={handleViewChange}
          />
        </div>
      </div>
    </div>
  );
};
