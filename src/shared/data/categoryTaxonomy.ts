import { CATEGORY_GROUPS } from './categories';
import { normalizeArabicText } from '../lib/arabicSearch';

export interface CategorySubcategory {
  id: string;
  label: string;
  aliases: string[];
  exclusions?: string[];
}

export interface CategoryTaxonomyGroup {
  id: string;
  label: string;
  word: string;
  icon: string;
  description: string;
  aliases: string[];
  children: CategorySubcategory[];
}

const GROUP_META: Record<string, { id: string; aliases: string[] }> = {
  'المطاعم والكافيهات والمأكولات': { id: 'food', aliases: ['مطاعم', 'مأكولات', 'مطاعم وكافيهات', 'food'] },
  'السوبر ماركت والبقالة والتموين': { id: 'grocery', aliases: ['سوبر ماركت', 'سوبرماركت', 'بقالة', 'تموين', 'تسوق وبقالة', 'shop'] },
  'العيادات والرعاية الصحية والطبية': { id: 'health', aliases: ['صحة', 'رعاية طبية', 'طبي وصيدلي', 'عيادات', 'صيدليات وعيادات', 'med'] },
  'الملابس والأزياء والإكسسوارات': { id: 'fashion', aliases: ['ملابس', 'أزياء', 'اكسسوارات', 'ملابس وأزياء', 'fash'] },
  'الهواتف والإلكترونيات والكمبيوتر': { id: 'electronics', aliases: ['هواتف', 'الكترونيات', 'كمبيوتر'] },
  'السيارات والمركبات والصيانة': { id: 'automotive', aliases: ['سيارات', 'مركبات', 'سيارات وصيانة', 'خدمات سيارات', 'صيانة سيارات', 'auto'] },
  'التجميل والعناية الشخصية واللياقة': { id: 'beauty-fitness', aliases: ['تجميل', 'عناية شخصية', 'لياقة'] },
  'الأثاث والديكور والمنزل': { id: 'home', aliases: ['أثاث', 'ديكور', 'منزل'] },
  'الشركات والخدمات والمكاتب المهنية': { id: 'professional-services', aliases: ['شركات', 'خدمات مهنية', 'مكاتب'] },
  'المكتبات والأدوات المدرسية والطباعة': { id: 'stationery-printing', aliases: ['مكتبات', 'أدوات مدرسية', 'طباعة'] },
  'التعليم والتدريب وتنمية المهارات': { id: 'education', aliases: ['تعليم', 'تدريب', 'مدارس وحضانات', 'تعليم وخدمات', 'edu'] },
  'الحرف والورش والصيانة الفنية': { id: 'crafts', aliases: ['حرفيين', 'حرف وورش', 'صيانة منزلية', 'خدمات منزلية', 'صيانة'] },
  'السياحة والفنادق والمناسبات': { id: 'travel-events', aliases: ['سياحة', 'فنادق', 'مناسبات'] },
  'أنشطة وخدمات عامة أخرى': { id: 'other', aliases: ['خدمات عامة', 'أنشطة أخرى'] },
};

type SubMeta = { id: string; aliases: string[]; exclusions?: string[] };

