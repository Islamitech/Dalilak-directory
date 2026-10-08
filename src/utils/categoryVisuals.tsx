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

export function getCategoryVisual(categoryNameOrType?: string): CategoryVisual {
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
      gradient: 'linear-gradient(145deg, #075985, #38bdf8)',
      icon: <Pill className="w-10 h-10 text-white" strokeWidth={1.8} />,
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
      gradient: 'linear-gradient(145deg, #b45309, #f59e0b)',
      icon: <Utensils className="w-10 h-10 text-white" strokeWidth={1.8} />,
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
      gradient: 'linear-gradient(145deg, #047857, #34d399)',
      icon: <ShoppingBag className="w-10 h-10 text-white" strokeWidth={1.8} />,
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
      gradient: 'linear-gradient(145deg, #5b21b6, #a78bfa)',
      icon: <Shirt className="w-10 h-10 text-white" strokeWidth={1.8} />,
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
      gradient: 'linear-gradient(145deg, #9f1239, #fb7185)',
      icon: <Car className="w-10 h-10 text-white" strokeWidth={1.8} />,
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
      gradient: 'linear-gradient(145deg, #3730a3, #818cf8)',
      icon: <GraduationCap className="w-10 h-10 text-white" strokeWidth={1.8} />,
    };
  }

  return {
    gradient: 'linear-gradient(145deg, #b45309, #f59e0b)',
    icon: <Store className="w-10 h-10 text-white" strokeWidth={1.8} />,
  };
}
