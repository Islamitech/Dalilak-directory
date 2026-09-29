import { extractBusinessIdFromSlug } from './utils/directoryUrl';
import { mergeCatalog, catalogsEqual } from './services/catalogState';
import { isPublicBusiness } from './shared/publicBusiness';
import React, { useState, useEffect, startTransition } from 'react';
import { DirectoryLoadContext } from './contexts/DirectoryLoadContext';
import { Business } from './types';
import { PublicShowcase } from './components/PublicShowcase';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase, SUPABASE_REST_BASE, SUPABASE_ANON_KEY } from './services/supabaseClient';

// VERIFIED columns that exist in Supabase (whatsapp, google_maps_url, google_place_id, google_sync_status do NOT exist).
// google_maps_url, google_place_id, google_sync_status are stored in the 'notes' JSON field.
const FAST_BUSINESS_SELECT = 'id,name_ar,name_en,category,governorate,city,street,landmark,phone,secondary_phone,working_hours,description,lat,lng,package_id,package_name,package_price,verification_status,notes,created_at,cover_photo';
const SUPABASE_REST_URL = `${SUPABASE_REST_BASE}/businesses?select=${FAST_BUSINESS_SELECT}&package_id=neq.pkg_interested_lead&verification_status=eq.verified&order=created_at.desc,id.asc`;

