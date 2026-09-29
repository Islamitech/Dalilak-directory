import React, { useId } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Accessible modal dialog with:
 *  - Focus trap and Escape-to-close (via useDialogFocus)
 *  - Click-outside-to-close on the overlay
 *  - Smooth fade+slide-up entry animation
 *  - Sticky header so the title is always visible while scrolling
 */
export function Dialog({ title, onClose, children }: DialogProps) {
  const ref = useDialogFocus(true, onClose);
  const id = useId();

  return (
    <div
      className="directory-dialog-overlay"
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="directory-dialog"
        onClick={e => e.stopPropagation()}
      >
        <header className="directory-dialog-header">
          <h2 id={id}>{title}</h2>
          <button
            className="directory-dialog-close"
            onClick={onClose}
            aria-label={`إغلاق ${title}`}
          >
            <X size={20} />
          </button>
        </header>
        <div className="directory-dialog-body">
          {children}
        </div>
      </div>
    </div>
  );
}
