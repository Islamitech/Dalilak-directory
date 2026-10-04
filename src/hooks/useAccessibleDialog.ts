import { useEffect, useRef } from 'react';

interface UseAccessibleDialogOptions {
  isOpen?: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

interface DialogEntry {
  id: number;
}

const dialogStack: DialogEntry[] = [];
let nextDialogId = 0;
let originalBodyOverflow: string | null = null;

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.offsetParent !== null)
  );
}

export function useAccessibleDialog({ isOpen = true, onClose, initialFocusRef }: UseAccessibleDialogOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = ++nextDialogId;
  const id = idRef.current;

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    dialogStack.push({ id });

    if (dialogStack.length === 1 && typeof document !== 'undefined') {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusables(container);
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
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
      const index = dialogStack.findIndex((entry) => entry.id === id);
      if (index !== -1) dialogStack.splice(index, 1);

      if (dialogStack.length === 0 && typeof document !== 'undefined') {
        document.body.style.overflow = originalBodyOverflow || '';
        originalBodyOverflow = null;
      }

      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        try {
          previousActiveElement.current.focus();
        } catch {}
      }
    };
  }, [isOpen, id, initialFocusRef]);

  return { containerRef };
}
