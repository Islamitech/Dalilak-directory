import React from 'react';
import {
  Utensils,
  ShoppingBasket,
  Stethoscope,
  Wrench,
  Car,
  Coffee,
} from 'lucide-react';

export interface DiscoveryCategory {
  id: string;
  label: string;
  groupId: string;
  subcategoryId?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

// 🏷️ الفئات الست الأساسية المتطابقة تماماً مع النسخة التجريبية وشاشة الموبايل
export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  {
    id: 'food',
    label: 'مطاعم ومأكولات',
    groupId: 'food',
    icon: Utensils,
  },
  {
    id: 'health',
    label: 'صحة ورعاية',
    groupId: 'health',
    icon: Stethoscope,
  },
  {
    id: 'grocery',
    label: 'تسوق وبقالة',
    groupId: 'grocery',
    icon: ShoppingBasket,
  },
  {
    id: 'services',
    label: 'خدمات منزلية',
    groupId: 'crafts',
    icon: Wrench,
  },
  {
    id: 'cafes',
    label: 'كافيهات',
    groupId: 'food',
    subcategoryId: 'cafe',
    icon: Coffee,
  },
  {
    id: 'auto',
    label: 'خدمات سيارات',
    groupId: 'automotive',
    icon: Car,
  },
];
