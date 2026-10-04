import React, { useState, useMemo, useCallback } from 'react';
import { useDirectoryNavigation } from '../hooks/useDirectoryNavigation';
import { useDirectoryLoad, DirectorySearchContext } from '../contexts/DirectoryLoadContext';
import { DirectoryStatus } from './DirectoryStatus';
import { isPublicBusiness } from '../shared/publicBusiness';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { Business } from '../types';
import { getDirectoryPath, getBusinessSlug } from '../utils/directoryUrl';
import { AppNavbar } from './layout/AppNavbar';
import { AppFooter } from './layout/AppFooter';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { MessageCircle } from 'lucide-react';
import { useShowcaseFilterState } from './showcase/hooks/useShowcaseFilterState';
import { useShowcaseFavorites } from './showcase/hooks/useShowcaseFavorites';
import { useShowcaseMetadata } from './showcase/hooks/useShowcaseMetadata';
import { useShowcaseGeolocation } from './showcase/hooks/useShowcaseGeolocation';
import { computeFilteredBusinesses } from './showcase/model/showcaseFilterModel';
import { PublicShowcaseViews } from './showcase/PublicShowcaseViews';
import { PublicShowcaseModals } from './showcase/PublicShowcaseModals';

export interface PublicShowcaseProps {
  businesses: Business[];
  initialBizId?: string;
  isPreviewMode?: boolean;
  referralCode?: string;
  loading?: boolean;
}

