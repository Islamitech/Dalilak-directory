import * as fs from 'fs';
import * as path from 'path';
import { slugifyBusinessName } from '../../utils/directoryUrl.js';
import { escapeHtml } from '../../shared/lib/html.js';

export { escapeHtml };
export const slugify = slugifyBusinessName;

let cachedTemplate = '';

export function getBaseTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const distPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    try {
      cachedTemplate = fs.readFileSync(distPath, 'utf8');
      return cachedTemplate;
    } catch {
      /* fall through */
    }
  }
  const indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexPath)) {
    try {
      return fs.readFileSync(indexPath, 'utf8');
    } catch {
      return '';
    }
  }
  return '';
}

export function resolveSchemaType(category?: string): string {
  if (!category || typeof category !== 'string') return 'LocalBusiness';
  const c = category.toLowerCase();
  if (c.includes('صيدل') || c.includes('أدوي') || c.includes('علاج')) return 'Pharmacy';
  if (c.includes('مطعم') || c.includes('مأكول') || c.includes('وجب') || c.includes('مشوي') || c.includes('بيتزا') || c.includes('برجر') || c.includes('شاورما') || c.includes('أسماك')) return 'Restaurant';
  if (c.includes('كافيه') || c.includes('مقهى') || c.includes('قهو')) return 'CafeOrCoffeeShop';
  if (c.includes('أسنان')) return 'Dentist';
  if (c.includes('طبي') || c.includes('عياد') || c.includes('دكتور') || c.includes('مستشف') || c.includes('بصري')) return 'MedicalBusiness';
  if (c.includes('سيار') || c.includes('ميكانيك') || c.includes('إطار') || c.includes('زيوت') || c.includes('غسيل سيار')) return 'AutoRepair';
  if (c.includes('سوبر') || c.includes('ماركت') || c.includes('بقال') || c.includes('أغذية')) return 'GroceryStore';
  if (c.includes('حلوي') || c.includes('مخبز') || c.includes('أفران') || c.includes('فطائر')) return 'Bakery';
  if (c.includes('حلاق') || c.includes('تجميل') || c.includes('كوافير') || c.includes('صالون')) return 'BeautySalon';
  return 'LocalBusiness';
}

export function applyDocumentMeta(html: string, pageTitle: string, pageDesc: string, canonicalPageUrl: string, ogImageUrl: string): string {
  let next = html.replace(/(src|href)="\.\//g, '$1="/');
  next = next.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(pageTitle)}</title>`);
  next = next.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(pageTitle)}" />`);
  next = next.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(pageDesc)}" />`);
  next = next.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
  next = next.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`);
  next = next.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
  next = next.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
  next = next.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
  next = next.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
  next = next.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`);
  next = next.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(canonicalPageUrl)}" />`);
  next = next.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
  next = next.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />`);
  return next;
}
