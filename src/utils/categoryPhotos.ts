/**
 * صور غلاف احترافية عالية الجودة لكل فئة وتصنيف تجاري في دليلك
 * تُستخدم كخلفية افتراضية معتمدة عندما لا تتوفر صورة رسمية للمنشأة على خرائط Google
 */
const CATEGORY_DEFAULT_PHOTOS: Record<string, string> = {
  // مطاعم وكافيهات ومأكولات
  food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=480&h=360&q=70',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=480&h=360&q=70',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=480&h=360&q=70',
  
  // صحة وطب وصيدليات
  medical: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=480&h=360&q=70',
  pharmacy: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=480&h=360&q=70',
  clinic: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=480&h=360&q=70',
  
  // عناية وحلاقة وتجميل
  barber: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=480&h=360&q=70',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=480&h=360&q=70',
  
  // سوبرماركت وتجارة تجزئة
  retail: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=480&h=360&q=70',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=480&h=360&q=70',
  
  // سيارات وورش وصيانة
  auto: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=480&h=360&q=70',
  craft: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=480&h=360&q=70',
  
  // رياضة ولياقة
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=480&h=360&q=70',
  
  // شركات وخدمات مهنية
  corporate: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=480&h=360&q=70',
  real_estate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=480&h=360&q=70',
  
  // ملابس وأزياء
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=480&h=360&q=70',
  
  // أجهزة وإلكترونيات
  electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=480&h=360&q=70',

  // عام وافتراضي
  default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=480&h=360&q=70',
};

/**
 * الحصول على صورة غلاف ملائمة ومطابقة لتصنيف المنشأة عند غياب صورة Google
 */
export function getCategoryFallbackCover(categoryNameOrType?: string): string {
  if (!categoryNameOrType) return CATEGORY_DEFAULT_PHOTOS.default;
  const text = categoryNameOrType.toLowerCase();

  if (text.includes('مطعم') || text.includes('مشويات') || text.includes('أكل') || text.includes('restaurant') || text.includes('food')) {
    return CATEGORY_DEFAULT_PHOTOS.food;
  }
  if (text.includes('كافيه') || text.includes('قهوة') || text.includes('مقهى') || text.includes('cafe') || text.includes('coffee')) {
    return CATEGORY_DEFAULT_PHOTOS.cafe;
  }
  if (text.includes('مخبز') || text.includes('حلواني') || text.includes('معجنات') || text.includes('bakery')) {
    return CATEGORY_DEFAULT_PHOTOS.bakery;
  }
  if (text.includes('صيدل') || text.includes('دواء') || text.includes('pharmacy')) {
    return CATEGORY_DEFAULT_PHOTOS.pharmacy;
  }
  if (text.includes('عياد') || text.includes('طبيب') || text.includes('دكتور') || text.includes('مستشفى') || text.includes('clinic') || text.includes('doctor')) {
    return CATEGORY_DEFAULT_PHOTOS.clinic;
  }
  if (text.includes('صالون') || text.includes('كوافير') || text.includes('حلاق') || text.includes('barber') || text.includes('hair')) {
    return CATEGORY_DEFAULT_PHOTOS.barber;
  }
  if (text.includes('تجميل') || text.includes('ميكاب') || text.includes('spa') || text.includes('beauty')) {
    return CATEGORY_DEFAULT_PHOTOS.beauty;
  }
  if (text.includes('سوبر') || text.includes('ماركت') || text.includes('هايبر') || text.includes('supermarket')) {
    return CATEGORY_DEFAULT_PHOTOS.retail;
  }
  if (text.includes('خضار') || text.includes('فاكهة') || text.includes('جزار') || text.includes('بقالة') || text.includes('grocery')) {
    return CATEGORY_DEFAULT_PHOTOS.grocery;
  }
  if (text.includes('سيار') || text.includes('ميكانيك') || text.includes('ورشة') || text.includes('صيانة') || text.includes('auto') || text.includes('repair')) {
    return CATEGORY_DEFAULT_PHOTOS.auto;
  }
  if (text.includes('جيم') || text.includes('رياضة') || text.includes('لياقة') || text.includes('gym') || text.includes('fitness')) {
    return CATEGORY_DEFAULT_PHOTOS.gym;
  }
  if (text.includes('ملابس') || text.includes('أزياء') || text.includes('بوتيك') || text.includes('fashion') || text.includes('clothing')) {
    return CATEGORY_DEFAULT_PHOTOS.fashion;
  }
  if (text.includes('إلكترون') || text.includes('موبايل') || text.includes('كمبيوتر') || text.includes('electronics')) {
    return CATEGORY_DEFAULT_PHOTOS.electronics;
  }
  if (text.includes('عقار') || text.includes('مكتب') || text.includes('شركة') || text.includes('خدمات') || text.includes('corporate') || text.includes('real_estate')) {
    return CATEGORY_DEFAULT_PHOTOS.corporate;
  }

  return CATEGORY_DEFAULT_PHOTOS.default;
}

/**
 * فحص صحة وصلاحية رابط الصورة واستبعاد الروابط المعطلة أو التالفة
 */
export function isValidPhotoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.startsWith('data:')) return false;
  // A Places media URL carries the API key and is billed on every view.
  if (trimmed.includes('places.googleapis.com')) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function rememberPhoto(url: string | null | undefined, real: string[], stock: string[]): void {
  if (!isValidPhotoUrl(url)) return;
  const trimmed = url!.trim();
  if (real.includes(trimmed) || stock.includes(trimmed)) return;
  if (trimmed.includes('images.unsplash.com')) stock.push(trimmed);
  else real.push(trimmed);
}

/** Photos the screen can show. Skips Places API links. A real photo wins over a stock image. */
export function collectDisplayPhotos(
  photos?: readonly (string | null | undefined)[] | null,
  coverPhoto?: string | null
): string[] {
  const real: string[] = [];
  const stock: string[] = [];
  rememberPhoto(coverPhoto, real, stock);
  for (const photo of photos || []) rememberPhoto(photo, real, stock);
  return real.length > 0 ? real : stock;
}

/** Real photos only. Stock illustrations stay out of the directory cards. */
export function collectRealPhotos(
  photos?: readonly (string | null | undefined)[] | null,
  coverPhoto?: string | null
): string[] {
  return collectDisplayPhotos(photos, coverPhoto).filter((src) => !src.includes('images.unsplash.com'));
}
