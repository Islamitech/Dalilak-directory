import React, { useState } from 'react';
import { Business } from '../../types';
import { shuffleBusinessesWithSeed } from '../../utils/directoryEnhancements';
import { HadayekGatesModal } from '../atlas';
import { HadayekZone, HADAYEK_ZONES } from '../../data/hadayekAtlasData';
import { HomeHeroSection } from './home/HomeHeroSection';
import { HomeFeaturedSection } from './home/HomeFeaturedSection';
import { HomeCalloutsSection } from './home/HomeCalloutsSection';

export interface HomeViewProps {
  businesses: Business[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onNavigate: (path: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
  shuffleSeed?: number;
  initialAtlasTarget?: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  onSelectAtlasTarget?: (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  businesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onNavigate,
  onOpenVideoModal,
  shuffleSeed = 1,
  initialAtlasTarget = null,
  onSelectAtlasTarget,
}) => {
  // 1. Atlas State: Target Building / Zone
  const [localAtlasTarget, setLocalAtlasTarget] = useState<{
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null>(() => {
    if (initialAtlasTarget) return initialAtlasTarget;
    const defaultZone = HADAYEK_ZONES.find((z) => z.letterAr === 'ل') || HADAYEK_ZONES[0];
    return {
      zone: defaultZone,
      buildingNumber: '',
      coords: { lat: defaultZone.centerLat, lng: defaultZone.centerLng },
    };
  });

  const activeTarget = localAtlasTarget;
  const [isGatesModalOpen, setIsGatesModalOpen] = useState<boolean>(false);

  // Curated Featured businesses (verified, shuffled dynamically on each page load)
  const featuredBusinesses = React.useMemo(() => {
    const verified = businesses.filter((b) => b.verificationStatus === 'verified');
    const withMedia = verified.filter((b) => (b.photos && b.photos.length > 0) || b.coverPhoto);
    const candidates = withMedia.length >= 6 ? withMedia : verified;
    const shuffled = shuffleBusinessesWithSeed(candidates, shuffleSeed);
    return shuffled.slice(0, 6);
  }, [businesses, shuffleSeed]);

  const handleTargetSelection = (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => {
    setLocalAtlasTarget(target);
    if (onSelectAtlasTarget) {
      onSelectAtlasTarget(target);
    }
  };

  return (
    <div className="space-y-10 sm:space-y-14 pb-16" dir="rtl">
      {/* 1. Hadayek Atlas Sovereign Hero Section */}
      <HomeHeroSection
        businesses={businesses}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedGov={selectedGov}
        onGovChange={onGovChange}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
        userCoords={userCoords}
        isLocatingUser={isLocatingUser}
        onRequestLocation={onRequestLocation}
        onOpenBusiness={onOpenBusiness}
        onNavigate={onNavigate}
        activeTarget={activeTarget}
        onSelectTarget={handleTargetSelection}
        onOpenGatesGuide={() => setIsGatesModalOpen(true)}
      />

      {/* 2. Featured Verified Businesses Section */}
      <HomeFeaturedSection
        businesses={businesses}
        loading={loading}
        featuredBusinesses={featuredBusinesses}
        onNavigate={onNavigate}
        onOpenBusiness={onOpenBusiness}
        onToggleFavorite={onToggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        onOpenVideoModal={onOpenVideoModal}
      />

      {/* 3 & 4. Quick Callouts: Live Map & Business Free Registration */}
      <HomeCalloutsSection onNavigate={onNavigate} />

      {/* 5. Hadayek Gates Modal */}
      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={(zoneLetter) => {
          const zone = HADAYEK_ZONES.find((z) => z.letterAr === zoneLetter);
          if (zone) {
            handleTargetSelection({
              zone,
              buildingNumber: '',
              coords: { lat: zone.centerLat, lng: zone.centerLng },
            });
          }
        }}
      />
    </div>
  );
};