export const PublicShowcase: React.FC<PublicShowcaseProps> = ({
  businesses,
  initialBizId,
  referralCode,
  loading = false,
}) => {
  const routing = useDirectoryNavigation();
  const currentPath = routing.path;
  const directoryLoad = useDirectoryLoad();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  }, []);

  const filterState = useShowcaseFilterState();
  const { favorites, toggleFavorite } = useShowcaseFavorites(showToast);
  const geo = useShowcaseGeolocation(filterState, showToast);

  const handleNavigate = useCallback((newPath: string) => {
    const url = new URL(newPath, window.location.origin);
    if ((url.pathname === '/' || url.pathname === '/map') && !url.searchParams.has('zone')) {
      filterState.setHadayekZoneFilter('all');
    }
    const cat = url.searchParams.get('cat');
    if (cat) filterState.handleCategoryChange(cat);
    routing.navigate(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filterState, routing]);

  const activityIntent = useMemo(
    () => (currentPath === '/' || currentPath.startsWith('/map')) ? parseActivitySearchIntent(filterState.deferredSearchQuery) : null,
    [currentPath, filterState.deferredSearchQuery]
  );
  const effectiveSearchZone = activityIntent?.zone ?? filterState.hadayekZoneFilter;
  const effectiveMapCategoryFilter =
    activityIntent?.category ??
    (filterState.subcategoryFilter !== 'all' ? filterState.subcategoryFilter : filterState.categoryFilter);

  const handleReshuffle = useCallback(() => {
    filterState.setShuffleSeed(Date.now() ^ Math.floor(Math.random() * 1000000));
    showToast('تمت إعادة خلط وترتيب الأنشطة عشوائياً 🔀');
  }, [filterState, showToast]);

  const selectedBiz = useMemo(
    () =>
      businesses.find(
        (b) =>
          isPublicBusiness(b) &&
          (b.id === routing.token || getBusinessSlug(b) === routing.token || b.customDirectoryUrl === routing.token)
      ) || null,
    [businesses, routing.token]
  );

  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const [pinnedDirectBizId, setPinnedDirectBizId] = useState<string | null>(null);
  const [focusedMapBiz, setFocusedMapBiz] = useState<Business | null>(null);
  const isDirectLinkOpenRef = React.useRef(Boolean(initialBizId));

  React.useEffect(() => {
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

  useShowcaseMetadata(selectedBiz, currentPath, filterState.categoryFilter, filterState.hadayekZoneFilter);

  const publicBusinesses = useMemo(() => businesses.filter(isPublicBusiness), [businesses]);

  const filteredBusinesses = useMemo(() => {
    return computeFilteredBusinesses({
      publicBusinesses,
      activityIntent,
      deferredSearchQuery: filterState.deferredSearchQuery,
      categoryFilter: filterState.categoryFilter,
      subcategoryFilter: filterState.subcategoryFilter,
      effectiveSearchZone,
      govFilter: filterState.govFilter,
      cityFilter: filterState.cityFilter,
      openNowOnly: filterState.openNowOnly,
      hasRatingOnly: filterState.hasRatingOnly,
      hasVideoOnly: filterState.hasVideoOnly,
      sortBy: filterState.sortBy,
      userCoords: geo.userCoords,
      shuffleSeed: filterState.shuffleSeed,
      pinnedDirectBizId,
    });
  }, [
    publicBusinesses,
    activityIntent,
    filterState.deferredSearchQuery,
    filterState.govFilter,
    filterState.cityFilter,
    effectiveSearchZone,
    filterState.categoryFilter,
    filterState.subcategoryFilter,
    filterState.openNowOnly,
    filterState.hasRatingOnly,
    filterState.hasVideoOnly,
    filterState.sortBy,
    geo.userCoords,
    filterState.shuffleSeed,
    pinnedDirectBizId,
  ]);

  const isMapRoute = currentPath === '/' || currentPath === '/map';

  return (
    <div
      className={
        isMapRoute
          ? "h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
          : "min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
      }
      style={{ direction: 'rtl' }}
    >
      <AppNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        activeLocation={filterState.cityFilter}
        onLocationChange={geo.handleLocationChange}
      />

      <DirectoryStatus />
      <main
        className={
          isMapRoute
            ? "flex-1 w-full min-h-0 relative overflow-hidden flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
            : "flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
        }
      >
        <React.Suspense
          fallback={
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <span className="text-xs font-bold text-slate-400">جاري التحميل...</span>
            </div>
          }
        >
          <DirectorySearchContext.Provider value={filterState.searchQuery !== filterState.deferredSearchQuery}>
            <PublicShowcaseViews
              currentPath={currentPath}
              filterState={filterState}
              publicBusinesses={publicBusinesses}
              filteredBusinesses={filteredBusinesses}
              effectiveMapCategoryFilter={effectiveMapCategoryFilter}
              effectiveSearchZone={effectiveSearchZone}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              userCoords={geo.userCoords}
              isLocatingUser={geo.isLocatingUser}
              handleRequestLocation={geo.handleRequestLocation}
              handleNavigate={handleNavigate}
              mapCenter={geo.mapCenter}
              focusedMapBiz={focusedMapBiz}
              setFocusedMapBiz={setFocusedMapBiz}
              handleOpenBusiness={handleOpenBusiness}
              setSelectedVideoBiz={setSelectedVideoBiz}
              handleReshuffle={handleReshuffle}
              loading={loading}
            />
          </DirectorySearchContext.Provider>
        </React.Suspense>
      </main>

      {!isMapRoute && <AppFooter onNavigate={handleNavigate} />}

      <PublicShowcaseModals
        selectedBiz={selectedBiz}
        routingToken={routing.token}
        directoryLoad={directoryLoad}
        handleCloseBusiness={handleCloseBusiness}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        setSelectedVideoBiz={setSelectedVideoBiz}
        publicBusinesses={publicBusinesses}
        handleOpenBusiness={handleOpenBusiness}
        handleShowBusinessOnMap={handleShowBusinessOnMap}
        handleNavigate={handleNavigate}
        selectedVideoBiz={selectedVideoBiz}
        toastMessage={toastMessage}
      />

      <a
        href={`https://wa.me/201556221141?text=${encodeURIComponent(
          'مرحباً دليلك، أود الاستفسار عن خدمة في الدليل' + (referralCode ? ` (كود: ${referralCode})` : '')
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-6 start-6 z-30 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        title="تواصل معنا عبر واتساب"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
      />
    </div>
  );
};
