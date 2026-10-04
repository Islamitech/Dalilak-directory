import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Check, Compass } from 'lucide-react';
import { EGYPT_POPULAR_LOCATIONS, EgyptLocationItem } from '../map/constants/mapConstants';

export interface NavbarLocationDropdownProps {
  activeLocation?: string;
  onLocationChange?: (locationName: string, coords?: { lat: number; lng: number }, gov?: string) => void;
}

export const NavbarLocationDropdown: React.FC<NavbarLocationDropdownProps> = ({
  activeLocation = 'حدائق الأهرام',
  onLocationChange,
}) => {
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLocationMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLocationMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocationMenuOpen]);

  const filteredLocations = useMemo(() => {
    const q = locationSearchQuery.trim().toLowerCase();
    if (!q) return EGYPT_POPULAR_LOCATIONS;
    return EGYPT_POPULAR_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.gov.toLowerCase().includes(q)
    );
  }, [locationSearchQuery]);

  const handleSelectLocation = (loc: EgyptLocationItem) => {
    setIsLocationMenuOpen(false);
    setLocationSearchQuery('');
    if (onLocationChange) {
      onLocationChange(loc.name, { lat: loc.lat, lng: loc.lng }, loc.gov);
    }
  };

  return (
    <div className="relative" ref={locationDropdownRef}>
      <button
        type="button"
        onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-[11px] sm:text-xs font-bold transition-all cursor-pointer border border-slate-200/60"
        title="تغيير المنطقة أو المدينة"
        aria-expanded={isLocationMenuOpen}
        aria-haspopup="listbox"
      >
        <Compass className="w-3.5 h-3.5 text-amber-600 animate-spin-slow shrink-0" />
        <span className="max-w-[70px] min-[360px]:max-w-[85px] sm:max-w-[120px] truncate">{activeLocation}</span>
      </button>

      {isLocationMenuOpen && (
        <div className="absolute top-full mt-2 start-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن منطقة أو مدينة..."
              value={locationSearchQuery}
              onChange={(e) => setLocationSearchQuery(e.target.value)}
              className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => {
                const isSelected = activeLocation === loc.name;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-900 font-black border border-amber-500/30'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span className="truncate">{loc.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {loc.gov}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                لم يتم العثور على مناطق مطابقة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
