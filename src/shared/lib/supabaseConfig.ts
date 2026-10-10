const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!envUrl || !envKey) {
  throw new Error(
    'Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.'
  );
}

export const SUPABASE_URL: string = envUrl;
export const SUPABASE_ANON_KEY: string = envKey;
export const SUPABASE_BASE_URL: string = SUPABASE_URL.replace(/\/+$/, '');
export const SUPABASE_REST_BASE: string = `${SUPABASE_BASE_URL}/rest/v1`;
