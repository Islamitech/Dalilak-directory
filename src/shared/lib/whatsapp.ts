import { cleanPhoneForWhatsApp } from './phone';

/**
 * 💬 Official Dalilak Business WhatsApp Number
 */
export const OFFICIAL_SALES_PHONE = '201007788481';

/**
 * Constructs a secure wa.me chat link with optional pre-filled message text.
 */
export function getWhatsAppUrl(phone?: string | null, message?: string | null): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return '';
  const baseUrl = `https://wa.me/${cleanPhone}`;
  if (!message || !message.trim()) return baseUrl;
  return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Generates an official WhatsApp onboarding / sales inquiry link
 */
export function getOfficialSalesWhatsAppUrl(customText?: string): string {
  const defaultText = 'مرحباً، أود الاستفسار عن باقات التوثيق والاشتراك في منصة دليلك حدائق الأهرام';
  const text = customText?.trim() || defaultText;
  return `https://wa.me/${OFFICIAL_SALES_PHONE}?text=${encodeURIComponent(text)}`;
}
