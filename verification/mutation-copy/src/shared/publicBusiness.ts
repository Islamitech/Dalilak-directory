/** Public eligibility is shared by browser, realtime and server projections. */
export function businessMetadata(row: any): Record<string, any> {
 if (row?.notes && typeof row.notes === 'object') return row.notes;
 if (typeof row?.notes === 'string' && row.notes.trim().startsWith('{')) {
  try { const value=JSON.parse(row.notes); return value && typeof value==='object' && !Array.isArray(value)?value:{invalid:true}; } catch { return {invalid:true}; }
 }
 return {};
}
export function isPublicBusiness(row: any): boolean {
 if (!row || typeof row.id!=='string') return false;
 const meta=businessMetadata(row);
 const status=meta.publishedStatus ?? row.published_status ?? row.publishedStatus ?? 'published';
 return !meta.invalid && (row.verification_status ?? row.verificationStatus)==='verified'
  && !row.is_deleted && !row.isDeleted && !meta.isDeleted
  && status==='published' && (row.package_id ?? row.packageId)!=='pkg_interested_lead';
}
