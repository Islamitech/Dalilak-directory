import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export type EntitySheetSnap = 'peek' | 'half' | 'full';

const SNAPS: EntitySheetSnap[] = ['peek', 'half', 'full'];

export interface EntitySheetProps {
  snap: EntitySheetSnap;
  onSnapChange: (snap: EntitySheetSnap) => void;
  onClose: () => void;
  ariaLabel: string;
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
 * One surface for a place and a building: peek, half, and full on the phone,
 * and a 420px side panel on a wide screen. Dialog semantics apply only when
 * the sheet covers the screen.
 */
export const EntitySheet: React.FC<EntitySheetProps> = ({
  snap,
  onSnapChange,
  onClose,
  ariaLabel,
  peek,
  children,
  placement = 'map',
  showClose = true,
}) => {
  const sheetRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ y: number; snap: EntitySheetSnap } | null>(null);

  useEffect(() => {
    if (snap !== 'peek') return;
    if (window.matchMedia('(min-width: 1024px)').matches) onSnapChange('half');
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

  useEffect(() => {
    sheetRef.current?.focus();
  }, [snap]);

  const step = (direction: 1 | -1) => {
    const index = SNAPS.indexOf(snap);
    onSnapChange(SNAPS[Math.min(SNAPS.length - 1, Math.max(0, index + direction))]);
  };

  const endDrag = (clientY: number) => {
    const start = dragRef.current;
    dragRef.current = null;
    window.dispatchEvent(new CustomEvent('map:sheet-drag', { detail: { active: false } }));
    if (!start || Math.abs(clientY - start.y) < 28) return;
    step(clientY > start.y ? -1 : 1);
  };

  const isFull = snap === 'full';

  return (
    <>
    {placement === 'page' && (
      <button
        type="button"
        className="dl-esheet-backdrop"
        aria-label="إغلاق"
        onClick={onClose}
      />
    )}
    <section
      ref={sheetRef}
      data-map-sheet
      data-entity-sheet
      data-snap={snap}
      data-placement={placement}
      role={isFull ? 'dialog' : 'region'}
      aria-modal={isFull || undefined}
      aria-label={ariaLabel}
      tabIndex={-1}
      dir="rtl"
      className="dl-esheet pointer-events-auto text-start font-['Cairo',sans-serif]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          step(1);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          step(-1);
        }
      }}
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest('[data-sheet-handle]')) return;
        dragRef.current = { y: event.clientY, snap };
        event.currentTarget.setPointerCapture(event.pointerId);
        window.dispatchEvent(new CustomEvent('map:sheet-drag', { detail: { active: true } }));
      }}
      onPointerUp={(event) => {
        if (dragRef.current) endDrag(event.clientY);
      }}
      onPointerCancel={() => {
        if (!dragRef.current) return;
        dragRef.current = null;
        window.dispatchEvent(new CustomEvent('map:sheet-drag', { detail: { active: false } }));
      }}
    >
      <div data-sheet-handle className="dl-esheet-handle" aria-hidden="true" />
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