const SUBCATEGORY_META: Record<string, SubMeta> = {
  'مطعم / مأكولات ومشويات': { id: 'restaurant', aliases: ['مطعم', 'مطاعم', 'مشويات', 'مأكولات'] },
  'كافيه / مقهى وكوفي شوب': { id: 'cafe', aliases: ['كافيه', 'كافيهات', 'مقهى', 'كوفي شوب'] },
  'مخبز / حلواني ومعجنات': { id: 'bakery', aliases: ['مخبز', 'فرن', 'حلواني', 'معجنات'] },
  'عصائر ومثلجات / آيس كريم': { id: 'juice-icecream', aliases: ['عصائر', 'ايس كريم', 'مثلجات'] },
  'سوبر ماركت / هايبر وبقالة': { id: 'supermarket-grocery', aliases: ['سوبر ماركت', 'سوبرماركت', 'هايبر ماركت', 'هايبر', 'بقالة', 'تموينات', 'ميني ماركت'] },
  'خضروات وفواكه طازجة': { id: 'fruit-vegetables', aliases: ['خضار', 'خضروات', 'فاكهة', 'فواكه', 'خضار وفاكهة'] },
  'جزارة / لحوم ودواجن وأسماك': { id: 'meat-poultry-fish', aliases: ['جزارة', 'جزار', 'لحوم', 'دواجن', 'طيور', 'اسماك', 'أسماك'] },
  'عطارة وتوابل / أعشاب طبيعية': { id: 'spices-herbs', aliases: ['عطارة', 'عطار', 'توابل', 'اعشاب', 'أعشاب'] },
  'محامص ومكسرات وتسالي / بن وقهوة': { id: 'roastery-nuts', aliases: ['محمصة', 'محامص', 'مكسرات', 'تسالي', 'بن وقهوة'] },
  'صيدلية وخدمات دوائية': { id: 'pharmacy', aliases: ['صيدلية', 'صيدليات', 'دواء', 'خدمات دوائية'] },
  'عيادة طبية / مركز تخصصي': { id: 'medical-clinic', aliases: ['عيادة', 'عيادات', 'مركز طبي', 'طبيب', 'دكتور'] },
  'فني سباكة وتأسيس صحي': { id: 'plumber', aliases: ['سباك', 'فني سباكة', 'سباكة', 'تأسيس صحي'], exclusions: ['أدوات سباكة', 'ادوات سباكة', 'أدوات صحية', 'ادوات صحية'] },
  'فني كهرباء وصيانة منزلية': { id: 'electrician', aliases: ['كهربائي', 'فني كهرباء', 'كهرباء منزلية', 'صيانة كهربائية'], exclusions: ['أدوات كهربائية', 'ادوات كهربائية', 'أجهزة كهربائية', 'اجهزة كهربائية'] },
  'ورشة نجارة ومصنوعات خشبية': { id: 'carpenter', aliases: ['نجار', 'نجارة', 'مصنوعات خشبية'] },
  'ورشة حدادة وكريتال': { id: 'blacksmith', aliases: ['حداد', 'حدادة', 'كريتال'] },
  'ورشة ألوميتال وزجاج ومطابخ': { id: 'aluminum-glass', aliases: ['الوميتال', 'ألوميتال', 'زجاج', 'واجهات زجاج'] },
  'فني صيانة تكييف وتبريد وأجهزة': { id: 'ac-refrigeration', aliases: ['فني تكييف', 'صيانة تكييف', 'تبريد', 'صيانة أجهزة', 'صيانة اجهزة'] },
  'مغسلة ملابس ودراي كلين ومكوجي': { id: 'laundry', aliases: ['مغسلة ملابس', 'دراي كلين', 'مكوجي'] },
  'أدوات صحية وسيراميك ورخام': { id: 'building-plumbing-supplies', aliases: ['أدوات صحية', 'ادوات صحية', 'أدوات سباكة', 'ادوات سباكة', 'سيراميك', 'رخام'] },
  'إضاءة ونجف وتأسيس كهرباء': { id: 'lighting-electrical-supplies', aliases: ['إضاءة', 'اضاءة', 'نجف', 'أدوات كهربائية', 'ادوات كهربائية', 'مستلزمات كهرباء'] },
  'وجبات سريعة وتيك أواي': { id: 'fast-food', aliases: ['وجبات سريعة', 'تيك اواي', 'فاست فود'] },
  'مأكولات شعبية وكشري': { id: 'local-food', aliases: ['كشري', 'فول وطعمية', 'مأكولات شعبية', 'طعمية'] },
  'أسماك ومأكولات بحرية': { id: 'seafood', aliases: ['مطعم اسماك', 'مأكولات بحرية', 'سي فود'] },
  'كاترينج وتجهيز طعام': { id: 'catering', aliases: ['كاترينج', 'تموين حفلات', 'تجهيز طعام'] },
  'ألبان وأجبان ومنتجات غذائية': { id: 'dairy-products', aliases: ['ألبان', 'البان', 'أجبان', 'اجبان', 'منتجات ألبان'] },
  'مجمدات وأغذية جاهزة': { id: 'frozen-foods', aliases: ['مجمدات', 'أغذية مجمدة', 'اغذية مجمدة'] },
  'منظفات ومستلزمات منزلية': { id: 'household-supplies', aliases: ['منظفات', 'مستلزمات منزلية'] },
  'عيادة أنف وأذن وحنجرة': { id: 'ent-clinic', aliases: ['أنف وأذن', 'انف واذن', 'حنجرة'] },
  'عيادة قلب وأوعية دموية': { id: 'cardiology', aliases: ['عيادة قلب', 'قلب وأوعية', 'دكتور قلب'] },
  'عيادة مخ وأعصاب': { id: 'neurology', aliases: ['مخ وأعصاب', 'مخ واعصاب', 'دكتور مخ'] },
  'عيادة مسالك بولية': { id: 'urology', aliases: ['مسالك بولية', 'عيادة مسالك'] },
  'عيادة نفسية': { id: 'psychiatry', aliases: ['عيادة نفسية', 'علاج نفسي', 'طبيب نفسي'] },
  'مركز تخاطب وتأهيل نطق': { id: 'speech-therapy', aliases: ['تخاطب', 'تأهيل نطق'] },
  'عيادة سمعيات': { id: 'audiology', aliases: ['سمعيات', 'سماعات أذن', 'مركز سمعيات'] },
  'خياطة وتفصيل ملابس': { id: 'tailoring', aliases: ['خياطة', 'تفصيل ملابس', 'ترزي', 'خياط'] },
  'ملابس رياضية': { id: 'sportswear', aliases: ['ملابس رياضية', 'ملابس رياضة'] },
  'صيانة كمبيوتر وطابعات': { id: 'computer-repair', aliases: ['صيانة كمبيوتر', 'صيانة لابتوب', 'طابعات'] },
  'أجهزة ألعاب': { id: 'gaming', aliases: ['العاب فيديو', 'بلايستيشن', 'اجهزة العاب'] },
  'سمكرة ودهان سيارات': { id: 'auto-body', aliases: ['سمكرة', 'دهان سيارات', 'بويا سيارات'] },
  'تأجير سيارات': { id: 'car-rental', aliases: ['تأجير سيارات', 'ايجار سيارات', 'رينت كار'] },
  'ونش وإنقاذ سيارات': { id: 'tow-truck', aliases: ['ونش', 'إنقاذ سيارات', 'سحب سيارات'] },
  'ليزر وإزالة شعر': { id: 'laser-hair', aliases: ['ازالة شعر', 'ليزر تجميل', 'جلسات ليزر'] },
  'نقش حناء': { id: 'henna', aliases: ['حناء', 'نقش حناء'] },
  'تنجيد وفرش أثاث': { id: 'upholstery', aliases: ['تنجيد', 'منجد', 'فرش أثاث'] },
  'تنظيف منازل ومكافحة حشرات': { id: 'home-cleaning', aliases: ['تنظيف منازل', 'مكافحة حشرات', 'رش مبيدات'] },
  'خدمات توصيل ومندوبين': { id: 'delivery', aliases: ['مندوب توصيل', 'خدمات توصيل', 'شركة توصيل'] },
  'تأمين ووثائق': { id: 'insurance', aliases: ['تأمين', 'تامين سيارات', 'وثائق تأمين'] },
  'أحبار وورق ومستلزمات طباعة': { id: 'print-supplies', aliases: ['أحبار', 'احبار طابعات', 'ورق طباعة'] },
  'تحفيظ قرآن وعلوم شرعية': { id: 'quran', aliases: ['تحفيظ قرآن', 'تحفيظ القران', 'كتاتيب'] },
  'تدريب مهني وحرفي': { id: 'vocational', aliases: ['تدريب مهني', 'تدريب حرفي', 'مركز تدريب'] },
  'مفاتيح وأقفال': { id: 'locksmith', aliases: ['مفاتيح', 'أقفال', 'اقفال', 'صانع مفاتيح'] },
  'حج وعمرة': { id: 'hajj-umrah', aliases: ['حج وعمرة', 'عمرة', 'رحلات حج'] },
  'شقق مفروشة وإيجار يومي': { id: 'furnished-rentals', aliases: ['شقق مفروشة', 'ايجار يومي'] },
  'مستلزمات حيوانات أليفة': { id: 'pet-supplies', aliases: ['مستلزمات حيوانات', 'طعام حيوانات', 'بت شوب'] },
};

