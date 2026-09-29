import { useEffect, useRef } from 'react';

interface UseAccessibleDialogOptions {
  isOpen?: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

interface DialogEntry {
  id: number;
}

// Module-level stack of active dialogs
const dialogStack: DialogEntry[] = [];
let nextDialogId = 0;

export function useAccessibleDialog({ isOpen = true, onClose, initialFocusRef }: UseAccessibleDialogOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const initialFocusRefInternal = useRef(initialFocusRef);
  initialFocusRefInternal.current = initialFocusRef;

  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    idRef.current = ++nextDialogId;
  }
  const id = idRef.current;

  useEffect(() => {
    if (!isOpen) return;

    // Capture element that had focus prior to opening
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Push this dialog onto the module-level stack
    dialogStack.push({ id });

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusables = (root: HTMLElement): HTMLElement[] => {
      return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-hidden') !== 'true' &&
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.offsetParent !== null)
      );
    };

    // Focus initial or first focusable element
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusables(container);

      if (initialFocusRefInternal.current?.current) {
        initialFocusRefInternal.current.current.focus();
      } else if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      // ONLY the top-most dialog reacts to Escape and Tab
      const isTopMost = dialogStack.length > 0 && dialogStack[dialogStack.length - 1].id === id;
      if (!isTopMost) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const curContainer = containerRef.current;
        if (!curContainer) return;

        const currentFocusables = getFocusables(curContainer);
        if (currentFocusables.length === 0) {
          e.preventDefault();
          curContainer.focus();
          return;
        }

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === curContainer || !curContainer.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || document.activeElement === curContainer || !curContainer.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);

      // Remove from stack
      const index = dialogStack.findIndex((entry) => entry.id === id);
      if (index !== -1) {
        dialogStack.splice(index, 1);
      }

      // Restore focus to previous active element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        try {
          previousActiveElement.current.focus();
        } catch {}
      }
    };
  }, [isOpen]);

  return { containerRef };
}
