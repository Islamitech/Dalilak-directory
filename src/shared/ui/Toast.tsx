import React from 'react';

export interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  const typeStyles = {
    success: 'bg-emerald-600/95 text-white border-emerald-400/40',
    info: 'bg-blue-600/95 text-white border-blue-400/40',
    warning: 'bg-amber-600/95 text-white border-amber-400/40',
    error: 'bg-rose-600/95 text-white border-rose-400/40',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-xl text-xs font-black shadow-2xl animate-fade-in transition-all select-none"
      style={{ direction: 'rtl' }}
    >
      <div className={`flex items-center gap-2 ${typeStyles[type]}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        <span>{message}</span>
      </div>
    </div>
  );
};
