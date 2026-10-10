import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export type EntitySheetSnap = 'peek' | 'half' | 'full';

const SNAPS: EntitySheetSnap[] = ['peek', 'half', 'full'];

export interface EntitySheetProps {
  snap: EntitySheetSnap;
  onSnapChange: (snap: EntitySheetSnap) => void;
  onClose: () => void;
  ariaLabel: string;
  ariaLabelledBy?: string;
  /** Compact preview. Shown only while the sheet is peeked. */
  peek?: React.ReactNode;
  /** Half and full body. */
  children?: React.ReactNode;
  /** `map` anchors inside the map. `page` covers the directory. */
  placement?: 'map' | 'page';
  /** Peek keeps this control. Expanded activity content brings its own close button. */
  showClose?: boolean;
}

/**
 * One surface for a place and a building: peek (~110px), half (~48vh), and full (~90vh)
 * on mobile with native spring physics, and a floating side panel on wide screens (>= 1024px).
 */
export const EntitySheet: React.FC<EntitySheetProps> = ({
  snap,
  onSnapChange,
  onClose,
  ariaLabel,
  ariaLabelledBy,
  peek,
  children,
  placement = 'map',
  showClose = true,
}) => {
  const sheetRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startY: number; startTime: number; startHeight: number; initialSnap: EntitySheetSnap } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches && snap !== 'full') {
      onSnapChange('full');
    }
  }, [snap, onSnapChange]);

  useEffect(() => {
    const el = sheetRef.current;
    const host = el?.parentElement;
    if (!el || !host || placement !== 'map') return;
    const publish = () => host.style.setProperty('--map-sheet-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      host.style.removeProperty('--map-sheet-h');
    };
  }, [placement, snap]);

  useEffect(() => { sheetRef.current?.focus(); }, [snap]);

  const step = useCallback((dir: 1 | -1) => {
    const idx = SNAPS.indexOf(snap);
    onSnapChange(SNAPS[Math.min(SNAPS.length - 1, Math.max(0, idx + dir))]);
  }, [snap, onSnapChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) return;
    if (!(e.target as HTMLElement).closest('[data-sheet-handle]') || !sheetRef.current) return;
    dragRef.current = { startY: e.clientY, startTime: Date.now(), startHeight: sheetRef.current.getBoundingClientRect().height, initialSnap: snap };
    setIsDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('map:sheet-drag', { detail: { active: true } }));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current || !sheetRef.current) return;
    const { startY, startHeight, initialSnap } = dragRef.current;
    const dy = e.clientY - startY;

    if (dy < 0) {
      const maxH = typeof window !== 'undefined' ? window.innerHeight * 0.92 : 800;
      sheetRef.current.style.height = `${Math.min(maxH, startHeight - dy)}px`;
      sheetRef.current.style.transform = '';
    } else if (initialSnap === 'peek') {
      sheetRef.current.style.transform = `translateY(${dy * 0.7}px)`;
    } else {
      const targetH = Math.max(110, startHeight - dy);
      sheetRef.current.style.height = `${targetH}px`;
      sheetRef.current.style.transform = startHeight - dy < 110 ? `translateY(${(110 - (startHeight - dy)) * 0.6}px)` : '';
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current || !sheetRef.current) return null;
    const data = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    sheetRef.current.style.height = '';
    sheetRef.current.style.transform = '';
    window.dispatchEvent(new CustomEvent('map:sheet-drag', { detail: { active: false } }));
    return data;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const data = finishDrag(e);
    if (!data) return;
    const { startY, startTime, initialSnap } = data;
    const dy = e.clientY - startY;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = dy / dt;

    if (Math.abs(dy) < 8 && dt < 300) {
      onSnapChange(initialSnap === 'peek' ? 'half' : initialSnap === 'half' ? 'full' : 'half');
      return;
    }
    if (dy < -35 || velocity < -0.25) {
      if (initialSnap === 'peek') onSnapChange(dy < -160 || velocity < -0.65 ? 'full' : 'half');
      else if (initialSnap === 'half') onSnapChange('full');
      return;
    }
    if (dy > 40 || velocity > 0.25) {
      if (initialSnap === 'full') onSnapChange(dy > 220 || velocity > 0.75 ? 'peek' : 'half');
      else if (initialSnap === 'half') (dy > 220 || velocity > 0.8 ? onClose() : onSnapChange('peek'));
      else if (initialSnap === 'peek' && (dy > 45 || velocity > 0.35)) onClose();
    }
  };

  const isFull = snap === 'full';

  return (
    <>
      {placement === 'page' && snap !== 'peek' && (
        <button type="button" className="dl-esheet-backdrop" aria-label="إغلاق" onClick={onClose} />
      )}
      <section
        ref={sheetRef}
        data-map-sheet
        data-entity-sheet
        data-snap={snap}
        data-placement={placement}
        data-dragging={isDragging ? 'true' : 'false'}
        role={isFull ? 'dialog' : 'region'}
        aria-modal={isFull || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        dir="rtl"
        className={`dl-esheet pointer-events-auto text-start font-['Cairo',sans-serif] ${isDragging ? 'is-dragging' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); step(1); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={(e) => finishDrag(e)}
      >
        <div data-sheet-handle className="dl-esheet-handle-zone">
          <div className="dl-esheet-handle" aria-hidden="true" />
        </div>
        {showClose && (
          <IconButton
            aria-label="إغلاق"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="dl-esheet-x"
            icon={<X className="w-4 h-4" />}
          />
        )}
        <div className="dl-esheet-body">
          {snap === 'peek' && peek ? peek : children}
        </div>
      </section>
    </>
  );
};
