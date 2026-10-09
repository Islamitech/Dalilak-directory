import React from 'react';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: ToastAction | null;
}

export const Toast: React.FC<ToastProps> = ({ message, action = null }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="dl-toast"
      style={{ direction: 'rtl' }}
    >
      <div className="dl-toast-content">
        <span className="w-2.5 h-2.5 rounded-pill bg-amber-400 animate-ping motion-reduce:animate-none shrink-0" />
        <span>{message}</span>
        {action && (
          <button
            type="button"
            onClick={action.onAction}
            className="dl-toast-undo"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};