const EXTRA_SUBCATEGORIES: Record<string, Array<{ id: string; label: string; aliases: string[]; exclusions?: string[] }>> = {
  crafts: [
    { id: 'painting-finishing', label: 'نقاشة وتشطيبات منزلية', aliases: ['نقاش', 'نقاشة', 'تشطيبات منزلية', 'محارة', 'جبس بورد'] },
    { id: 'building-tools', label: 'مواد وأدوات بناء', aliases: ['مواد بناء', 'أدوات بناء', 'ادوات بناء', 'أسمنت', 'اسمنت', 'جبس'] },
  ],
};

function normalizedUnique(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeArabicText).filter((value) => value.length >= 2)));
}

function fallbackSubcategoryId(groupId: string, label: string): string {
  return `${groupId}:${normalizeArabicText(label).replace(/\s+/g, '-')}`;
}

export const CATEGORY_TAXONOMY: CategoryTaxonomyGroup[] = CATEGORY_GROUPS.map((group) => {
  const meta = GROUP_META[group.group] || { id: `group:${normalizeArabicText(group.group).replace(/\s+/g, '-')}`, aliases: [] };
  return {
    id: meta.id,
    label: group.group,
    word: group.word,
    icon: group.icon,
    description: group.description,
    aliases: normalizedUnique([group.group, group.word, ...meta.aliases]),
    children: [...group.items.map((label) => {
      const childMeta = SUBCATEGORY_META[label];
      return {
        id: childMeta?.id || fallbackSubcategoryId(meta.id, label),
        label,
        aliases: normalizedUnique([label, ...(childMeta?.aliases || [])]),
        exclusions: childMeta?.exclusions ? normalizedUnique(childMeta.exclusions) : undefined,
      };
    }), ...(EXTRA_SUBCATEGORIES[meta.id] || []).map((child) => ({
      ...child,
      aliases: normalizedUnique([child.label, ...child.aliases]),
      exclusions: child.exclusions ? normalizedUnique(child.exclusions) : undefined,
    }))],
  };
});

export function getCategoryGroupById(id?: string | null): CategoryTaxonomyGroup | undefined {
  if (!id) return undefined;
  return CATEGORY_TAXONOMY.find((group) => group.id === id);
}

export function getSubcategoryById(id?: string | null): (CategorySubcategory & { groupId: string }) | undefined {
  if (!id) return undefined;
  for (const group of CATEGORY_TAXONOMY) {
    const child = group.children.find((item) => item.id === id);
    if (child) return { ...child, groupId: group.id };
  }
  return undefined;
}
