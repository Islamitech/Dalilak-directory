import { isPublicBusiness, businessMetadata } from '../shared/publicBusiness.js';
import { getBusinessSlug } from '../utils/directoryUrl.js';

const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const rawKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!rawUrl || !rawKey) {
  throw new Error(
    'Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be configured.'
  );
}

export const SUPABASE_URL = rawUrl;
export const SUPABASE_ANON_KEY = rawKey;

const fields =
  'id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,working_hours,description,photos,cover_photo,notes,lat,lng,verification_status,package_id,created_at,updated_at,is_deleted,seo_title,seo_description,seo_intro,seo_faq,seo_status,seo_generated_at';

function customDirectoryUrl(row: Record<string, unknown>): string | undefined {
  const value = businessMetadata(row).customDirectoryUrl;
  return typeof value === 'string' ? value : undefined;
}

export function publicBusinessSlug(row: any): string {
  return getBusinessSlug({
    id: String(row.id || ''),
    nameAr: typeof row.name_ar === 'string' ? row.name_ar : undefined,
    nameEn: typeof row.name_en === 'string' ? row.name_en : undefined,
    city: typeof row.city === 'string' ? row.city : undefined,
    customDirectoryUrl: customDirectoryUrl(row),
  });
}

export async function fetchDirectoryRows(
  query: URLSearchParams,
  range?: string
): Promise<{ rows: any[]; total: number }> {
  const response = await fetch(SUPABASE_URL + '/rest/v1/businesses?' + query, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      Accept: 'application/json',
      ...(range ? { Range: range, 'Range-Unit': 'items', Prefer: 'count=exact' } : {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Directory upstream ' + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid directory response');
  return { rows, total: Number(response.headers.get('content-range')?.split('/')[1] || NaN) };
}

export async function loadPublicDirectory(): Promise<any[]> {
  const result: any[] = [];
  let offset = 0;
  while (offset < 100000) {
    const { rows, total } = await fetchDirectoryRows(
      new URLSearchParams({
        select: fields,
        verification_status: 'eq.verified',
        package_id: 'neq.pkg_interested_lead',
        order: 'created_at.desc,id.asc',
      }),
      offset + '-' + (offset + 499)
    );
    result.push(...rows.filter(isPublicBusiness));
    offset += rows.length;
    if (!rows.length || (Number.isFinite(total) ? offset >= total : rows.length < 500)) {
      return [...new Map(result.map((row) => [String(row.id), row])).values()];
    }
  }
  throw new Error('Directory pagination limit exceeded');
}

export interface BusinessLookupResult {
  business: any | null;
  status: 'found' | 'deleted' | 'not_found';
}

export async function findPublicBusinessWithStatus(raw: string): Promise<BusinessLookupResult> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw).trim();
  } catch {
    return { business: null, status: 'not_found' };
  }
  const match = decoded.match(/(biz_[a-zA-Z0-9_-]+)/i);
  const id = match ? match[1] : decoded;
  const { rows } = await fetchDirectoryRows(new URLSearchParams({ select: fields, id: 'eq.' + id, limit: '1' }));
  if (rows.length) {
    const row = rows[0];
    if (row.is_deleted || row.isDeleted) {
      return { business: row, status: 'deleted' };
    }
    if (isPublicBusiness(row)) {
      return { business: row, status: 'found' };
    }
    return { business: null, status: 'not_found' };
  }
  if (match) return { business: null, status: 'not_found' };
  const catalog = await loadPublicDirectory();
  const found =
    catalog.find((row) => publicBusinessSlug(row) === decoded || customDirectoryUrl(row) === decoded) || null;
  return { business: found, status: found ? 'found' : 'not_found' };
}

export async function findPublicBusiness(raw: string): Promise<any | null> {
  const res = await findPublicBusinessWithStatus(raw);
  return res.status === 'found' ? res.business : null;
}
