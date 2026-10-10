import { Business } from '../../../types';
import { SUPABASE_REST_BASE } from '../../../shared/lib/supabase';
import { FAST_BUSINESS_SELECT, catalogQuery } from '../../../shared/catalogQuery';

export { FAST_BUSINESS_SELECT, LIST_BUSINESS_SELECT } from '../../../shared/catalogQuery';

export const SUPABASE_REST_URL = `${SUPABASE_REST_BASE}/${catalogQuery(FAST_BUSINESS_SELECT)}`;

export const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function getSafeCacheList(list: Business[]): Business[] {
  return list.map((b) => ({
    ...b,
    photos: Array.isArray(b.photos)
      ? b.photos
          .filter((p: string) => typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://')))
          .slice(0, 1)
      : (b.coverPhoto && !b.coverPhoto.startsWith('data:') ? [b.coverPhoto] : []),
  }));
}

export function mapRawToBusiness(r: any): Business {
  let metaVideos: string[] = [];
  let metaGoogleSyncStatus = r.google_sync_status;
  let metaGoogleMapsUrl = r.google_maps_url;
  let metaGooglePlaceId = r.google_place_id;
  let metaIsFeeExempt = r.is_fee_exempt ?? r.isFeeExempt;
  let metaCoverPhoto: string | undefined = r.cover_photo || r.coverPhoto;
  let metaGoogleRatingEnabled =
    r.google_rating_enabled !== undefined
      ? Boolean(r.google_rating_enabled)
      : (r.googleRatingEnabled !== undefined ? Boolean(r.googleRatingEnabled) : undefined);
  let metaGoogleRating =
    r.google_rating !== undefined
      ? Number(r.google_rating)
      : (r.googleRating !== undefined ? Number(r.googleRating) : undefined);
  let metaGoogleReviewsCount =
    r.google_reviews_count !== undefined
      ? Number(r.google_reviews_count)
      : (r.googleReviewsCount !== undefined ? Number(r.googleReviewsCount) : undefined);
  let metaIsDeleted: boolean = Boolean(r.is_deleted || r.isDeleted);
  let metaViewsCount: number = Number(r.views_count ?? r.viewsCount ?? 0);
  let metaFavoriteCount: number = Number(r.favorite_count ?? r.favoriteCount ?? 0);
  let metaCustomDirectoryUrl: string | undefined = r.custom_directory_url || r.customDirectoryUrl;
  let metaMainCategoryId: string | undefined = r.main_category_id || r.mainCategoryId;
  let metaSubcategoryId: string | undefined = r.subcategory_id || r.subcategoryId;
  let metaServices: string[] = Array.isArray(r.services)
    ? r.services.filter((item: unknown) => typeof item === 'string')
    : [];
  let metaPublishedStatus: 'published' | 'draft' | 'unlisted' | undefined = undefined;
  let metaOffer: string | undefined;

  if (typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(r.notes.trim());
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.videos)) metaVideos = parsed.videos;
        if (parsed.googleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
        if (parsed.googleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
        if (parsed.googlePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
        if (parsed.customDirectoryUrl && !metaCustomDirectoryUrl) metaCustomDirectoryUrl = parsed.customDirectoryUrl;
        if (parsed.isFeeExempt !== undefined && metaIsFeeExempt === undefined) metaIsFeeExempt = parsed.isFeeExempt;
        if (parsed.coverPhoto && !metaCoverPhoto) metaCoverPhoto = parsed.coverPhoto;
        if (parsed.googleRatingEnabled !== undefined && metaGoogleRatingEnabled === undefined)
          metaGoogleRatingEnabled = Boolean(parsed.googleRatingEnabled);
        if (parsed.googleRating !== undefined && metaGoogleRating === undefined)
          metaGoogleRating = Number(parsed.googleRating);
        if (parsed.googleReviewsCount !== undefined && metaGoogleReviewsCount === undefined)
          metaGoogleReviewsCount = Number(parsed.googleReviewsCount);
        if (parsed.isDeleted !== undefined && !metaIsDeleted) metaIsDeleted = Boolean(parsed.isDeleted);
        if (parsed.viewsCount !== undefined && !metaViewsCount) metaViewsCount = Number(parsed.viewsCount);
        if (parsed.favoriteCount !== undefined && !metaFavoriteCount) metaFavoriteCount = Number(parsed.favoriteCount);
        if (parsed.publishedStatus) metaPublishedStatus = parsed.publishedStatus;
        if (parsed.mainCategoryId && !metaMainCategoryId) metaMainCategoryId = parsed.mainCategoryId;
        if (parsed.subcategoryId && !metaSubcategoryId) metaSubcategoryId = parsed.subcategoryId;
        if (Array.isArray(parsed.services) && metaServices.length === 0) {
          metaServices = parsed.services.filter((item: unknown) => typeof item === 'string');
        }
        if (typeof parsed.offer === 'string') metaOffer = parsed.offer;
        else if (typeof parsed.specialOffer === 'string') metaOffer = parsed.specialOffer;
      }
    } catch {}
  }

  const isFeeExempt = Boolean(
    metaIsFeeExempt || r.package_price === 0 || r.packagePrice === 0 || r.package_id === 'pkg_exempt'
  );
  let rawPhotos: string[] = [];
  if (Array.isArray(r.photos)) {
    rawPhotos = r.photos;
  } else if (typeof r.photos === 'string' && r.photos.trim().length > 0) {
    try {
      const p = JSON.parse(r.photos.trim());
      if (Array.isArray(p)) rawPhotos = p;
      else if (typeof p === 'string') rawPhotos = [p];
    } catch {
      if (r.photos.startsWith('http') || r.photos.startsWith('data:')) rawPhotos = [r.photos];
    }
  }
  const rawVideos = Array.isArray(r.videos) && r.videos.length > 0 ? r.videos : metaVideos;

  const lat = Number.isFinite(Number(r.lat)) ? Number(r.lat) : 0;
  const lng = Number.isFinite(Number(r.lng)) ? Number(r.lng) : 0;

  let rawGoogleMapsUrl = metaGoogleMapsUrl || r.google_maps_url || r.googleMapsUrl || '';
  if (typeof rawGoogleMapsUrl === 'string') rawGoogleMapsUrl = rawGoogleMapsUrl.trim();
  else rawGoogleMapsUrl = '';
  const cleanGoogleMapsUrl =
    rawGoogleMapsUrl && rawGoogleMapsUrl.startsWith('http') && !rawGoogleMapsUrl.includes('search/?api=1&query=')
      ? rawGoogleMapsUrl
      : undefined;

  const rawName = (r.name_ar || r.nameAr || '').replace(BIDI_CONTROL_REGEX, '').trim();
  const rawCity = (r.city || '').trim();
  const rawStreet = (r.street || '').trim();
  const fullLocText = `${rawCity} ${rawStreet} ${rawName}`.toLowerCase();

  let resolvedGov = r.governorate || 'القاهرة';
  if (
    fullLocText.includes('زهراء المعادي') ||
    fullLocText.includes('المعادي') ||
    fullLocText.includes('مدينة نصر') ||
    fullLocText.includes('التجمع')
  ) {
    resolvedGov = 'القاهرة';
  }

  let cleanCategory = r.category || 'خدمات عامة';
  const normCategory = cleanCategory.trim().toLowerCase();
  if (
    normCategory.includes('سوپر') ||
    normCategory === 'سوبرماركت' ||
    normCategory === 'سوبر ماركت' ||
    normCategory.includes('هايبر ماركت')
  ) {
    cleanCategory = 'سوبر ماركت / هايبر وبقالة';
  } else if (fullLocText.includes('الاقصى للتوكيلات') || fullLocText.includes('توكيلات تجارية')) {
    cleanCategory = 'معرض سيارات / بيع وشراء';
  }

  return {
    id: r.id,
    nameAr: rawName,
    nameEn: (r.name_en || r.nameEn || '').replace(BIDI_CONTROL_REGEX, '').trim(),
    category: cleanCategory,
    mainCategoryId: metaMainCategoryId,
    subcategoryId: metaSubcategoryId,
    services: metaServices,
    governorate: resolvedGov,
    city: rawCity,
    street: rawStreet,
    landmark: r.landmark || '',
    lat,
    lng,
    phone: r.phone || '',
    secondaryPhone: r.secondary_phone || r.secondaryPhone || '',
    whatsapp: r.whatsapp || r.phone || '',
    workingHours: r.working_hours || r.workingHours || '',
    description: typeof r.description === 'string' ? r.description.replace(BIDI_CONTROL_REGEX, '') : '',
    photos: rawPhotos,
    coverPhoto: metaCoverPhoto || (rawPhotos.length > 0 ? rawPhotos[0] : undefined),
    videos: rawVideos,
    logo: r.logo || '',
    googlePlaceId: metaGooglePlaceId || r.google_place_id || r.googlePlaceId || '',
    googleMapsUrl: cleanGoogleMapsUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined),
    customDirectoryUrl: metaCustomDirectoryUrl,
    verificationStatus: r.verification_status || r.verificationStatus || 'pending',
    publishedStatus: metaPublishedStatus || r.published_status || r.publishedStatus || 'published',
    googleSyncStatus: metaGoogleSyncStatus || r.google_sync_status || r.googleSyncStatus || 'not_synced',
    googleRatingEnabled: metaGoogleRatingEnabled !== undefined ? metaGoogleRatingEnabled : undefined,
    googleRating: metaGoogleRating !== undefined ? metaGoogleRating : undefined,
    googleReviewsCount: metaGoogleReviewsCount !== undefined ? metaGoogleReviewsCount : undefined,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    createdDate: r.created_at || r.createdDate || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || undefined,
    packageId: isFeeExempt ? 'pkg_exempt' : (r.package_id || r.packageId || 'pkg_basic'),
    packageName: isFeeExempt
      ? 'منشأة رائجة بالمنطقة (إدراج مجاني بدون رسوم)'
      : (r.package_name || r.packageName || 'باقة التوثيق الأساسي'),
    packagePrice: isFeeExempt ? 0 : (typeof r.package_price === 'number' ? r.package_price : 250),
    paymentStatus: isFeeExempt ? 'fully_paid' : (r.payment_status || r.paymentStatus || 'fully_paid'),
    isFeeExempt,
    isDeleted: metaIsDeleted,
    viewsCount: metaViewsCount,
    favoriteCount: metaFavoriteCount,
    offer: metaOffer,
    seoTitle: r.seo_title || r.seoTitle || undefined,
    seoDescription: r.seo_description || r.seoDescription || undefined,
    seoIntro: r.seo_intro || r.seoIntro || undefined,
    seoFaq: Array.isArray(r.seo_faq) ? r.seo_faq : (Array.isArray(r.seoFaq) ? r.seoFaq : undefined),
    seoStatus: r.seo_status || r.seoStatus || undefined,
    seoGeneratedAt: r.seo_generated_at || r.seoGeneratedAt || undefined,
  };
}
