export function businessMetadata(row: unknown): Record<string, unknown> {
  if (!row || typeof row !== 'object') return {};
  const notes = (row as { notes?: unknown }).notes;
  if (notes && typeof notes === 'object' && !Array.isArray(notes)) {
    return notes as Record<string, unknown>;
  }
  if (typeof notes === 'string' && notes.trim().startsWith('{')) {
    try {
      const value = JSON.parse(notes);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : { invalid: true };
    } catch {
      return { invalid: true };
    }
  }
  return {};
}

export function isPublicBusiness(row: unknown): boolean {
  if (!row || typeof row !== 'object') return false;
  const record = row as Record<string, unknown>;
  const meta = businessMetadata(row);
  const status = meta.publishedStatus ?? record.published_status ?? record.publishedStatus ?? 'published';
  return (
    !meta.invalid &&
    (record.verification_status ?? record.verificationStatus) === 'verified' &&
    !record.is_deleted &&
    !record.isDeleted &&
    !meta.isDeleted &&
    status === 'published' &&
    (record.package_id ?? record.packageId) !== 'pkg_interested_lead'
  );
}
