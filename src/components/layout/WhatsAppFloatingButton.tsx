import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export interface WhatsAppFloatingButtonProps {
  referralCode?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ referralCode }) => {
  const [sheetOpen, setSheetOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-entity-sheet][data-placement="page"]'))
  );
  const [navOpen, setNavOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('.dl-navpill'))
  );
  const [buildingOpen, setBuildingOpen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-entity-sheet][data-placement="map"]'))
  );

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
  const text = encodeURIComponent(
    'مرحباً دليلك، أود الاستفسار عن خدمة في الدليل' + (referralCode ? ` (كود: ${referralCode})` : '')
  );

  return (
    <a
      href={`https://wa.me/201556221141?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={isHiddenByOverlay || undefined}
      tabIndex={isHiddenByOverlay ? -1 : undefined}
      className={`hidden md:flex fixed bottom-6 start-6 lg:start-auto lg:end-6 z-30 w-12 h-12 rounded-pill bg-white hover:bg-slate-50 text-emerald-600 border border-slate-200 shadow-xl items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${
        isHiddenByOverlay ? 'translate-y-24 opacity-0 pointer-events-none invisible' : 'translate-y-0 opacity-100 visible'
      }`}
      title="تواصل معنا عبر واتساب"
      aria-label="تواصل عبر واتساب"
    >
      <MessageCircle className="w-5 h-5" />
    </a>
  );
};
