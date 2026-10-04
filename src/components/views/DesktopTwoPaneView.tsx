import React, { useRef, useEffect, useMemo } from 'react';
import { Business } from '../../types';
import { MapView } from './MapView';
import { UnifiedBusinessCard } from '../../features/business-details';
import { computeFilteredBusinesses } from '../showcase/model/showcaseFilterModel';
import { MapPin, RotateCcw } from 'lucide-react';
import { Button, LoadingSkeleton } from '../../shared/ui';

export interface DesktopTwoPaneViewProps {
  businesses: Business[];
  filteredBusinesses?: Business[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  userCoords: { lat: number; lng: number } | null;
  onOpenBusiness: (biz: Business) => void;
  onNavigate: (path: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
  mapCenter: { lat: number; lng: number };
  focusedBusiness?: Business | null;
  setFocusedBusiness?: (biz: Business | null) => void;
  onClearFocusedBusiness?: () => void;
}

/**
 * 🖥️ DesktopTwoPaneView (Owner Decision D4)
 * Split layout for viewports >= 1024px:
 * - Start Pane (RTL Right): 420px scrollable list panel.
 * - End Pane (RTL Left): Full-bleed map canvas.
 * - Bi-directional card <-> pin selection sync.
 */
export const DesktopTwoPaneView: React.FC<DesktopTwoPaneViewProps> = (props) => {
  const {
    businesses, filteredBusinesses, loading = false, searchQuery, onSearchChange,
    categoryFilter, onCategoryChange, selectedZone, onZoneChange, sortBy, onSortChange,
    openNowOnly, onToggleOpenNow, favorites, toggleFavorite, userCoords, onOpenBusiness,
    onNavigate, onOpenVideoModal, mapCenter, focusedBusiness, setFocusedBusiness,
    onClearFocusedBusiness,
  } = props;

  const listContainerRef = useRef<HTMLDivElement>(null);

  const effectiveFilteredBusinesses = useMemo(() => {
    if (filteredBusinesses && filteredBusinesses.length > 0) return filteredBusinesses;
    return computeFilteredBusinesses({
      publicBusinesses: businesses,
      activityIntent: null,
      deferredSearchQuery: searchQuery || '',
      categoryFilter,
      subcategoryFilter: 'all',
      effectiveSearchZone: selectedZone || 'all',
      govFilter: 'all',
      cityFilter: 'all',
      openNowOnly,
      hasRatingOnly: false,
      hasVideoOnly: false,
      sortBy: sortBy || 'default',
      userCoords,
      shuffleSeed: 1,
      pinnedDirectBizId: null,
    });
  }, [filteredBusinesses, businesses, searchQuery, categoryFilter, selectedZone, openNowOnly, sortBy, userCoords]);

  // Bi-directional sync: When focusedBusiness changes (e.g. from map pin select), scroll list to card
  useEffect(() => {
    if (!focusedBusiness?.id || !listContainerRef.current) return;
    const cardEl = listContainerRef.current.querySelector<HTMLElement>(`[data-biz-id="${focusedBusiness.id}"]`);
    if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusedBusiness?.id]);

  const handleCardClick = (biz: Business) => {
    if (setFocusedBusiness) setFocusedBusiness(biz);
    onOpenBusiness(biz);
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden bg-slate-50 dark:bg-slate-950" dir="rtl">
      {/* 1. Right Pane (RTL Start): 420px Scrollable Business List */}
      <aside aria-label="قائمة الأنشطة والنتائج" className="w-[400px] lg:w-[420px] shrink-0 h-full flex flex-col border-inline-end border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shadow-xs overflow-hidden">
        {/* Results Header / Stats Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              {effectiveFilteredBusinesses.length} نشاط متاح
            </span>
            {categoryFilter && categoryFilter !== 'all' && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px]">في {categoryFilter}</span>
            )}
          </div>

          {(categoryFilter !== 'all' || (searchQuery && searchQuery.trim())) && (
            <button
              type="button"
              onClick={() => { onCategoryChange('all'); if (onSearchChange) onSearchChange(''); }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        {/* Scrollable Cards Container */}
        <div
          ref={listContainerRef}
          tabIndex={0}
          role="region"
          aria-label="قائمة الأنشطة والنتائج"
          className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 divide-y divide-slate-100/50 dark:divide-slate-800/40 focus:outline-none"
        >
          {loading && businesses.length === 0 ? (
            <div className="p-4 space-y-3"><LoadingSkeleton variant="grid" count={4} /></div>
          ) : effectiveFilteredBusinesses.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">لا توجد نتائج مطابقة</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً.</p>
              {(categoryFilter !== 'all' || searchQuery) && (
                <Button variant="outline" size="sm" onClick={() => { onCategoryChange('all'); if (onSearchChange) onSearchChange(''); }}>
                  عرض كافة الأنشطة
                </Button>
              )}
            </div>
          ) : (
            effectiveFilteredBusinesses.map((biz) => {
              const isSelected = focusedBusiness?.id === biz.id;
              return (
                <div
                  key={biz.id}
                  data-biz-id={biz.id}
                  className={`pt-2.5 first:pt-0 transition-all rounded-2xl ${
                    isSelected ? 'ring-2 ring-amber-500 shadow-sm bg-amber-50/40 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <UnifiedBusinessCard
                    variant="compact"
                    business={biz}
                    onOpenBusiness={handleCardClick}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favorites.includes(biz.id)}
                    userCoords={userCoords}
                    onOpenVideoModal={onOpenVideoModal}
                  />
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Left Pane (RTL End): Full Map Canvas */}
      <section aria-label="الخريطة التفاعلية" className="flex-1 h-full min-w-0 relative overflow-hidden">
        <MapView
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          businesses={businesses}
          filteredBusinesses={effectiveFilteredBusinesses}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          selectedZone={selectedZone}
          onZoneChange={onZoneChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          openNowOnly={openNowOnly}
          onToggleOpenNow={onToggleOpenNow}
          onOpenBusiness={handleCardClick}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          userCoords={userCoords}
          onNavigate={onNavigate}
          lat={mapCenter.lat}
          lng={mapCenter.lng}
          focusedBusiness={focusedBusiness}
          onClearFocusedBusiness={onClearFocusedBusiness}
        />
      </section>
    </div>
  );
};
