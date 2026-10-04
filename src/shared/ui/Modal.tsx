import React from 'react';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import { IconButton } from './IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
}) => {
  const { containerRef } = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'نافذة منبثقة'}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col focus:outline-none`}
        style={{ direction: 'rtl' }}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            {title ? (
              <h2 className="text-base font-black text-slate-800">{title}</h2>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <IconButton
                aria-label="إغلاق النافذة"
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<span className="text-lg leading-none">✕</span>}
              />
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
