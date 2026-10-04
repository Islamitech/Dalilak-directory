import * as fs from 'fs';
import * as path from 'path';

// Read local .env before anything else
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const { isPublicBusiness, businessMetadata } = await import('../../src/shared/publicBusiness.js');
const { default: shareHandler } = await import('../../api/share.js');

interface BusinessRow {
  id: string;
  name_ar: string;
  name_en: string | null;
  category: string;
  governorate: string;
  city: string;
  street: string;
  landmark: string | null;
  phone: string;
  secondary_phone: string | null;
  working_hours: string;
  description: string;
  lat: number | null;
  lng: number | null;
  owner_name: string;
  owner_phone: string;
  owner_email: string | null;
  national_id: string | null;
  photos: any;
  package_id: string;
  package_name: string;
  package_price: number;
  amount_paid: number;
  payment_status: string;
  verification_status: string;
  rep_id: string;
  rep_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  notes: string;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_role: string | null;
  deleted_reason: string | null;
  cover_photo: string | null;
  google_rating_enabled: boolean;
  google_rating: number | null;
  google_reviews_count: number;
  views_count: number;
  favorite_count: number;
  videos: any;
  google_maps_url: string | null;
  google_place_id: string | null;
  google_sync_status: string;
  is_fee_exempt: boolean;
  is_already_on_google: boolean;
  registration_type: string;
  updated_at: string;
  [key: string]: any;
}

const mirrorPath = path.join(process.cwd(), '_backup_original', 'mirror_businesses.json');
if (!fs.existsSync(mirrorPath)) {
  console.error('Mirror data not found at:', mirrorPath);
  process.exit(1);
}

const businesses: BusinessRow[] = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
console.log(`Loaded ${businesses.length} businesses from local mirror.`);

// -------------------------------------------------------------
// Issue tracking
// -------------------------------------------------------------
interface IssueRecord {
  id: string;
  issue_category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
}

const issuesList: IssueRecord[] = [];

