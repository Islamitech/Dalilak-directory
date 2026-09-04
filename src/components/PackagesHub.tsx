import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Globe, 
  Share2, 
  Camera, 
  TrendingUp, 
  Crown, 
  Zap, 
  Clock, 
  HelpCircle, 
  Layers, 
  Check, 
  X,
  FileText,
  Smartphone,
  ShieldCheck,
  Award,
  Users,
  Building2,
  MessageCircle,
  Rocket,
  Gift,
  Palette,
  Megaphone,
  QrCode,
  Store,
  ChevronDown
} from 'lucide-react';
import { PACKAGES } from '../data/mockData';

interface PackagesHubProps {
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
  onClose?: () => void;
}

export const PackagesHub: React.FC<PackagesHubProps> = ({
  initialPackageId = 'pkg_pro',
  onSelectPackage,
  onClose
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(initialPackageId || 'pkg_pro');
  const [filterCategory, setFilterCategory] = useState<'all' | 'free' | 'growth' | 'enterprise'>('all');

  const detailedPackages = [
    {
      id: 'pkg_free',
      category: 'free',
      title: 'باقة الظهور والإدراج المجاني',
      englishTitle: '100% Free Public Listing',
      price: 0,
      priceSuffix: 'مجاناً 100%',
      badge: 'الظهور مجاني 100% 🎁',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      cardBorder: 'hover:border-emerald-500/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/25',
      icon: Gift,
      iconBg: 'from-emerald-600 to-teal-500 text-white',
      accentColor: 'text-emerald-500',
      summary: 'إدراج نشاطك التجاري بالكامل في دليل منصة دليلك مع كافة بيانات التواصل، العنوان، الخريطة التفاعلية، ومواعيد العمل بدون أي رسوم إطلاقاً.',
      deliveryTime: 'خلال 24 ساعة',
      targetAudience: 'كافة المحلات والأنشطة التجارية في مصر بدون استثناء - حق أصيل لكل صاحب عمل للظهور للزبائن مجاناً مدى الحياة.',
      highlights: [
        'ظهور اسم النشاط وتصنيفه التجاري في دليل المحافظة والمنطقة',
        'عرض أرقام الهواتف وروابط الواتساب للتواصل المباشر',
        'تثبيت العنوان وتحديد الموقع بدقة على الخريطة التفاعلية',
        'عرض مواعيد وساعات العمل الرسمية طوال أيام الأسبوع',
        'بدون أي رسوم تسجيل، وبدون أي اشتراكات خفية (مجاني 100%)'
      ],
      featuresIncluded: [
        { name: 'إدراج كامل في دليل المحافظة والمنطقة', desc: 'يظهر نشاطك في نتائج البحث والتصنيفات للمواطنين في منطقتك ومحافظتك.' },
        { name: 'أزرار الاتصال والمراسلة المباشرة', desc: 'إمكانية اتصال الزبون بك هاتفياً أو بدء محادثة واتساب بنقرة واحدة.' },
        { name: 'عرض الموقع على الخريطة التفاعلية المباشرة', desc: 'تحديد موقع المحل مع زر توجيه عبر خرائط جوجل لسهولة الوصول.' },
        { name: 'جدول مواعيد وساعات العمل الرسمية', desc: 'إبراز حالة النشاط (مفتوح الآن / مغلق) وتوقيتات العمل الرسمية.' },
        { name: 'إمكانية تحديث البيانات في أي وقت', desc: 'تعديل أرقام الهواتف أو المواعيد بكل سهولة عبر فريق خدمة العملاء.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويدنا بأرقام هواتف نشطة بها واتساب لضمان وصول طلبات الزبائن مباشرة.',
        '📍 نصيحة العنوان: كتابة أقرب علامة مميزة لتسهيل وصول الزبائن وسيارات التوصيل.'
      ]
    },
    {
      id: 'pkg_basic',
      category: 'growth',
      title: 'باقة التوثيق الأساسي وتصدر Google',
      englishTitle: 'Basic Google Maps Verification',
      price: 250,
      priceSuffix: 'سداد لمرة واحدة',
      badge: 'توثيق رسمي 📍',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
      cardBorder: 'hover:border-blue-500/60',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5 dark:bg-blue-950/25',
      icon: MapPin,
      iconBg: 'from-blue-600 to-cyan-500 text-white',
      accentColor: 'text-blue-500',
      summary: 'التفعيل الميداني الرسمي لنشاطك التجاري على خرائط جوجل وتصدر نتائج البحث مع تثبيت الإحداثيات وهدية ملصق QR.',
      deliveryTime: '24 - 48 ساعة عمل',
      targetAudience: 'المحلات والأنشطة التي تحتاج لظهور رسمي فوري وموثق على خرائط جوجل لسهولة وصول الزبائن وتوصيل الطلبات.',
      highlights: [
        'تثبيت الموقع الجغرافي الدقيق بنظام GPS',
        'رفع اللوجو وصور الواجهة ومقر النشاط بجودة عالية',
        'إضافة أرقام الهواتف ومواعيد العمل الرسمية المعتمدة',
        'إصدار فاتورة إلكترونية معتمدة برمز QR مع مشاركة واتساب',
        '🎁 هدية خاصة: ملصق باركود QR Code احترافي جاهز للطباعة'
      ],
      featuresIncluded: [
        { name: 'التفعيل الميداني الرسمي على خرائط Google', desc: 'تثبيت مكان محلك بنقطة جغرافية دقيقة تظهر لجميع الباحثين في منطقتك ومحيطك.' },
        { name: 'ضبط بيانات التواصل وساعات العمل', desc: 'إضافة رقم التليفون، الواتساب، وأوقات الفتح والإغلاق طوال أيام الأسبوع.' },
        { name: 'رفع الشعار والواجهة والمنتجات', desc: 'إضافة صور عالية الجودة لواجهة المحل ومنتجاتك لجذب الزبائن.' },
        { name: 'فاتورة إلكترونية معتمدة ومشاركة WhatsApp', desc: 'إصدار رابط وفاتورة رسمية فورية يمكن مشاركتها وتنزيلها.' },
        { name: 'هدية خاصة: ملصق باركود QR Code', desc: 'تصميم ملصق باركود مخصص لموقع نشاطك جاهز للطباعة والتعليق في واجهة المحل.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويد المندوب بأرقام هواتف نشطة طوال اليوم وتحديد مواعيد العمل بدقة.',
        '📸 نصيحة الصور: تجهيز صورة واضحة للواجهة بدون عوائق مع لافتة المحل التجارية.'
      ]
    },
    {
      id: 'pkg_pro',
      category: 'growth',
      title: 'عرض التأسيس والربط الذكي',
      englishTitle: 'Pro Setup & Smart Growth',
      price: 750,
      priceSuffix: 'الأكثر اختياراً',
      popular: true,
      badge: 'الأكثر طلباً ومبيعاً ⭐',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      cardBorder: 'hover:border-emerald-500/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/25',
      icon: Zap,
      iconBg: 'from-emerald-600 to-teal-500 text-white',
      accentColor: 'text-emerald-500',
      summary: 'حملة ترويجية متكاملة تشمل توثيق جوجل + تأسيس صفحات المنصات الاجتماعية وتصميم الإعلانات وهوية العرض مع متابعة 3 أيام.',
      deliveryTime: '3 أيام عمل مع مرافقة حية',
      targetAudience: 'المحلات والشركات الراغبة في انطلاقة رقمية قوية، زيادة المبيعات، وبناء هوية تسويقية تجذب العملاء الجدد.',
      highlights: [
        'كل مميزات باقة التوثيق الأساسي على خرائط جوجل',
        'كتابة وصف تسويقي احترافي وتحسين الكلمات المفتاحية (SEO)',
        'تأسيس صفحات فيسبوك والمنصات بهوية بصرية مميزة',
        'تصميم إعلان احترافي وطريقة عرض البضائع والمنتجات',
        'متابعة ومرافقة ودعم تسويقي خطوة بخطوة لمدة 3 أيام'
      ],
      featuresIncluded: [
        { name: 'التوثيق الميداني الشامل على Google Maps', desc: 'توثيق رسمي وتثبيت معتمد مع تهيئة محركات البحث الموضعية.' },
        { name: 'تحسين محركات البحث والكلمات المفتاحية (SEO)', desc: 'صياغة اسم ووصف المحل بالكلمات التي يبحث عنها أهالي المنطقة لتتصدر النتائج.' },
        { name: 'تأسيس وبناء صفحات التواصل الاجتماعي', desc: 'إنشاء وضبط صفحات فيسبوك والمنصات باسم وهوية بصرية متناسقة مع نشاطك.' },
        { name: 'تصميم إعلان وطريقة عرض البضائع', desc: 'تصميمات إعلانية جذابة لعرض المنتجات بطريقة تشد انتباه الزبائن.' },
        { name: 'مرافقة وتوجيه لمدة 3 أيام', desc: 'فريق العمل يرافقك لمدة 3 أيام للرد على الاستفسارات ومساعدتك في نشر أولى العروض.' },
        { name: 'استشارات وزيادة اتصالات العملاء', desc: 'توجيهات عملية ونماذج فعالة لتحويل استفسارات المتصلين إلى مبيعات فورية.' }
      ],
      idealPractices: [
        '💡 الشرط الأساسي: معرفة صاحب النشاط أو من ينوب عنه باستخدام تطبيقات الموبايل لتحقيق أفضل نتائج.',
        '🎯 نصيحة المبيعات: الاستفادة من تصاميم الإعلانات لنشر عروض افتتاح أو خصومات موسمية.'
      ]
    },
    {
      id: 'pkg_vip',
      category: 'growth',
      title: 'عرض الدعم الميداني والإدارة الشاملة VIP',
      englishTitle: 'VIP Field Support & Monthly Management',
      price: 2000,
      priceSuffix: '/ للشهر الأول (تجديد 1,000 ج)',
      badge: 'الإدارة الكاملة VIP 👑',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      cardBorder: 'hover:border-amber-500/60',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-950/25',
      icon: Crown,
      iconBg: 'from-amber-500 to-yellow-400 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'إدارة رقمية متكاملة وزيارات ميدانية للتصوير الاحترافي وتدريب عملي مع دعم واستشارات يومية مستمرة لمدة شهر كامل.',
      deliveryTime: 'شهر كامل (30 يوماً)',
      targetAudience: 'المبتدئين وأصحاب الأعمال المشغولين الذين يريدون من يتولى عنهم كل شيء من التصوير إلى النشر وإدارة التقييمات.',
      highlights: [
        'كل ميزات باقة التأسيس وتوثيق خرائط جوجل مع أولوية VIP',
        'زيارة ميدانية وتصوير احترافي فائق الجودة لمقر النشاط والبضائع',
        'خطة تسويقية وتصميم بوستات وإعلانات مخصصة طوال الشهر',
        'تدريب خطوة بخطوة لصناعة العروض وإدارة الصفحات باحترافية',
        'دعم يومي متواصل ومتابعة حية لمدة شهر كامل',
        'تجديد اختياري مخفض بـ 1000 ج فقط للشهور التالية'
      ],
      featuresIncluded: [
        { name: 'زيارة ميدانية وتصوير احترافي للمحل', desc: 'يقوم مندوب متخصص بزيارة مقرك والتقاط صور مميزة للمكان والمنتجات بجودة فائقة.' },
        { name: 'خطة تسويقية وبناء هوية رقمية كاملة', desc: 'إعداد خطة ترويجية للمحل، تصميم بنرات وبوستات إعلانية متجددة طوال الشهر.' },
        { name: 'تدريب عملي خطوة بخطوة لصاحب النشاط', desc: 'تعليمك كيفية إدارة الصفحات، الرد السريع، وعمل إعلانات ممولة ناجحة بنفسك.' },
        { name: 'دعم واستشارات يومية لمدة شهر كامل', desc: 'تواصل ومتابعة يومية للرد على أي استفسار وحل أي عقبات تسويقية فوراً.' },
        { name: 'إدارة التقييمات والرد على آراء الزبائن', desc: 'متابعة تقييمات العملاء على خرائط جوجل وحماية سمعة النشاط.' },
        { name: 'ميزة التجديد المخفض (1000 ج/شهر)', desc: 'بعد انتهاء الشهر الأول، يمكنك الاستمرار في خدمة الإدارة الشهرية بنصف السعر فقط.' }
      ],
      idealPractices: [
        '💡 الفئة المستهدفة: للمبتدئين ومن ليس لديهم وقت لإدارة السوشيال ميديا أو من يواجهون صعوبة تقنية.',
        '📈 أفضل استفادة: تحديد أوقات الزيارة الميدانية عندما يكون المحل جاهزاً بأفضل تشكيلة بضائع.'
      ]
    },
    {
      id: 'pkg_launch_from_scratch',
      category: 'enterprise',
      title: 'باقة الانطلاق الكبرى والتأسيس من الصفر',
      englishTitle: 'Enterprise Turnkey Launch (0 to Hero)',
      price: 20000,
      priceSuffix: 'مشروع تأسيس شامل',
      isFlagship: true,
      badge: 'تاج التأسيس للأنشطة تحت الإنشاء 👑',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black border-amber-300 shadow-md',
      cardBorder: 'hover:border-amber-400 border-amber-500/50',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 shadow-2xl shadow-amber-500/20',
      icon: Rocket,
      iconBg: 'from-amber-500 via-yellow-400 to-amber-600 text-slate-950',
      accentColor: 'text-amber-500',
      summary: 'تكفل شامل من الصفر للأنشطة تحت التأسيس: تصميم الشعار، اللافتة الخارجية، المطبوعات، تصوير سينمائي 4K، حملة افتتاح ممولة، بناء منظومة الزبون المنتظم، وتدريب فريق العمل.',
      deliveryTime: 'طوال فترة التأسيس + 30 يوماً بعد الافتتاح',
      targetAudience: 'المطاعم، الكافيهات، المعارض، والشركات الجديدة تحت الإنشاء التي تريد افتتاحاً مدوياً، وتصدر منطقتها، وبناء قاعدة زبائن دائمة من اليوم الأول.',
      highlights: [
        '👑 ابتكار وتصميم الشعار الرسمي ودليل الهوية البصرية الكامل (Vector)',
        '🏬 تصميم لافتة المحل الخارجية المتناسقة مع طابع المنطقة لتكون الأبرز',
        '📦 تصميمات التعبئة والمطبوعات الميدانية: منيو، كروت، أكياس، فواتير، وزي موحد',
        '🎬 تصوير فيديو إعلاني سينمائي بجودة 4K لمقر النشاط وتجهيزاته والافتتاح',
        '📣 إطلاق وإدارة حملة إعلانية ممولة مكثفة ومستهدفة جغرافياً لسكان المنطقة',
        '💎 بناء منظومة "الزبون المنتظم" (برنامج ولاء دائم لتكرار الشراء)',
        '👨‍💼 تدريب صاحب النشاط وفريق العمل على التشغيل والبيع الميداني'
      ],
      featuresIncluded: [
        { name: 'تصميم الشعار والهوية البصرية الكاملة', desc: 'ابتكار لوجو حصري بجميع الملفات المفتوحة الصالحة للطباعة على كافة المقاسات.' },
        { name: 'تصميم لافتة المحل الخارجية والمطبوعات', desc: 'تصور ثلاثي الأبعاد للافتة المحل، كروت العمل، الفواتير، الأكياس، والزي الموحد للعاملين.' },
        { name: 'تصوير سينمائي إعلاني بدقة 4K', desc: 'فيديو إعلاني احترافي يوثق المكان والتجهيزات والعروض بجودة استوديوهات التلفزيون.' },
        { name: 'تأسيس وضبط كافة المنصات الرقمية وواتساب الذكي', desc: 'إنشاء وضبط صفحات فيسبوك وإنستغرام وتيك توك مع نظام رد آلي وكتالوج رقمي.' },
        { name: 'إطلاق حملة إعلانية ممولة مكثفة', desc: 'استهداف مكثف لأهالي المنطقة المحيطة لتوليد زحام وطلب كبير منذ يوم الافتتاح الأول.' },
        { name: 'هندسة وصياغة عروض الافتتاح الساحقة', desc: 'صناعة عروض ترويجية تجعل الزبائن يفضلون تجربتك ويتحدثون عنك بين الأصدقاء.' },
        { name: 'بناء منظومة برنامج ولاء "الزبون المنتظم"', desc: 'نظام رقمي لتسجيل أرقام وبيانات العملاء وإرسال العروض الحصرية لضمان عودتهم الدائمة.' },
        { name: 'تدريب الموظفين وإدارة التشغيل', desc: 'تدريب فريق العمل على فنون الاستقبال، زيادة المبيعات (Cross-Selling)، والتعامل مع الزبائن.' },
        { name: 'مرافقة ودعم مستمر لمدة 30 يوماً بعد الافتتاح', desc: 'فريق التسويق يرافقك شهراً كاملاً بعد الافتتاح لضمان ثبات المبيعات واستقرار النشاط.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: التواصل معنا في بداية مرحلة التجهيزات لتنسيق التصميمات واللافتة قبل بدء أعمال الديكور.',
        '🎯 نصيحة الافتتاح: تخصيص عينات تذوق أو هدايا مجانية لأول 100 زائر لمضاعفة الانتشار الشفهي.'
      ]
    }
  ];

  const filteredPackages = detailedPackages.filter((pkg) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'free') return pkg.category === 'free';
    if (filterCategory === 'growth') return pkg.category === 'growth';
    if (filterCategory === 'enterprise') return pkg.category === 'enterprise';
    return true;
  });

  const selectedPkg = detailedPackages.find((p) => p.id === selectedPkgId) || detailedPackages[2];

  const comparisonRows = [
    {
      feature: 'ظهور النشاط في دليل المنصة والمحافظة',
      free: true,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'عرض أرقام التواصل وروابط الواتساب المباشرة',
      free: true,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'التفعيل والتوثيق الرسمي على خرائط Google',
      free: false,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تثبيت إحداثيات الموقع بدقة GPS مع ساعات العمل',
      free: 'أساسي',
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'ملصق باركود QR Code احترافي مخصص للمحل',
      free: false,
      basic: true,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تحسين محركات البحث والكلمات المفتاحية (SEO)',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تأسيس صفحات المنصات الاجتماعية بهوية احترافية',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'تصميم إعلانات وطريقة عرض البضائع والمنتجات',
      free: false,
      basic: false,
      pro: true,
      vip: true,
      enterprise: true,
    },
    {
      feature: 'زيارة ميدانية وتصوير احترافي لمقر النشاط',
      free: false,
      basic: false,
      pro: false,
      vip: 'تصوير فوتوغرافي',
      enterprise: 'فيديو سينمائي 4K',
    },
    {
      feature: 'تصميم الشعار واللافتة الخارجية والمطبوعات الميدانية',
      free: false,
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'إطلاق حملات إعلانية ممولة مستهدفة للمنطقة',
      free: false,
      basic: false,
      pro: false,
      vip: 'استشارات',
      enterprise: 'حملة ممولة كاملة',
    },
    {
      feature: 'منظومة "الزبون المنتظم" وبرنامج الولاء الدائم',
      free: false,
      basic: false,
      pro: false,
      vip: false,
      enterprise: true,
    },
    {
      feature: 'مدة المرافقة والدعم التسويقي المباشر',
      free: 'دعم فني',
      basic: 'تسليم 48 ساعة',
      pro: 'متابعة 3 أيام',
      vip: 'دعم يومي شهر كامل',
      enterprise: 'طوال التأسيس + شهر',
    },
    {
      feature: 'السعر الرسمي الإجمالي',
      free: 'مجاني (0 ج.م)',
      basic: '250 ج.م',
      pro: '750 ج.م',
      vip: '2,000 ج.م',
      enterprise: '20,000 ج.م',
    },
  ];

  const getWhatsAppMessage = (pkg: typeof selectedPkg) => {
    return encodeURIComponent(
      `مرحباً دليلك 👋 أود الاستفسار والاشتراك في "${pkg.title}" بقيمة ${pkg.price === 0 ? 'الظهور المجاني' : `${pkg.price} جنيه مصري`} لنشاطي التجاري.`
    );
  };

  const handleSelectForForm = (pkgTitle: string) => {
    if (onSelectPackage) {
      onSelectPackage(pkgTitle);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-6 font-['Cairo',sans-serif] text-[var(--text-primary)]">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-5 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-slate-950/25 text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm inline-flex items-center gap-1.5">
              <span>منظومة باقات دليلك المتكاملة في مصر</span>
              <span>💎</span>
            </span>
            <span className="bg-emerald-950/20 text-emerald-950 text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-sm">
              من الظهور المجاني وحتى التأسيس الشامل
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            دليل وشرح باقات خدمات منصة دليلك في مصر 🚀
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-900/90 max-w-3xl leading-relaxed">
            حلول رقمية وميدانية متدرجة تبدأ من الإدراج المجاني المفتوح للجميع، مروراً بالتوثيق على خرائط جوجل، وتأسيس المنصات الرقمية، وحتى الإدارة الشهرية الكاملة والتأسيس الشامل من الصفر للمشاريع الكبرى.
          </p>
        </div>
        <div className="absolute -left-6 -bottom-6 opacity-20 pointer-events-none">
          <Crown className="w-52 h-52" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CATEGORY FILTER CHIPS */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: '🌟 جميع الباقات (5 خيارات)' },
            { id: 'free', label: '🎁 الظهور المجاني (0 ج)' },
            { id: 'growth', label: '⚡ باقات التوثيق والتسويق (250 - 750 - 2,000 ج)' },
            { id: 'enterprise', label: '👑 باقة التأسيس الكبرى (20,000 ج)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer shadow-xs ${
                filterCategory === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-md scale-105'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-amber-500/10 border border-[var(--border-color)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-bold text-[var(--text-muted)] hidden md:block shrink-0">
          انقر على أي باقة لمعاينة تفاصيلها فوراً
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {filteredPackages.map((pkg) => {
          const IconComp = pkg.icon;
          const isSelected = selectedPkgId === pkg.id;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={`p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl relative group ${
                pkg.isFlagship
                  ? isSelected
                    ? `${pkg.activeBorder}`
                    : 'bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/5 border-amber-500/50 hover:border-amber-400'
                  : isSelected
                    ? `${pkg.activeBorder} shadow-amber-500/10`
                    : `bg-[var(--bg-card)] border-[var(--border-color)] ${pkg.cardBorder}`
              }`}
            >
              {/* Flagship Crown Accent */}
              {pkg.isFlagship && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>الباقة الأكبر والأشمل 💎</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pkg.iconBg} flex items-center justify-center font-black shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className={`text-[10.5px] sm:text-xs font-black px-2.5 py-1 rounded-full border ${pkg.badgeColor} shadow-sm`}>
                    {pkg.badge}
                  </span>
                </div>

                {/* Title & English Subtitle */}
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)] leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono font-bold mt-1">
                    {pkg.englishTitle}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 pt-2 border-t border-[var(--border-color)]">
                  <span className={`text-3xl font-black font-mono ${pkg.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {pkg.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">جنيه مصري</span>
                  {pkg.priceSuffix && (
                    <span className="text-[10px] text-[var(--text-muted)] font-bold mr-1">
                      ({pkg.priceSuffix})
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed line-clamp-3">
                  {pkg.summary}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPkgId(pkg.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black shadow-amber-500/20'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-amber-500/10 border border-[var(--border-color)]'
                  }`}
                >
                  <span>{isSelected ? '✓ الباقة المعروضة حالياً' : 'استعراض التفاصيل الكاملة ←'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. DETAILED VIEW FOR SELECTED PACKAGE */}
      {/* ========================================================================= */}
      <div className={`bg-[var(--bg-card)] border-2 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl transition-all duration-300 ${
        selectedPkg.isFlagship 
          ? 'border-amber-400 bg-gradient-to-br from-amber-500/5 via-[var(--bg-card)] to-yellow-500/5' 
          : 'border-amber-500/30'
      }`}>
        {/* Header of Detail Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedPkg.iconBg} flex items-center justify-center font-black shadow-lg shrink-0`}>
              <selectedPkg.icon className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-lg sm:text-2xl text-[var(--text-primary)]">
                  {selectedPkg.title}
                </h3>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${selectedPkg.badgeColor}`}>
                  {selectedPkg.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold mt-1">
                الاستثمار:{' '}
                <span className={`font-black text-base ${selectedPkg.price === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedPkg.price === 0 ? 'مجاني تماماً 100%' : `${selectedPkg.price.toLocaleString('en-US')} ج.م`}
                </span>
                {' '}| مدة التنفيذ: <span className="text-[var(--text-primary)] font-bold">{selectedPkg.deliveryTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2 shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>مدة التسليم والمتابعة: {selectedPkg.deliveryTime}</span>
            </div>
          </div>
        </div>

        {/* 2-Columns Grid: Features Breakdown & Best Practices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Detailed Inclusions */}
          <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
            <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>ما تتضمنه هذه الباقة بدقة:</span>
            </h4>
            
            <div className="space-y-3">
              {selectedPkg.featuresIncluded.map((feat, idx) => (
                <div key={idx} className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] space-y-1 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </span>
                    <span>{feat.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-bold pr-7 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Target Audience & Best Execution Practices & Direct Actions */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Target Audience Card */}
              <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] space-y-2.5">
                <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>الأنشطة والفئة المستهدفة:</span>
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold leading-relaxed">
                  {selectedPkg.targetAudience}
                </p>
              </div>

              {/* Best Practices Card */}
              <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/30 space-y-3">
                <h4 className="font-black text-sm sm:text-base text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>إرشادات ونصائح النجاح:</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] font-bold">
                  {selectedPkg.idealPractices.map((practice, idx) => (
                    <li key={idx} className="leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={`https://wa.me/201143888355?text=${getWhatsAppMessage(selectedPkg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  selectedPkg.price === 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                    : selectedPkg.isFlagship
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black shadow-amber-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {selectedPkg.price === 0
                    ? 'طلب الظهور المجاني عبر واتساب 💬'
                    : selectedPkg.isFlagship
                      ? 'طلب استشارة باقة التأسيس الكبرى 💬'
                      : 'طلب هذه الباقة عبر واتساب فوراً 💬'}
                </span>
              </a>

              {onSelectPackage && (
                <button
                  type="button"
                  onClick={() => handleSelectForForm(selectedPkg.title)}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>اختيار هذه الباقة في طلب الإدراج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. COMPREHENSIVE 5-PACKAGE COMPARISON MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-xl text-[var(--text-primary)]">
              جدول المقارنة الشاملة بين باقات المنصة بالكامل 📊
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
              مقارنة تفصيلية دقيقة بين جميع الخيارات من الظهور المجاني وحتى باقة الانطلاق الكبرى (20 ألف ج.م)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                <th className="py-3.5 px-4 font-black text-xs sm:text-sm text-[var(--text-primary)]">الخدمة / الميزة</th>
                <th className="py-3.5 px-2.5 font-black text-xs sm:text-sm text-center text-emerald-600 dark:text-emerald-400">
                  الظهور المجاني (0 ج) 🎁
                </th>
                <th className="py-3.5 px-2.5 font-black text-xs sm:text-sm text-center text-blue-600 dark:text-blue-400">
                  التوثيق الأساسي (250 ج) 📍
                </th>
                <th className="py-3.5 px-2.5 font-black text-xs sm:text-sm text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-t-xl">
                  التأسيس والربط (750 ج) ⭐
                </th>
                <th className="py-3.5 px-2.5 font-black text-xs sm:text-sm text-center text-amber-600 dark:text-amber-400">
                  الإدارة VIP (2000 ج) 👑
                </th>
                <th className="py-3.5 px-2.5 font-black text-xs sm:text-sm text-center text-yellow-500 bg-amber-500/10 rounded-t-xl font-black">
                  الانطلاق الكبرى (20,000 ج) 🚀
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] text-xs sm:text-sm">
                    {row.feature}
                  </td>
                  
                  {/* Free */}
                  <td className="py-3.5 px-2.5 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{row.free}</span>
                    )}
                  </td>

                  {/* Basic */}
                  <td className="py-3.5 px-2.5 text-center">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs">{row.basic}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-3.5 px-2.5 text-center bg-emerald-500/5 font-bold">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">{row.pro}</span>
                    )}
                  </td>

                  {/* VIP */}
                  <td className="py-3.5 px-2.5 text-center font-bold">
                    {typeof row.vip === 'boolean' ? (
                      row.vip ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-amber-700 dark:text-amber-400 text-xs">{row.vip}</span>
                    )}
                  </td>

                  {/* Enterprise 20k */}
                  <td className="py-3.5 px-2.5 text-center bg-amber-500/10 font-bold">
                    {typeof row.enterprise === 'boolean' ? (
                      row.enterprise ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-sm">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold text-xs">—</span>
                      )
                    ) : (
                      <span className="font-black text-amber-600 dark:text-amber-400 text-xs">{row.enterprise}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
