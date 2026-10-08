import React from 'react';
import { useDirectoryLoad } from '../contexts/DirectoryLoadContext';
import { useNetworkStatus } from '../shared/hooks/useNetworkStatus';
import { Button, OfflineState } from '../shared/ui';

export function DirectoryStatus() {
  const { pending, error } = useDirectoryLoad();
  const { isOnline, retryConnection } = useNetworkStatus();

  if (!isOnline) {
    return <OfflineState banner onRetry={retryConnection} />;
  }

  if (!pending && !error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-4 py-2.5 text-xs bg-amber-500/10 border-b border-amber-500/20 text-slate-800 flex gap-3 items-center justify-center animate-fade-in"
    >
      <span className="font-semibold">{error || 'جارٍ استكمال وتحديث النتائج…'}</span>
      {error && (
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-700"
          onClick={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
        >
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