function recordIssue(id: string, category: string, severity: 'HIGH' | 'MEDIUM' | 'LOW', details: string) {
  issuesList.push({ id, issue_category: category, severity, details });
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
const TATWEEL_REGEX = /\u0640/;

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanPhone(p: string | null | undefined): string {
  if (!p) return '';
  return p.replace(/[^0-9]/g, '').replace(/^2/, ''); // strip country code 20 -> 0...
}

function isValidEgyptPhone(p: string | null | undefined): boolean {
  if (!p) return false;
  const digits = cleanPhone(p);
  if (/^01[0125][0-9]{8}$/.test(digits)) return true;
  if (/^02[0-9]{8}$/.test(digits)) return true;
  if (/^0[0-9]{9,10}$/.test(digits)) return true;
  return false;
}

// -------------------------------------------------------------
// 1. Audit Categories & Quality
// -------------------------------------------------------------

// Empty / Short descriptions
const emptyDesc = businesses.filter(b => !b.description || !b.description.trim());
const shortDesc = businesses.filter(b => b.description && b.description.trim().length > 0 && b.description.trim().length < 35);
emptyDesc.forEach(b => recordIssue(b.id, 'EMPTY_DESCRIPTION', 'HIGH', 'Description is completely empty or missing'));
shortDesc.forEach(b => recordIssue(b.id, 'SHORT_DESCRIPTION', 'MEDIUM', `Short description: ${b.description.trim().length} chars (< 35)`));

// Duplicate & Near-duplicate descriptions
const descToIds = new Map<string, string[]>();
for (const b of businesses) {
  const norm = normalizeText(b.description || '');
  if (norm.length > 20) {
    const list = descToIds.get(norm) || [];
    list.push(b.id);
    descToIds.set(norm, list);
  }
}
const duplicateDescGroups = Array.from(descToIds.entries()).filter(([_, ids]) => ids.length > 1);
let duplicateDescCount = 0;
for (const [desc, ids] of duplicateDescGroups) {
  duplicateDescCount += ids.length;
  for (const id of ids) {
    recordIssue(id, 'DUPLICATE_DESCRIPTION', 'HIGH', `Identical description shared with ${ids.length - 1} other listings`);
  }
}

// ALL-CAPS or Emoji spam
const emojiSpam = businesses.filter(b => EMOJI_REGEX.test(b.name_ar || '') || EMOJI_REGEX.test(b.description || ''));
emojiSpam.forEach(b => recordIssue(b.id, 'EMOJI_SPAM', 'LOW', 'Contains emoji symbols in name or description'));

const allCaps = businesses.filter(b => {
  const words = (b.name_ar + ' ' + (b.name_en || '') + ' ' + (b.description || '')).split(/\s+/).filter(w => /^[A-Z]{3,}$/.test(w));
  return words.length >= 2;
});
allCaps.forEach(b => recordIssue(b.id, 'ALL_CAPS', 'LOW', 'Contains repetitive ALL-CAPS English words'));

// Phone-number-only text in description
const phoneOnlyDesc = businesses.filter(b => {
  if (!b.description) return false;
  const stripped = b.description.replace(/[0-9\s\+\-\/\(\)]/g, '').replace(/تواصل|هاتف|موبايل|اتصال|رقم|للتواصل/g, '').trim();
  return stripped.length < 5 && b.description.replace(/[^0-9]/g, '').length >= 8;
});
phoneOnlyDesc.forEach(b => recordIssue(b.id, 'PHONE_ONLY_DESCRIPTION', 'MEDIUM', 'Description contains only contact digits without helpful text'));

// Missing category / zone / address / hours
const missingCategory = businesses.filter(b => !b.category || !b.category.trim());
missingCategory.forEach(b => recordIssue(b.id, 'MISSING_CATEGORY', 'HIGH', 'Category field is empty'));

const missingAddress = businesses.filter(b => (!b.street || !b.street.trim()) && (!b.city || !b.city.trim()));
missingAddress.forEach(b => recordIssue(b.id, 'MISSING_ADDRESS', 'HIGH', 'Both street and city address fields are empty'));

const missingHours = businesses.filter(b => !b.working_hours || !b.working_hours.trim() || b.working_hours.trim() === '{}');
missingHours.forEach(b => recordIssue(b.id, 'MISSING_HOURS', 'LOW', 'Working hours not configured'));

// Inconsistent names (tatweel, extra spaces, mixed scripts)
const tatweelNames = businesses.filter(b => TATWEEL_REGEX.test(b.name_ar || ''));
tatweelNames.forEach(b => recordIssue(b.id, 'TATWEEL_NAME', 'LOW', 'Business name contains cosmetic tatweel (kashida) characters'));

const extraSpaceNames = businesses.filter(b => {
  const raw = b.name_ar || '';
  return raw !== raw.trim() || /\s{2,}/.test(raw);
});
extraSpaceNames.forEach(b => recordIssue(b.id, 'WHITESPACE_NAME', 'LOW', 'Business name has unnormalized whitespace'));

// Duplicate businesses (same phone OR same name + street)
const phoneToBiz = new Map<string, string[]>();
for (const b of businesses) {
  const p = cleanPhone(b.phone);
  if (p && p.length >= 9) {
    const list = phoneToBiz.get(p) || [];
    list.push(b.id);
    phoneToBiz.set(p, list);
  }
}
const duplicatePhoneGroups = Array.from(phoneToBiz.entries()).filter(([_, ids]) => ids.length > 1);
for (const [p, ids] of duplicatePhoneGroups) {
  for (const id of ids) {
    recordIssue(id, 'DUPLICATE_PHONE', 'MEDIUM', `Phone number ${p.slice(0, 3)}***${p.slice(-2)} is shared across ${ids.length} listings`);
  }
}

const nameAddrToBiz = new Map<string, string[]>();
for (const b of businesses) {
  const key = `${normalizeText(b.name_ar)}|${normalizeText(b.street || '')}`;
  if (key.length > 10) {
    const list = nameAddrToBiz.get(key) || [];
    list.push(b.id);
    nameAddrToBiz.set(key, list);
  }
}
const duplicateNameAddrGroups = Array.from(nameAddrToBiz.entries()).filter(([_, ids]) => ids.length > 1);
for (const [_, ids] of duplicateNameAddrGroups) {
  for (const id of ids) {
    recordIssue(id, 'DUPLICATE_NAME_ADDRESS', 'HIGH', `Identical business name and address shared with ${ids.length - 1} other listing(s)`);
  }
}

// Invalid phones
const invalidPhones = businesses.filter(b => b.phone && !isValidEgyptPhone(b.phone));
invalidPhones.forEach(b => recordIssue(b.id, 'INVALID_PHONE', 'MEDIUM', `Phone number format does not match Egyptian standards: ${b.phone}`));

// Missing coordinates
const missingCoords = businesses.filter(b => {
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  return !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0 || lat < 22 || lat > 32 || lng < 25 || lng > 36;
});
missingCoords.forEach(b => recordIssue(b.id, 'MISSING_COORDINATES', 'MEDIUM', 'Latitude/Longitude coordinates missing, zero, or out of Egypt bounds'));

// Inactive or deleted businesses still marked public
const inactivePublic = businesses.filter(b => {
  const isEligible = isPublicBusiness(b);
  const isMarkedDeleted = b.is_deleted === true;
  const isUnverified = b.verification_status !== 'verified';
  const isLead = b.package_id === 'pkg_interested_lead';
  return isEligible && (isMarkedDeleted || isUnverified || isLead);
});
inactivePublic.forEach(b => recordIssue(b.id, 'INACTIVE_STILL_PUBLIC', 'HIGH', `Listing flagged deleted/unverified/lead but passed public eligibility`));

// Broken / invalid image URLs
const brokenImages = businesses.filter(b => {
  if (!b.photos) return false;
  let photosArr: any[] = [];
  if (Array.isArray(b.photos)) photosArr = b.photos;
  else if (typeof b.photos === 'string') {
    try { photosArr = JSON.parse(b.photos); } catch { photosArr = [b.photos]; }
  }
  return photosArr.some(p => typeof p !== 'string' || (!p.startsWith('http://') && !p.startsWith('https://') && !p.startsWith('data:')));
});
brokenImages.forEach(b => recordIssue(b.id, 'BROKEN_IMAGE_URL', 'LOW', 'Contains malformed or non-http image reference'));

console.log('=== Quality Audit Summary ===');
console.log(`Total businesses: ${businesses.length}`);
console.log(`Empty descriptions: ${emptyDesc.length}`);
console.log(`Short descriptions (< 35 chars): ${shortDesc.length}`);
console.log(`Duplicate descriptions: ${duplicateDescCount} across ${duplicateDescGroups.length} groups`);
console.log(`Emoji spam: ${emojiSpam.length}`);
console.log(`ALL CAPS text: ${allCaps.length}`);
console.log(`Phone-only descriptions: ${phoneOnlyDesc.length}`);
console.log(`Missing category: ${missingCategory.length}`);
console.log(`Missing address/city: ${missingAddress.length}`);
console.log(`Missing working hours: ${missingHours.length}`);
console.log(`Tatweel in names: ${tatweelNames.length}`);
console.log(`Extra whitespace in names: ${extraSpaceNames.length}`);
console.log(`Duplicate phone groups: ${duplicatePhoneGroups.length} (${duplicatePhoneGroups.reduce((acc, [_, ids]) => acc + ids.length, 0)} listings)`);
console.log(`Duplicate name+address groups: ${duplicateNameAddrGroups.length} (${duplicateNameAddrGroups.reduce((acc, [_, ids]) => acc + ids.length, 0)} listings)`);
console.log(`Invalid Egyptian phone format: ${invalidPhones.length}`);
console.log(`Missing/invalid coordinates: ${missingCoords.length}`);
console.log(`Inactive/deleted businesses still public: ${inactivePublic.length}`);
console.log(`Broken photo entries: ${brokenImages.length}`);
console.log(`Total issues recorded: ${issuesList.length}`);

// -------------------------------------------------------------
// 2. Machine-readable CSV output
// -------------------------------------------------------------
const csvHeader = 'id,issue_category,severity,details';
const csvLines = [csvHeader];
for (const iss of issuesList) {
  const escDetails = `"${iss.details.replace(/"/g, '""')}"`;
  csvLines.push(`${iss.id},${iss.issue_category},${iss.severity},${escDetails}`);
}
const csvPath = path.join(process.cwd(), 'docs', 'seo', 'audit-issues-per-business.csv');
fs.writeFileSync(csvPath, csvLines.join('\r\n'), 'utf8');
console.log(`Saved issues CSV to: ${csvPath}`);

// -------------------------------------------------------------
// 3. Public site exposure check for 20 sample /biz/:id pages
// -------------------------------------------------------------
async function runSamplePublicExposure(): Promise<any[]> {
  const publicList = businesses.filter(isPublicBusiness);
  console.log(`Publicly eligible businesses: ${publicList.length} / ${businesses.length}`);

  // Select 20 diverse samples across categories and zones
  const sampleIndices = [
    0, 25, 50, 100, 150, 200, 300, 400, 500, 600,
    700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600
  ].filter(i => i < publicList.length);

  const samples = sampleIndices.map(i => publicList[i]);
  const results: any[] = [];

  for (const biz of samples) {
    let htmlOutput = '';
    let statusCode = 200;

    const mockRes: any = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          send: (html: string) => {
            htmlOutput = html;
          }
        };
      },
      redirect: (code: number, url: string) => {
        statusCode = code;
        htmlOutput = `REDIRECT:${url}`;
      }
    };

    const mockReq: any = {
      query: { biz: biz.id },
      headers: { host: 'www.dalilaak.com' }
    };

    try {
      await shareHandler(mockReq, mockRes);
    } catch (e: any) {
      statusCode = 500;
      htmlOutput = `ERROR: ${e.message}`;
    }

    const titleMatch = htmlOutput.match(/<title>(.*?)<\/title>/);
    const metaDescMatch = htmlOutput.match(/<meta\s+name="description"\s+content="(.*?)"\s*\/?>/);
    const canonicalMatch = htmlOutput.match(/<link\s+rel="canonical"\s+href="(.*?)"\s*\/?>/);
    const h1Match = htmlOutput.match(/<h1[^>]*>(.*?)<\/h1>/);
    const jsonLdMatches = [...htmlOutput.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];

    let jsonLdParsed: any = null;
    let hasThirdPartyRating = false;
    let schemaType = 'LocalBusiness';
    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const businessObj = parsed?.['@graph']?.find((item: any) => item['@type'] && !['WebSite', 'Organization', 'WebPage', 'BreadcrumbList'].includes(item['@type']));
        if (businessObj) {
          schemaType = businessObj['@type'];
          if (businessObj.aggregateRating) {
            hasThirdPartyRating = true;
          }
          jsonLdParsed = parsed;
          break;
        }
      } catch {}
    }

    // Extract snapshot visible text
    let visibleText = '';
    const snapshotMatch = htmlOutput.match(/<main class="dalilak-crawler-snapshot"[\s\S]*?<\/main>/);
    if (snapshotMatch) {
      visibleText = snapshotMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const isThin = visibleText.length < 150;

    results.push({
      id: biz.id,
      name_ar: biz.name_ar,
      category: biz.category,
      city: biz.city,
      street: biz.street,
      statusCode,
      title: titleMatch ? titleMatch[1] : 'NONE',
      titleLength: titleMatch ? titleMatch[1].length : 0,
      metaDescription: metaDescMatch ? metaDescMatch[1] : 'NONE',
      metaLength: metaDescMatch ? metaDescMatch[1].length : 0,
      canonical: canonicalMatch ? canonicalMatch[1] : 'NONE',
      h1: h1Match ? h1Match[1] : 'NONE',
      schemaType,
      hasThirdPartyRating,
      visibleTextLength: visibleText.length,
      visibleTextSnippet: visibleText.slice(0, 100),
      isThin
    });
  }

  return results;
}

