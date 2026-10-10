export const FAST_BUSINESS_SELECT =
  'id,name_ar,name_en,category,governorate,city,street,landmark,phone,secondary_phone,working_hours,description,lat,lng,package_id,package_name,package_price,verification_status,notes,created_at,cover_photo';

/** First screen omits the long description so the card photo can start sooner. */
export const LIST_BUSINESS_SELECT = FAST_BUSINESS_SELECT.replace(',description,', ',');

export function catalogQuery(select: string): string {
  return `businesses?select=${select}&package_id=neq.pkg_interested_lead&verification_status=eq.verified&order=created_at.desc,id.asc`;
}
