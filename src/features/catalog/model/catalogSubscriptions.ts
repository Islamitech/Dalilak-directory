import { supabase } from '../../../services/supabaseClient';
import { Business } from '../../../types';
import { isPublicBusiness } from '../../../shared/publicBusiness';
import { mapRawToBusiness } from './businessMapper';

export interface SubscriptionHandlers {
  onRealtimePayload: (id: string, value: Business | null) => void;
  onRetryRequested: () => void;
}

export function setupCatalogSubscriptions(handlers: SubscriptionHandlers) {
  const channel = supabase
    .channel('dalelak-public-directory-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, (payload: any) => {
      const id = payload.eventType === 'DELETE' ? payload.old?.id : payload.new?.id;
      if (!id) return;
      const row = payload.eventType === 'DELETE' || !isPublicBusiness(payload.new) ? null : mapRawToBusiness(payload.new);
      const value = row && isPublicBusiness(row) ? row : null;
      handlers.onRealtimePayload(id, value);
    })
    .subscribe();

  const sync = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
  if (sync) {
    sync.onmessage = (event) => {
      if (event.data?.type === 'SYNC_DATA') handlers.onRetryRequested();
    };
  }

  const handleDirectoryRetry = () => handlers.onRetryRequested();
  window.addEventListener('directory:retry', handleDirectoryRetry);

  return () => {
    window.removeEventListener('directory:retry', handleDirectoryRetry);
    void supabase.removeChannel(channel);
    sync?.close();
  };
}

export function setupCatalogAutoSync(onSync: () => void, intervalMs = 300000) {
  let lastSyncTime = Date.now();
  const trigger = () => {
    lastSyncTime = Date.now();
    onSync();
  };

  const handleVisibility = () => {
    if (!document.hidden && Date.now() - lastSyncTime >= intervalMs) trigger();
  };

  document.addEventListener('visibilitychange', handleVisibility);
  const interval = window.setInterval(() => {
    if (!document.hidden) trigger();
  }, intervalMs);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(interval);
  };
}

