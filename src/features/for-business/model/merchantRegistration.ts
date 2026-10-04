import { getCategoryGroupById, getSubcategoryById } from '../../../data/categoryTaxonomy';
import { getWhatsAppUrl as formatWhatsAppUrl } from '../../../shared/lib/whatsapp';

export const FOR_BUSINESS_DRAFT_KEY = 'dalelak_for_business_draft';
export const DALILAK_MERCHANT_WHATSAPP = '01556221141';

export interface MerchantDraft {
  bizName: string;
  ownerName: string;
  phone: string;
  gov: string;
  mainCategoryId: string;
  subcategoryId: string;
}

export function loadMerchantDraft(): MerchantDraft | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(FOR_BUSINESS_DRAFT_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMerchantDraft(draft: MerchantDraft): void {
  try {
    localStorage.setItem(FOR_BUSINESS_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

export function createMerchantWhatsAppMessage(draft: MerchantDraft): string {
  const selectedCategoryGroup = getCategoryGroupById(draft.mainCategoryId);
  const subcategory = getSubcategoryById(draft.subcategoryId);

  return `مرحباً دليلك 👋 أود إدراج نشاطي في المنصة:
- اسم النشاط: ${draft.bizName.trim()}
- اسم المسؤول: ${draft.ownerName.trim() || 'صاحب النشاط'}
- رقم الهاتف: ${draft.phone.trim()}
- المحافظة: ${draft.gov}
- الفئة الرئيسية: ${selectedCategoryGroup?.label || 'غير محددة'}
- النوع الفرعي: ${subcategory?.label || 'غير محدد'}
- الخدمة المطلوبة: إدراج مجاني (0 ج) بموقع Google Maps`;
}

export function getMerchantWhatsAppIntentUrl(draft: MerchantDraft): string {
  const text = createMerchantWhatsAppMessage(draft);
  return formatWhatsAppUrl(DALILAK_MERCHANT_WHATSAPP, text);
}
