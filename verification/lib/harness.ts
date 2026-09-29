import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const TARGET = process.env.VERIFICATION_TARGET || 'worktree';
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(HERE, '..', '..');
export const VERIF_DIR = path.resolve(HERE, '..');
export const ROOT =
  TARGET === 'baseline' ? path.resolve(HERE, '..', 'baseline') : PROJECT_ROOT;

export function imp(rel: string): Promise<any> {
  return import(pathToFileURL(path.join(ROOT, rel)).href);
}

export type Route = {
  name: string;
  match: (url: string) => boolean;
  respond: (url: string, init?: any) => any;
};

export function installFetchMock(routes: Route[]) {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    calls.push(url);
    for (const route of routes) {
      if (route.match(url)) return route.respond(url, init);
    }
    throw new Error('UNROUTED FETCH in harness: ' + url);
  }) as any;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

export function mockRes() {
  const state: any = {
    statusCode: undefined as number | undefined,
    headers: {} as Record<string, any>,
    body: undefined as any,
    redirects: [] as Array<{ status: number; to: string }>,
    ended: false,
  };
  const res: any = {
    setHeader(k: string, v: any) {
      state.headers[k.toLowerCase()] = v;
      return res;
    },
    getHeader(k: string) {
      return state.headers[k.toLowerCase()];
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    send(payload: any) {
      state.body = payload;
      state.ended = true;
      return res;
    },
    json(payload: any) {
      state.body = payload;
      state.ended = true;
      return res;
    },
    end(payload?: any) {
      if (payload !== undefined) state.body = payload;
      state.ended = true;
      return res;
    },
    redirect(a: any, b?: any) {
      const status = typeof a === 'number' ? a : 302;
      const to = typeof a === 'number' ? b : a;
      state.redirects.push({ status, to });
      state.statusCode = status;
      state.ended = true;
      return res;
    },
    write(chunk: any) {
      state.body = (state.body ?? '') + chunk;
      return true;
    },
  };
  return { res, state };
}

export function json(data: any, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
}

export const SUPABASE_HOST = 'xdqpbajymacpdccorjcj.supabase.co';
export const isSupabaseBusinesses = (url: string) =>
  url.includes('/rest/v1/businesses');
