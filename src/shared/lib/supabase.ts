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
        void getSupabase().then((client) => {
          internalChannel = client.channel(name);
          for (const h of pendingHandlers) {
            internalChannel.on(h.event, h.filter, h.callback);
          }
          pendingHandlers = [];
          internalChannel.subscribe(callback);
        });
        return channelObj;
      },
      get _rawChannel() {
        return internalChannel;
      },
    };
    return channelObj;
  },
  async removeChannel(channel: any) {
    const client = await getSupabase();
    const raw = channel && channel._rawChannel ? channel._rawChannel : channel;
    if (raw) {
      return client.removeChannel(raw);
    }
  },
};