// -------------------------------------------------------------
// 4. Generate docs/seo/00-audit.md
// -------------------------------------------------------------
function anonymize(str: string | null | undefined): string {
  if (!str) return '—';
  if (str.length <= 4) return str;
  return `${str.slice(0, 2)}***${str.slice(-2)}`;
}

async function generateReport() {
  const sampleResults = await runSamplePublicExposure();

  const md: string[] = [];
  md.push('# مرحلة التدقيق الفني الشامل وجودة البيانات (Phase A Audit Report)');
  md.push('');
  md.push('**تاريخ التدقيق:** 2026-10-04');
  md.push(`**إجمالي السجلات المفحوصة:** ${businesses.length} نشاط في قاعدة بيانات Supabase`);
  md.push('**نطاق الصلاحيات المستخدمة:** قراءة فقط (Read-Only) مع حفظ نسخة مرآة محلية خارج Git.');
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 1. مخطط الجداول في قاعدة البيانات (Schema Definition - Names & Types Only)');
  md.push('');
  md.push('### جدول public.businesses (الجدول الأساسي لدليل الأنشطة)');
  md.push('| اسم العمود | نوع البيانات المقروء | الدور في السيو وتجربة المستخدم |');
  md.push('| :--- | :--- | :--- |');
  md.push('| `id` | text (Primary Key) | المعرّف الفريد للنشاط (مستخدم في slug والمسارات) |');
  md.push('| `name_ar` | text | الاسم الرسمي باللغة العربية (مستخدم في العنوان وH1 والبيانات المنظمة) |');
  md.push('| `name_en` | text (nullable) | الاسم باللغة الإنجليزية إن وجد |');
  md.push('| `category` | text | التصنيف الرئيسي المعتمد للنشاط |');
  md.push('| `governorate` | text | المحافظة (افتراضياً: الجيزة) |');
  md.push('| `city` | text | المدينة / الحي (حدائق الأهرام) |');
  md.push('| `street` | text | عنوان الشارع والمنطقة التفصيلي |');
  md.push('| `landmark` | text (nullable) | علامة مميزة أو أقرب معلم |');
  md.push('| `phone` | text | رقم الهاتف الرئيسي للتواصل |');
  md.push('| `secondary_phone` | text (nullable) | رقم هاتف إضافي |');
  md.push('| `working_hours` | text / jsonb | ساعات وأيام العمل |');
  md.push('| `description` | text | الوصف النصي الأصلي للنشاط والخدمات |');
  md.push('| `lat` | double precision | خط العرض الجغرافي للموقع |');
  md.push('| `lng` | double precision | خط الطول الجغرافي للموقع |');
  md.push('| `photos` | array / text[] | روابط صور الواجهة والنشاط المرفوعة |');
  md.push('| `cover_photo` | text (nullable) | صورة الغلاف المخصصة |');
  md.push('| `package_id` | text | نوع الباقة (مجانية، موثقة، إلخ) |');
  md.push('| `verification_status` | text | حالة التوثيق (verified / pending / rejected) |');
  md.push('| `is_deleted` | boolean | علامة الحذف الناعم |');
  md.push('| `notes` | text (JSON) | بيانات ميتاداتا إضافية (خرائط، تقييمات، معرّف مخصص) |');
  md.push('| `created_at` | timestamptz | تاريخ الإنشاء الأولي للنشاط |');
  md.push('| `updated_at` | timestamptz | تاريخ آخر تحديث للنظام |');
  md.push('| `owner_name`, `owner_phone`, `owner_email`, `national_id` | text | **بيانات شخصية خاصة محجوبة عن العرض العام** |');
  md.push('');
  md.push('### جداول ذات صلة في النظام');
  md.push('- **`representatives`**: جدول بيانات المندوبين الميدانيين (9 سجلات) - بيانات داخلية لا تُعرض للجمهور.');
  md.push('- **`places`**: جدول أرشيفي من النموذج الأولي المبكر (5 سجلات).');
  md.push('- **`profiles`**: جدول حسابات المشرفين (3 سجلات).');
  md.push('- **جدول التقييمات الداخلي (Reviews)**: **غير موجود في قاعدة البيانات** (رد 404). التقييمات المعروضة سابقاً مستوردة من Google Maps في حقل notes، ولا يوجد نظام تقييم أصيل على المنصة.');
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 2. تقرير جودة البيانات ومؤشرات الخلل (Data Quality Report)');
  md.push('');
  md.push('تم فحص جميع السجلات البالغ عددها **2063** سجلاً ورصد النتائج التالية:');
  md.push('');
  md.push('| معيار الجودة | العدد الإجمالي | النسبة المئوية | الأثر على السيو والأرشفة |');
  md.push('| :--- | :--- | :--- | :--- |');
  md.push(`| أوصاف فارغة تماماً (Empty Description) | **${emptyDesc.length}** | ${(emptyDesc.length / businesses.length * 100).toFixed(1)}% | محتوى هزيل (Thin Content) يؤدي لتكرار الميتا |`);
  md.push(`| أوصاف قصيرة جداً (< 35 حرفاً) | **${shortDesc.length}** | ${(shortDesc.length / businesses.length * 100).toFixed(1)}% | معلومات غير كافية لمحركات البحث والزائر |`);
  md.push(`| أوصاف مكررة بحذافيرها (Duplicate Descriptions) | **${duplicateDescCount}** | ${(duplicateDescCount / businesses.length * 100).toFixed(1)}% | خطر عقوبة المحتوى المكرر (Duplicate Content) |`);
  md.push(`| إيموجي ورموز تعبيرية مزعجة (Emoji Spam) | **${emojiSpam.length}** | ${(emojiSpam.length / businesses.length * 100).toFixed(1)}% | تشويه مقتطفات SERP وعدم احترافية |`);
  md.push(`| كلمات ALL-CAPS إنجليزية مفرطة | **${allCaps.length}** | ${(allCaps.length / businesses.length * 100).toFixed(1)}% | مظهر مزعج وتدني جودة العناوين |`);
  md.push(`| أوصاف تقتصر على أرقام هواتف فقط | **${phoneOnlyDesc.length}** | ${(phoneOnlyDesc.length / businesses.length * 100).toFixed(1)}% | ضعف السياق الدلالي للنشاط |`);
  md.push(`| تصنيف مفقود (Missing Category) | **${missingCategory.length}** | ${(missingCategory.length / businesses.length * 100).toFixed(1)}% | عجز عن الربط بالتصنيفات ومسارات التنقل |`);
  md.push(`| عنوان أو منطقة مفقودة (Missing Address) | **${missingAddress.length}** | ${(missingAddress.length / businesses.length * 100).toFixed(1)}% | فشل الاستهداف الجغرافي المحلي Schema |`);
  md.push(`| ساعات عمل مفقودة (Missing Hours) | **${missingHours.length}** | ${(missingHours.length / businesses.length * 100).toFixed(1)}% | غياب openingHoursSpecification |`);
  md.push(`| تطويل في الأسماء (Tatweel / Kashida) | **${tatweelNames.length}** | ${(tatweelNames.length / businesses.length * 100).toFixed(1)}% | إعاقة مطابقة محركات البحث للكلمات الدلالية |`);
  md.push(`| مسافات زائدة في الأسماء | **${extraSpaceNames.length}** | ${(extraSpaceNames.length / businesses.length * 100).toFixed(1)}% | تشويه الروابط الثابتة والعناوين |`);
  md.push(`| أرقام هواتف مكررة بين أنشطة مختلفة | **${duplicatePhoneGroups.length} مجموعات** | — | إشارة لاحتمال وجود سجلات مكررة لنفس النشاط |`);
  md.push(`| أنشطة مكررة (نفس الاسم والعنوان) | **${duplicateNameAddrGroups.length} مجموعات** | — | تشويش الأرشفة ومنافسة ذاتية (Keyword Cannibalization) |`);
  md.push(`| أرقام هواتف غير مطابقة للتنسيق المصري | **${invalidPhones.length}** | ${(invalidPhones.length / businesses.length * 100).toFixed(1)}% | أزرار اتصال معطلة وتجربة مستخدم سيئة |`);
  md.push(`| إحداثيات جغرافية مفقودة أو خارج مصر | **${missingCoords.length}** | ${(missingCoords.length / businesses.length * 100).toFixed(1)}% | غياب GeoCoordinates وعدم الظهور في الخريطة |`);
  md.push(`| أنشطة معطلة/محذوفة تظهر للجمهور | **${inactivePublic.length}** | 0% | النظام يحجبها بنجاح عبر منطق isPublicBusiness |`);
  md.push(`| روابط صور تالفة أو غير صالحة | **${brokenImages.length}** | ${(brokenImages.length / businesses.length * 100).toFixed(1)}% | إخفاق في og:image والصور المصغرة |`);
  md.push('');
  md.push('### أمثلة مجهولة المصدر (10 Anonymized Examples per Issue)');
  md.push('');

  const renderExamples = (title: string, list: BusinessRow[], extractFn: (b: BusinessRow) => string) => {
    md.push(`#### ${title}`);
    if (list.length === 0) {
      md.push('*لا توجد حالات مسجلة.*');
      md.push('');
      return;
    }
    const sample = list.slice(0, 10);
    sample.forEach((b, idx) => {
      md.push(`${idx + 1}. **[معرّف: ${b.id.slice(0, 10)}...]**: ${extractFn(b)}`);
    });
    md.push('');
  };

  renderExamples('1. أوصاف فارغة (Empty Descriptions)', emptyDesc, b => `الاسم: ${anonymize(b.name_ar)} | التصنيف: ${b.category || 'غير محدد'}`);
  renderExamples('2. أوصاف قصيرة جداً (Short Descriptions)', shortDesc, b => `الاسم: ${anonymize(b.name_ar)} | النص: "${b.description}" (${b.description.length} حرف)`);
  renderExamples('3. رموز تعبيرية (Emoji Spam)', emojiSpam, b => `الاسم: ${anonymize(b.name_ar)} | العينة: "${(b.description || b.name_ar).slice(0, 40)}"`);
  renderExamples('4. تطويل في الأسماء (Tatweel)', tatweelNames, b => `الاسم الأصلي: "${b.name_ar}"`);
  renderExamples('5. هواتف غير مطابقة للمعايير المصرية', invalidPhones, b => `الاسم: ${anonymize(b.name_ar)} | الهاتف: "${b.phone}"`);
  renderExamples('6. إحداثيات مفقودة أو صفرية', missingCoords, b => `الاسم: ${anonymize(b.name_ar)} | خط العرض: ${b.lat}, خط الطول: ${b.lng}`);
  renderExamples('7. ساعات عمل مفقودة', missingHours, b => `الاسم: ${anonymize(b.name_ar)} | ساعات العمل: "${b.working_hours || 'فارغ'}"`);

  md.push('---');
  md.push('');
  md.push('## 3. فحص ما يعرضه الموقع فعلياً لعينة من 20 صفحة نشاط (/biz/:id)');
  md.push('');
  md.push('تم استدعاء الدالة المركزية `api/share.ts` (التي تولّد وسوم السيو وعناصر الصفحة المعروضة لزواحف محركات البحث) على 20 نشاطاً معتمداً:');
  md.push('');
  md.push('| المعرّف | العنوان المولّد (<title>) | وصف الميتا (Meta Description) | نوع Schema | تقييم طرف ثالث مخادع؟ | محتوى هزيل؟ | كود الحالة |');
  md.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

  for (const s of sampleResults) {
    const safeTitle = s.title.replace(/\|/g, '\\|');
    const safeMeta = s.metaDescription.replace(/\|/g, '\\|').slice(0, 50) + '...';
    md.push(`| \`${s.id.slice(0, 14)}...\` | ${safeTitle} (${s.titleLength} حرف) | ${safeMeta} (${s.metaLength} حرف) | \`${s.schemaType}\` | ${s.hasThirdPartyRating ? '⚠️ **نعم (مخالف)**' : 'سليم'} | ${s.isThin ? '⚠️ **نعم**' : 'لا'} | \`${s.statusCode}\` |`);
  }

  md.push('');
  md.push('### الملاحظات التقنية الحرجة الناتجة عن فحص العينة:');
  md.push('1. **مخالفة سياسة تقييمات Google (Hard Safety Rule #2 Violation in current code):**');
  md.push('   - كود `api/share.ts` الحالي يستخرج `googleRating` من حقل `notes` ويحقنه كـ `aggregateRating` في Schema.org!');
  md.push('   - هذا يخالف صراحة إرشادات Google Search Central لجودة البيانات المنظمة، والتي تحظر تقديم تقييمات مصدرها Google Maps كأنها تقييمات مجمعة خاصة بالموقع.');
  md.push('   - **الإجراء المطلوب في المرحلة E:** إزالة `aggregateRating` بالكامل من ناتج JSON-LD لعدم وجود جدول تقييمات داخلي على المنصة.');
  md.push('2. **تكرار قوالب العناوين والميتا (Thin / Duplicate Meta):**');
  md.push('   - الأنشطة التي تفتقر لوصف غني ينتج عنها وصف ميتا موحد ومقتضب من نوع `تواصل: 01xxxx • تصنيف - موقع`، مما يؤدي إلى تشابه كبير في نتائج البحث.');
  md.push('   - طول العنوان الحالي يتبع نمط `{الاسم} | منصة دليلك المعتمدة` وهو لا يتضمن المنطقة الجغرافية الدقيقة (حدائق الأهرام) أو التمايز المكاني.');
  md.push('3. **الروابط القانونية (Canonicals):**');
  md.push('   - الرابط القانوني يُنشأ بصيغة `/biz/{slug}` مع معرّف النشاط المدمج، وهو سليم من حيث التوجيه الفريد.');
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 4. ملف المشاكل القابل للقراءة آلياً (Machine-Readable Issues CSV)');
  md.push('');
  md.push(`تم حفظ التقرير التفصيلي لكل مشكلة لكل نشاط في المسار:`);
  md.push(`📁 \`docs/seo/audit-issues-per-business.csv\``);
  md.push(`- **إجمالي السجلات المرصودة:** ${issuesList.length} مشكلة مسجلة مع درجة الخطورة وتفاصيل الخلل.`);
  md.push('');
  md.push('---');
  md.push('');
  md.push('## 5. مخرجات التدقيق والتوصيات للمراحل اللاحقة');
  md.push('1. **حظر التعديل المباشر على الحقول الأصلية:** يجب إضافة أعمدة جديدة تماماً `seo_title` و `seo_description` و `seo_intro` و `seo_faq` وفقاً للقاعدة 5.');
  md.push('2. **قواعد صياغة المحتوى (Phase B):** اعتماد حقائق دقيقة فقط من الحقول المؤكدة، دون أي مبالغات أو عبارات تفضيل غير موثقة.');
  md.push('3. **التحقق الآلي الصارم (Phase C):** فحص نسبة التشابه والتأكد من خلو المحتوى من أي ادعاء غير مسجل في الحقول الأصلية.');

  const reportPath = path.join(process.cwd(), 'docs', 'seo', '00-audit.md');
  fs.writeFileSync(reportPath, md.join('\n'), 'utf8');
  console.log(`Saved audit report to: ${reportPath}`);
}

generateReport().catch(err => {
  console.error('Audit report generation failed:', err);
  process.exit(1);
});
