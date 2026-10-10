import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Pill,
  Shirt,
  Car,
  GraduationCap,
  Store,
} from 'lucide-react';

export interface CategoryVisual {
  gradient: string;
  icon: React.ReactNode;
}

type CategoryTone = 'dark' | 'light';

function categoryIcon(Icon: typeof Store, tone: CategoryTone) {
  const color = tone === 'light' ? 'text-[var(--brand-ink)]' : 'text-white';
  return <Icon className={`w-10 h-10 ${color}`} strokeWidth={1.8} />;
}

export function getCategoryVisual(categoryNameOrType?: string, tone: CategoryTone = 'dark'): CategoryVisual {
  const text = (categoryNameOrType || '').toLowerCase();

  if (
    text.includes('صيدل') ||
    text.includes('طب') ||
    text.includes('عياد') ||
    text.includes('دكتور') ||
    text.includes('مستشفى') ||
    text.includes('med') ||
    text.includes('clinic') ||
    text.includes('pharmacy')
  ) {
    return {
      gradient: 'var(--cat-grad-medical)',
      icon: categoryIcon(Pill, tone),
    };
  }

  if (
    text.includes('مطعم') ||
    text.includes('كافيه') ||
    text.includes('مقهى') ||
    text.includes('أكل') ||
    text.includes('مأكولات') ||
    text.includes('مشويات') ||
    text.includes('مخبز') ||
    text.includes('حلواني') ||
    text.includes('عصائر') ||
    text.includes('food') ||
    text.includes('cafe')
  ) {
    return {
      gradient: 'var(--cat-grad-food)',
      icon: categoryIcon(Utensils, tone),
    };
  }

  if (
    text.includes('سوبر') ||
    text.includes('ماركت') ||
    text.includes('بقالة') ||
    text.includes('خضار') ||
    text.includes('جزار') ||
    text.includes('تسوق') ||
    text.includes('متاجر') ||
    text.includes('shop') ||
    text.includes('grocery')
  ) {
    return {
      gradient: 'var(--cat-grad-shop)',
      icon: categoryIcon(ShoppingBag, tone),
    };
  }

  if (
    text.includes('ملابس') ||
    text.includes('أزياء') ||
    text.includes('موضة') ||
    text.includes('صالون') ||
    text.includes('كوافير') ||
    text.includes('تجميل') ||
    text.includes('fash') ||
    text.includes('beauty')
  ) {
    return {
      gradient: 'var(--cat-grad-fashion)',
      icon: categoryIcon(Shirt, tone),
    };
  }

  if (
    text.includes('سيار') ||
    text.includes('صيانة') ||
    text.includes('ورشة') ||
    text.includes('ميكانيك') ||
    text.includes('auto')
  ) {
    return {
      gradient: 'var(--cat-grad-auto)',
      icon: categoryIcon(Car, tone),
    };
  }

  if (
    text.includes('تعليم') ||
    text.includes('تدريب') ||
    text.includes('مدرسة') ||
    text.includes('حضانة') ||
    text.includes('مكتبة') ||
    text.includes('edu')
  ) {
    return {
      gradient: 'var(--cat-grad-edu)',
      icon: categoryIcon(GraduationCap, tone),
    };
  }

  return {
    gradient: 'var(--cat-grad-food)',
    icon: categoryIcon(Store, tone),
  };
}
