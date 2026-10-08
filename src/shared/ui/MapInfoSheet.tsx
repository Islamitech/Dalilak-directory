import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface MapInfoSheetProps {
  /** Icon rendered inside the amber header badge. */
  icon: React.ReactNode;
  /** Small chips shown above the title (e.g. area / type). */
  chips?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  closeLabel?: string;
  onClose: () => void;
  ariaLabel: string;
  /** Scrollable body (info rows, stats...). */
  children?: React.ReactNode;
  /** Action buttons pinned at the bottom (use the shared dl-act buttons). */
  actions?: React.ReactNode;
}

/**
 * Unified, non-modal bottom sheet used on the map (buildings, navigation).
 * It mirrors the activity detail modal: amber hero header, dl-ir info rows and a
 * pinned dl-act action bar. It has NO backdrop, so the map and the route stay visible
 * and interactive while it is open.
 */
export const MapInfoSheet: React.FC<MapInfoSheetProps> = ({
  icon,
  chips,
  title,
  subtitle,
  closeLabel = 'إغلاق',
  onClose,
  ariaLabel,
  children,
  actions,
}) => {
  const sheetRef = useRef<HTMLElement>(null);

  // Publish the sheet height so floating map controls can sit above it.
  useEffect(() => {
    const el = sheetRef.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const publish = () => host.style.setProperty('--map-sheet-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      host.style.removeProperty('--map-sheet-h');
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section
      ref={sheetRef}
      role="region"
      aria-label={ariaLabel}
      data-map-sheet
      dir="rtl"
      className="dl-msheet pointer-events-auto text-start font-['Cairo',sans-serif]"
    >
      <header className="dl-msh">
        <span className="dl-msh-ic" aria-hidden="true">{icon}</span>
        <div className="dl-msh-t">
          {chips && <div className="dl-msh-chips">{chips}</div>}
          <h3>{title}</h3>
          {subtitle && <p className="dl-msh-sub">{subtitle}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel} className="dl-msx">
          <X className="w-4 h-4" />
        </button>
      </header>

      {children && <div className="dl-msb">{children}</div>}
      {actions && <div className="dl-dbar">{actions}</div>}
    </section>
  );
};