// 🛡️ BiDi Control Characters Regex (strips \u202E, \u202B, \u200E, etc.)
const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function getSafeCacheList(list: Business[]): any[] {
  return list.map((b) => {
    const { notes, ...safeBiz } = b;
    return {
      ...safeBiz,
      // Startup cache stays intentionally small: cards only need one hosted image
      // for the first paint. The full gallery is hydrated after the UI is idle.
      photos: Array.isArray(b.photos)
        ? b.photos.filter((p: string) => typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))).slice(0, 1)
        : (b.coverPhoto && !b.coverPhoto.startsWith('data:') ? [b.coverPhoto] : []),
    };
  });
}

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly verified and published only
          return parsed
            .filter((b: any) => isPublicBusiness(b))
            .map((b: any) => ({
              ...b,
              nameAr: typeof b.nameAr === 'string' ? b.nameAr.replace(BIDI_CONTROL_REGEX, '').trim() : b.nameAr,
              nameEn: typeof b.nameEn === 'string' ? b.nameEn.replace(BIDI_CONTROL_REGEX, '').trim() : b.nameEn,
              photos: Array.isArray(b.photos) && b.photos.length > 0 ? b.photos : (b.coverPhoto ? [b.coverPhoto] : [])
            }));
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.some((b: any) => isPublicBusiness(b))) {
          return false;
        }
      }
    } catch {}
    return true; // Always true if no verified cached data exists, until Supabase responds
  });
  const [directoryLoad, setDirectoryLoad] = useState<{ pending: boolean; error: string }>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.some((b: any) => isPublicBusiness(b))) {
          return { pending: false, error: '' };
        }
      }
    } catch {}
    return { pending: true, error: '' };
  });
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('initial-loading-overlay');
    if (!overlay) return;

    // Smoothly fade out the initial loading overlay once React is mounted
    const timer = window.setTimeout(() => {
      overlay.classList.add('is-hidden');
      window.setTimeout(() => overlay.remove(), 450);
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  function mapRawToBusiness(r: any): Business {
    let metaVideos: string[] = [];
    let metaGoogleSyncStatus = r.google_sync_status;
    let metaRepLocationUrl = r.rep_location_url;
    let metaGoogleMapsUrl = r.google_maps_url;
    let metaGooglePlaceId = r.google_place_id;
    let metaIsFeeExempt = r.is_fee_exempt ?? r.isFeeExempt;
    let metaFeeExemptionReason = r.fee_exemption_reason || r.feeExemptionReason;
    let metaCoverPhoto: string | undefined = r.cover_photo || r.coverPhoto;
    let metaGoogleRatingEnabled = r.google_rating_enabled !== undefined ? Boolean(r.google_rating_enabled) : (r.googleRatingEnabled !== undefined ? Boolean(r.googleRatingEnabled) : undefined);
    let metaGoogleRating = r.google_rating !== undefined ? Number(r.google_rating) : (r.googleRating !== undefined ? Number(r.googleRating) : undefined);
    let metaGoogleReviewsCount = r.google_reviews_count !== undefined ? Number(r.google_reviews_count) : (r.googleReviewsCount !== undefined ? Number(r.googleReviewsCount) : undefined);
    let metaIsDeleted: boolean = Boolean(r.is_deleted || r.isDeleted);
    let metaViewsCount: number = Number(r.views_count ?? r.viewsCount ?? 0);
    let metaFavoriteCount: number = Number(r.favorite_count ?? r.favoriteCount ?? 0);
    let metaCustomDirectoryUrl: string | undefined = r.custom_directory_url || r.customDirectoryUrl;
    let metaMainCategoryId: string | undefined = r.main_category_id || r.mainCategoryId;
    let metaSubcategoryId: string | undefined = r.subcategory_id || r.subcategoryId;
    let metaServices: string[] = Array.isArray(r.services) ? r.services.filter((item: unknown) => typeof item === 'string') : [];
    let metaPublishedStatus: 'published' | 'draft' | 'unlisted' | undefined = undefined;

    if (typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(r.notes.trim());
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.videos)) metaVideos = parsed.videos;
          if (parsed.googleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
          if (parsed.repLocationUrl) metaRepLocationUrl = parsed.repLocationUrl;
          if (parsed.googleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
          if (parsed.googlePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
          if (parsed.customDirectoryUrl && !metaCustomDirectoryUrl) metaCustomDirectoryUrl = parsed.customDirectoryUrl;
          if (parsed.isFeeExempt !== undefined && metaIsFeeExempt === undefined) metaIsFeeExempt = parsed.isFeeExempt;
          if (parsed.feeExemptionReason && !metaFeeExemptionReason) metaFeeExemptionReason = parsed.feeExemptionReason;
          if (parsed.coverPhoto && !metaCoverPhoto) metaCoverPhoto = parsed.coverPhoto;
          if (parsed.googleRatingEnabled !== undefined && metaGoogleRatingEnabled === undefined) metaGoogleRatingEnabled = Boolean(parsed.googleRatingEnabled);
          if (parsed.googleRating !== undefined && metaGoogleRating === undefined) metaGoogleRating = Number(parsed.googleRating);
          if (parsed.googleReviewsCount !== undefined && metaGoogleReviewsCount === undefined) metaGoogleReviewsCount = Number(parsed.googleReviewsCount);
          if (parsed.isDeleted !== undefined && !metaIsDeleted) metaIsDeleted = Boolean(parsed.isDeleted);
          if (parsed.viewsCount !== undefined && !metaViewsCount) metaViewsCount = Number(parsed.viewsCount);
          if (parsed.favoriteCount !== undefined && !metaFavoriteCount) metaFavoriteCount = Number(parsed.favoriteCount);
          if (parsed.publishedStatus) metaPublishedStatus = parsed.publishedStatus;
          if (parsed.mainCategoryId && !metaMainCategoryId) metaMainCategoryId = parsed.mainCategoryId;
          if (parsed.subcategoryId && !metaSubcategoryId) metaSubcategoryId = parsed.subcategoryId;
          if (Array.isArray(parsed.services) && metaServices.length === 0) {
            metaServices = parsed.services.filter((item: unknown) => typeof item === 'string');
          }
        }
      } catch {}
    }

    const isFeeExempt = Boolean(metaIsFeeExempt || r.package_price === 0 || r.packagePrice === 0 || r.package_id === 'pkg_exempt');
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

    // 1. Rep unverified field location
    const repLocationUrl = metaRepLocationUrl || r.rep_location_url || r.repLocationUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined);

    // 2. Verified official Google Maps URL (Only valid HTTP URL, strictly not synthetic search query)
    let rawGoogleMapsUrl = metaGoogleMapsUrl || r.google_maps_url || r.googleMapsUrl || '';
    if (typeof rawGoogleMapsUrl === 'string') rawGoogleMapsUrl = rawGoogleMapsUrl.trim();
    else rawGoogleMapsUrl = '';
    const cleanGoogleMapsUrl = (rawGoogleMapsUrl && rawGoogleMapsUrl.startsWith('http') && !rawGoogleMapsUrl.includes('search/?api=1&query='))
      ? rawGoogleMapsUrl
      : undefined;

    const rawName = (r.name_ar || r.nameAr || '').replace(BIDI_CONTROL_REGEX, '').trim();
    const rawCity = (r.city || '').trim();
    const rawStreet = (r.street || '').trim();
    const fullLocText = `${rawCity} ${rawStreet} ${rawName}`.toLowerCase();

    // 🗺️ Dynamic Self-Healing: المعادي وزهراء المعادي تتبع محافظة القاهرة دائماً
    let resolvedGov = r.governorate || 'القاهرة';
    if (fullLocText.includes('زهراء المعادي') || fullLocText.includes('المعادي') || fullLocText.includes('مدينة نصر') || fullLocText.includes('التجمع')) {
      resolvedGov = 'القاهرة';
    }

    // 🏷️ Category Self-Healing: تصحيح وتوحيد الفئات الشاذة
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
      repLocationUrl,
      googlePlaceId: metaGooglePlaceId || r.google_place_id || r.googlePlaceId || '',
      googleMapsUrl: cleanGoogleMapsUrl,
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
      amountPaid: 0,
      ownerName: '',
      ownerPhone: '',
      repId: '',
      repName: '',
      packageId: isFeeExempt ? 'pkg_exempt' : (r.package_id || r.packageId || 'pkg_basic'),
      packageName: isFeeExempt ? 'منشأة رائجة بالمنطقة (إدراج مجاني بدون رسوم)' : (r.package_name || r.packageName || 'باقة التوثيق الأساسي'),
      packagePrice: isFeeExempt ? 0 : (typeof r.package_price === 'number' ? r.package_price : 250),
      paymentStatus: isFeeExempt ? 'fully_paid' : (r.payment_status || r.paymentStatus || 'fully_paid'),
      invoiceNumber: '',
      invoiceDate: '',
      isFeeExempt,
      feeExemptionReason: metaFeeExemptionReason,
      isDeleted: metaIsDeleted,
      viewsCount: metaViewsCount,
      favoriteCount: metaFavoriteCount,
    };
  }

  // Trigger brief sync toast
  function triggerSyncToast(msg: string) {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }

  useEffect(() => {
    let mounted=true;let controller:AbortController|null=null;
    let overrides=new Map<string,Business|null>();
    const commit=(snapshot:Business[],partial=false)=>{
      if(!mounted)return;
      const live=new Map(overrides);
      setBusinesses(prev=>{
        const base=partial?[...new Map([...prev,...snapshot].map(b=>[b.id,b])).values()]:snapshot;
        const next=mergeCatalog(base,live);
        return catalogsEqual(prev,next)?prev:next;
      });
    };
    async function loadBusinesses(){
      controller?.abort();const request=new AbortController();controller=request;overrides=new Map();
      setDirectoryLoad({pending:true,error:''});
      const timeout=window.setTimeout(()=>request.abort(),60000);
      try{
        let offset=0;const accumulated:Business[]=[];
        while(true){
          const size=offset===0?60:500;
          const response=await fetch(SUPABASE_REST_URL,{signal:request.signal,headers:{apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+SUPABASE_ANON_KEY,Range:offset+'-'+(offset+size-1),'Range-Unit':'items',Prefer:'count=exact'}});
          if(!response.ok)throw new Error('Directory HTTP '+response.status);
          const raw=await response.json();if(!Array.isArray(raw))throw new Error('Invalid catalog');
          if(!mounted||request.signal.aborted||controller!==request)return;
          const total=Number(response.headers.get('content-range')?.split('/')[1]||NaN);
          accumulated.push(...raw.filter(isPublicBusiness).map(mapRawToBusiness).filter(isPublicBusiness));offset+=raw.length;
          setLoading(false);
          const complete=!raw.length||(Number.isFinite(total)?offset>=total:raw.length<size);
          if(complete){commit(accumulated);setDirectoryLoad({pending:false,error:''});break;}
          commit(accumulated,true);
          if(offset>=100000)throw new Error('Catalog limit exceeded');
          await new Promise(resolve=>window.setTimeout(resolve,0));
        }
      }catch(error){if(mounted&&controller===request){setDirectoryLoad({pending:false,error:'تعذّر تحديث الأنشطة. البيانات المتاحة قد تكون غير مكتملة.'});}}
      finally{clearTimeout(timeout);if(mounted&&controller===request)setLoading(false);}
    }
    const retry=()=>{void loadBusinesses();};
    const visibility=()=>{if(!document.hidden)retry();};
    const channel=supabase.channel('dalelak-public-directory-realtime').on('postgres_changes',{event:'*',schema:'public',table:'businesses'},(payload:any)=>{
      if(!mounted)return;
      const id=payload.eventType==='DELETE'?payload.old?.id:payload.new?.id;if(!id)return;
      const row=payload.eventType==='DELETE'||!isPublicBusiness(payload.new)?null:mapRawToBusiness(payload.new);
      const value=row&&isPublicBusiness(row)?row:null;
      overrides.set(id,value);
      setBusinesses(prev=>mergeCatalog(prev,new Map([[id,value]])));
      if(value)triggerSyncToast('تم تحديث بيانات الدليل');
    }).subscribe();
    const sync=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('dalelak_data_sync_channel'):null;
    if(sync)sync.onmessage=(event)=>{if(event.data?.type==='SYNC_DATA')retry();};
    window.addEventListener('directory:retry',retry);document.addEventListener('visibilitychange',visibility);
    const interval=window.setInterval(()=>{if(!document.hidden)retry();},300000);retry();
    return()=>{mounted=false;controller?.abort();clearInterval(interval);window.removeEventListener('directory:retry',retry);document.removeEventListener('visibilitychange',visibility);void supabase.removeChannel(channel);sync?.close();};
  }, []);

  useEffect(()=>{
    try{localStorage.setItem('dalelak_directory_cache',JSON.stringify(getSafeCacheList(businesses)));}catch{}
  },[businesses]);

  // Parse direct business link, preview mode & referral code if present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/biz\/([^/?#]+)/i);
  const pathBizId = pathMatch ? extractBusinessIdFromSlug(pathMatch[1]) : '';
  const rawBizParam = urlParams.get('biz') || urlParams.get('place') || urlParams.get('b') || urlParams.get('preview') || urlParams.get('id') || pathBizId || '';
  // Extract canonical entity ID if embedded inside slug (e.g. "مطعم-أبو-خالد-biz_1788118588424" -> "biz_1788118588424")
  const idMatch = rawBizParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
  const initialBizId = idMatch ? idMatch[1] : rawBizParam;
  const isPreviewMode = urlParams.has('preview');
  const refCode = urlParams.get('ref') || urlParams.get('rep') || '';

  return (
    <ThemeProvider>
      <DirectoryLoadContext.Provider value={directoryLoad}>
      {syncToastMessage && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600/90 text-white border border-emerald-400/40 backdrop-blur-xl text-xs font-black shadow-2xl animate-fade-in transition-all"
          style={{ direction: 'rtl' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>{syncToastMessage}</span>
        </div>
      )}
      <PublicShowcase
        businesses={businesses}
        initialBizId={initialBizId}
        isPreviewMode={isPreviewMode}
        referralCode={refCode}
        loading={loading}
      />
      </DirectoryLoadContext.Provider>
    </ThemeProvider>
  );
}
