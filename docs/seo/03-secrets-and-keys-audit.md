# تقرير تدقيق المفاتيح السرية في سجل Git وتوصيات التدوير (Secrets & Keys Audit)
**وثيقة تتبع أمني لمنصة دليلك**
**المسار:** `docs/seo/03-secrets-and-keys-audit.md`

---

## 1. ملخص الفحص (Scan Summary)

بناءً على فحص سجل تاريخ Git عبر `git log -p` وأدوات فحص التسريبات (Gitleaks Scan عبر 209 تكرار التزام)، تم رصد **18 موضعاً تاريخياً** تحتوي على مفاتيح API ومفاتيح مصادقة تم الالتزام بها سابقاً قبل عزل ملفات التكوين.

> [!CAUTION]
> بموجب قواعد الأمان الصارمة: **لا يتم تعديل أو إعادة كتابة تاريخ Git القديم بدون موافقة صريحة**، ولكن يجب فوراً اتباع خطوات تدوير المفاتيح (Key Rotation) لإبطال فاعلية أي مفتاح مكشوف.

---

## 2. قائمة المفاتيح والمواضع المرصودة في سجل Git (Historical Findings)

| المعرّف (Commit) | الملف المستهدف | نوع المفتاح المرصود | درجة الخطورة |
| :--- | :--- | :--- | :--- |
| `9089292` | `api/google-place-resolver.ts:184` | **GCP / Google Places API Key** | 🔴 **حرجة (Critical)** |
| `c1f4e38` | `verification/baseline/api/biz-og.ts:5` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `c1f4e38` | `verification/baseline/api/sitemap.ts:4` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `c1f4e38` | `verification/baseline/api/share.ts:6` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `c1f4e38` | `verification/baseline/src/services/supabaseClient.ts:9` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `c1f4e38` | `verification/source-before.json:6` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `dca2718` | `src/services/supabaseClient.ts:9` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `e0c4f57` | `src/components/activity/ActivityDetailModal.tsx:115` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `46a003d` | `api/sitemap.ts:4` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `d4aa9b1` | `src/components/PublicShowcase.tsx:237` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `3e20772` | `src/components/PublicShowcase.tsx:228` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `8f3af09` | `api/biz-og.ts:5` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `8f3af09` | `api/share.ts:6` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `f7e080c` | `src/App.tsx:8` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `f7e080c` | `src/services/storage.ts:4` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `606122d` | `src/services/storage.ts:4` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |
| `b774a17` | `src/App.tsx:7` | Supabase Anon / Publishable Key | 🟡 متوسطة (Public Anon) |

---

## 3. خطة وتوصيات تدوير المفاتيح (Key Rotation & Remediation Steps)

### أ) مفتاح Google Places API Key (الالتزام `9089292`)
1. الدخول إلى [Google Cloud Console -> APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials).
2. تحديد المفتاح القديم، ثم النقر على **Regenerate Key** أو إنشاء مفتاح جديد وحذف المفتاح القديم.
3. تقييد المفتاح الجديد (API Restrictions) بحيث يقتصر فقط على:
   - Places API (New)
   - Geocoding API
4. تقييد التطبيق (Application Restrictions) بحيث يقتصر على:
   - عناوين IP الخاصة بخوادم Vercel Serverless.
5. تحديث المفتاح الجديد في لوحة تحكم Vercel Environment Variables فقط (`GOOGLE_PLACES_API_KEY`).

### ب) مفاتيح Supabase (Publishable & Anon Key)
1. على الرغم من أن مفتاح `anon` هو مفتاح عام للقراءة، إلا أنه من الأفضل أمنياً تدويره إذا كانت هناك سياسات RLS صارمة.
2. التوجه إلى لوحة تحكم Supabase: `Project Settings -> API -> Project API Keys`.
3. إصدار مفتاح جديد (Roll Keys) إذا لزم الأمر، وتحديثه في Vercel Dashboard والملف المحلي المجهول `.env`.
4. التأكد من تطبيق سياسة RLS الصارمة لمنع أي عمليات إدخال أو تعديل باستخدام المفتاح العام.
