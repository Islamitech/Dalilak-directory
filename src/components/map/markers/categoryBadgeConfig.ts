export interface CategoryBadgeConfig {
  bg: string;
  borderColor: string;
  iconSvg: string;
}

export function getCategoryBadgeConfig(category: string = ''): CategoryBadgeConfig {
  const cat = (category || '').toLowerCase();

  if (
    cat.includes('مطاعم') || cat.includes('مطعم') || cat.includes('كافيه') ||
    cat.includes('مقهى') || cat.includes('أكل') || cat.includes('مأكولات') ||
    cat.includes('حلويات') || cat.includes('مخبز') || cat.includes('مشويات') || cat.includes('عصائر')
  ) {
    return {
      bg: '#f59e0b',
      borderColor: '#fbbf24',
      iconSvg: '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v19M5 2v4a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3V2M8 9v12"/>',
    };
  }

  if (
    cat.includes('سوبر') || cat.includes('ماركت') || cat.includes('بقالة') ||
    cat.includes('تموين') || cat.includes('هايبر') || cat.includes('خضروات') ||
    cat.includes('لحوم') || cat.includes('جزارة') || cat.includes('فواكه')
  ) {
    return {
      bg: '#10b981',
      borderColor: '#34d399',
      iconSvg:
        '<circle cx="8" cy="21" r="1.5" fill="#ffffff"/><circle cx="19" cy="21" r="1.5" fill="#ffffff"/><path d="M2.5 2.5h2.5l2.4 12a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 1.9-1.5l1.6-7.5H5.4"/>',
    };
  }

  if (
    cat.includes('صيدل') || cat.includes('طبي') || cat.includes('عياد') ||
    cat.includes('مستشفى') || cat.includes('علاج') || cat.includes('أسنان') ||
    cat.includes('صحة') || cat.includes('تحاليل') || cat.includes('أشعة')
  ) {
    return {
      bg: '#0284c7',
      borderColor: '#38bdf8',
      iconSvg: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
    };
  }

  if (
    cat.includes('ملابس') || cat.includes('أزياء') || cat.includes('فاشون') ||
    cat.includes('أحذية') || cat.includes('موضة') || cat.includes('عبايات') || cat.includes('بدل')
  ) {
    return {
      bg: '#8b5cf6',
      borderColor: '#a78bfa',
      iconSvg:
        '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    };
  }

  if (
    cat.includes('سيار') || cat.includes('صيانة') || cat.includes('مركبات') ||
    cat.includes('أوتو') || cat.includes('كاوتش') || cat.includes('ميكانيك') || cat.includes('زيوت')
  ) {
    return {
      bg: '#f43f5e',
      borderColor: '#fb7185',
      iconSvg:
        '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="1.8" fill="#ffffff"/><path d="M9 17h6"/><circle cx="17" cy="17" r="1.8" fill="#ffffff"/>',
    };
  }

  return {
    bg: '#6366f1',
    borderColor: '#818cf8',
    iconSvg:
      '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2ZM18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2ZM10 6h4M10 10h4M10 14h4M10 18h4"/>',
  };
}
