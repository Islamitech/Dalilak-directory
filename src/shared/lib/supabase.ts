import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

export * from './supabaseConfig';

let clientPromise: Promise<SupabaseClient> | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'x-application-name': 'dalelak-public-directory',
          },
        },
      });
    });
  }
  return clientPromise;
}

export const getSupabaseClient = getSupabase;

export const supabase = {
  channel(name: string) {
    let internalChannel: any = null;
    let pendingHandlers: Array<{ event: string; filter: any; callback: (payload: any) => void }> = [];
    let isCancelled = false;
    let resolveInternalChannel: ((ch: any) => void) | null = null;
    const internalChannelPromise = new Promise<any>((resolve) => {
      resolveInternalChannel = resolve;
    });

    const channelObj = {
      on(event: string, filter: any, callback: (payload: any) => void) {
        if (internalChannel) {
          internalChannel.on(event, filter, callback);
        } else {
          pendingHandlers.push({ event, filter, callback });
        }
        return channelObj;
      },
      subscribe(callback?: (status: string, err?: any) => void) {
        void getSupabase()
          .then((client) => {
            if (isCancelled) {
              resolveInternalChannel?.(null);
              return;
            }
            internalChannel = client.channel(name);
            resolveInternalChannel?.(internalChannel);
            for (const h of pendingHandlers) {
              internalChannel.on(h.event, h.filter, h.callback);
            }
            pendingHandlers = [];
            if (!isCancelled) {
              internalChannel.subscribe(callback);
            } else {
              void client.removeChannel(internalChannel);
            }
          })
          .catch((err) => {
            resolveInternalChannel?.(null);
            callback?.('CHANNEL_ERROR', err);
          });
        return channelObj;
      },
      unsubscribe(callback?: (status: string, err?: any) => void) {
        isCancelled = true;
        if (internalChannel) {
          return internalChannel.unsubscribe(callback);
        }
      },
      get _rawChannel() {
        return internalChannel;
      },
      get _channelPromise() {
        return internalChannelPromise;
      },
      _cancel() {
        isCancelled = true;
      },
    };
    return channelObj;
  },
  async removeChannel(channel: any) {
    if (!channel) return;
    if (channel._cancel) {
      channel._cancel();
    }
    const client = await getSupabase();
    if (channel._channelPromise) {
      const raw = await channel._channelPromise;
      if (raw) {
        return client.removeChannel(raw);
      }
    } else {
      const raw = channel._rawChannel || channel;
      if (raw) {
        return client.removeChannel(raw);
      }
    }
  },
};
