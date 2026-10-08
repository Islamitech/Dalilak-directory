# منصة دليلك — البوابة العامة (Dalilak Public Directory)

التطبيق العام للجمهور، مخصص لعرض الأنشطة التجارية والخدمية والبحث عنها في مصر وحدائق الأهرام.

## المميزات الأساسية
- 🗺️ خريطة تفاعلية مدعومة بنظام تصنيف وعنونة جغرافية دقيقة
- 🔍 بحث وتصفية فورية وسريعة للأنشطة والخدمات
- 📄 صفحات مخصصة للأنشطة مع دعم كامل للـ SEO وOpen Graph
- 📱 تطبيق ويب تقدمي (PWA) مع دعم العمل دون اتصال (Offline Shell)
- 🔒 حماية معمارية صارمة وأمان للبيانات بدون تسريب للمفاتيح السرية

## البنية الأساسية
- `src/`: كود الواجهة الأمامية للمنصة العامة (React 19 + TypeScript + Tailwind CSS)
- `api/`: دوال Serverless للـ Open Graph، الـ Sitemap، ومطابقة الأماكن
- `public/`: الأيقونات، الشعار، ملفات PWA، وتهيئة SEO (`robots.txt`, `llms.txt`)
- `scripts/`: أدوات التحقق المعماري وبوابات الجودة (Quality Gates)
- `index.html`: نقطة الدخول الرئيسية للتطبيق

## متطلبات التشغيل
- Node.js (>= 22.0.0)
- npm (>= 10.0.0)

## التشغيل المحلي

1. **الانتقال إلى مجلد المشروع:**
   ```bash
   cd Dalilak-clean
   ```

2. **تثبيت الاعتماديات:**
   ```bash
   npm ci
   ```

3. **إعداد متغيرات البيئة:**
   انسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```
   وعيّن القيم المطلوبة:
   - `VITE_SUPABASE_URL`: رابط مشروع Supabase (للواجهة)
   - `VITE_SUPABASE_ANON_KEY`: المفتاح العام لـ Supabase (للواجهة)
   - `SUPABASE_URL`: رابط مشروع Supabase (للخادم / Serverless)
   - `SUPABASE_ANON_KEY`: المفتاح العام لـ Supabase (للخادم / Serverless)
   - `GOOGLE_PLACES_API_KEY`: مفتاح Google Places للخادم فقط (يُستخدم عبر `api/google-place-resolver.ts` — **بدون بادئة `VITE_`** لضمان عدم تسريبه في كود المتصفح).

4. **تشغيل خادم التطوير:**
   ```bash
   npm run dev
   ```
   الوصول عبر المتصفح: `http://localhost:5173`

## الفحص والبناء
- **الفحص المعماري والنوعي:**
  ```bash
  npm run check:architecture
  npm run lint
  ```
- **تشغيل حزمة الاختبارات الشاملة:**
  ```bash
  npm test
  ```
- **فحص خلو الكود من الأسرار:**
  ```bash
  npm run check:secrets
  ```
- **بناء الإنتاج:**
  ```bash
  npm run build
  ```
