import React from 'react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right' | 'left';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerContent?: React.ReactNode;
  hideDefaultHeader?: boolean;
  'aria-label'?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerContent,
  hideDefaultHeader = false,
  'aria-label': ariaLabel,
}) => {
  const { containerRef } = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen) return null;

  const positionClasses = {
    bottom:
      'bottom-0 inset-x-0 max-h-[85dvh] rounded-t-lg border-t border-slate-200/80',
    right:
      'top-0 bottom-0 end-0 w-full max-w-md border-s border-slate-200/80 shadow-2xl',
    left:
      'top-0 bottom-0 start-0 w-full max-w-md border-e border-slate-200/80 shadow-2xl',
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-fade-in ${overlayClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'لوحة خيارات'}
        tabIndex={-1}
        className={`fixed ${positionClasses[position]} bg-white shadow-2xl flex flex-col overflow-hidden focus:outline-none ${className}`}
        style={{ direction: 'rtl' }}
      >
        {/* Grab Handle for bottom sheet */}
        {!hideDefaultHeader && position === 'bottom' && (
          <div className="w-12 h-1.5 bg-slate-300 rounded-pill mx-auto my-3 shrink-0" />
        )}

        {/* Header */}
        {!hideDefaultHeader && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
            {headerContent ? (
              headerContent
            ) : (
              <h2 className="text-base font-extrabold text-slate-800">{title}</h2>
            )}
            <IconButton
              aria-label="إغلاق"
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<span className="text-lg leading-none">✕</span>}
            />
          </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto flex-1 ${contentClassName || 'p-6'}`}>{children}</div>
      </div>
    </div>
  );
};
