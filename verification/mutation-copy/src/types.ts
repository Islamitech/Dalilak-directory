export type PaymentStatus = 'fully_paid' | 'partially_paid' | 'unpaid';

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'rejected' | 'needs_action';

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  name?: string;
  updatedAt?: string;
  isFeatured?: boolean;
  partnerStatus?: string;
  category: string;
  /** Stable taxonomy identifiers */
  mainCategoryId?: string;
  subcategoryId?: string;
  services?: string[];
  categoryClassificationConfidence?: number;
  categoryNeedsReview?: boolean;
  governorate: string;
  city: string;
  street: string;
  landmark?: string;
  phone: string;
  secondaryPhone?: string;
  whatsapp?: string;
  workingHours: string;
  description: string;
  lat: number;
  lng: number;
  photos: string[];
  videos?: string[];
  coverPhoto?: string;
  logo?: string;
  createdAt?: string;
  createdDate: string;
  packageId?: string;
  packageName?: string;
  packageTitle?: string;
  packagePrice?: number;
  paymentStatus?: PaymentStatus;
  verificationStatus: VerificationStatus;
  publishedStatus?: 'published' | 'draft' | 'unlisted';
  customDirectoryUrl?: string;
  repLocationUrl?: string;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  googleSyncStatus?: 'synced' | 'in_progress' | 'failed' | 'not_synced';
  googleSyncDate?: string;
  googleRatingEnabled?: boolean;
  googleRating?: number;
  googleReviewsCount?: number;
  isFeeExempt?: boolean;
  feeExemptionReason?: string;
  rating?: number;
  videoUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  viewsCount?: number;
  favoriteCount?: number;
  notes?: string;
  // Optional legacy database compatibility fields
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  repId?: string;
  repName?: string;
  amountPaid?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export interface PackageOption {
  id: string;
  title: string;
  price: number; // in EGP
  priceLabel?: string;
  description: string;
  features: string[];
  popular?: boolean;
}
