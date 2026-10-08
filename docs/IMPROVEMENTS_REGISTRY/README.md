# 🏛️ سجل ومستودع التحسينات الهندسية الشامل (Dalilak Improvements Registry)
**موقع السجل:** `c:\Users\Ahmed\Desktop\Dalelak_Apps_Export\Dalilak-directory_Production_Clean\IMPROVEMENTS_REGISTRY`  
**الغرض:** حفظ وتوثيق كافة التحسينات المكتشفة وتعديلات الأكواد بدقة تامة دون المساس بالملفات المصدرية الحالية مباشرة، لتكون جاهزة للمراجعة والدمج الآمن في أي وقت.

---

### 📂 محتويات السجل:

1. **[00_APPLIED_IMPROVEMENTS_APPLICATION_GUIDE.md](./00_APPLIED_IMPROVEMENTS_APPLICATION_GUIDE.md):**
   - الدليل الشامل لكافة التحسينات الأساسية التي تم إنجازها والتحقق منها بنجاح (سلاسة الخريطة، قفل حدود حدائق الأهرام، فك تكتل الدبابيس بانحراف جغرافي صفر متر، شريط الأقسام السريعة، محول الطبقات مع القمر الصناعي Google Hybrid، عداد الأنشطة الحي، واختصارات البحث).

2. **[01_MOBILE_UX_OPTIMIZATION_PACKAGE.md](./01_MOBILE_UX_OPTIMIZATION_PACKAGE.md):**
   - حزمة تحسينات تجربة المستخدم على الهواتف الذكية (iOS & Android):
     - حل مشكلة حجب كارت النشاط بواسطة شريط التنقل السفلي (`MobileBottomNav`).
     - ضبط التمرير الفيزيائي للأقسام باللمس (`Touch Momentum`).
     - معايير مساحات اللمس (44px Minimum Touch Targets).
     - الإخفاء التلقائي للوحة المفاتيح عند لمس قائمة النتائج.
     - مراعاة المساحات الآمنة (`Safe Area Insets`).

3. **[02_PERFORMANCE_AND_IMAGE_OPTIMIZATION.md](./02_PERFORMANCE_AND_IMAGE_OPTIMIZATION.md):**
   - ترشيد استهلاك بيانات الهاتف وتسريع تحميل الصور عبر Unsplash CDN و WebP التلقائي.

4. **[03_ACTIVITY_DETAIL_MODAL_ENHANCEMENT.md](./03_ACTIVITY_DETAIL_MODAL_ENHANCEMENT.md):**
   - تحسين نافذة تفاصيل المنشأة: قفل تمرير خلفية الصفحة لمنع تشتت المستخدم، دعم زر `Escape` للإغلاق، وتفعيل قائمة مشاركة الهاتف الأصلية (`Native Web Share`).

5. **[04_NAVBAR_AND_LOCATION_PICKER_MOBILE_RESPONSIVENESS.md](./04_NAVBAR_AND_LOCATION_PICKER_MOBILE_RESPONSIVENESS.md):**
   - معالجة تموضع قائمة اختيار المناطق على الهواتف الضيقة لمنع خروجها عن الشاشة (`Viewport Overflow Fix`) وإضافة تعتيم الخلفية بنقرة واحدة للإغلاق.

6. **[05_ARABIC_INDIC_PHONE_NUMERALS_NORMALIZATION_FIX.md](./05_ARABIC_INDIC_PHONE_NUMERALS_NORMALIZATION_FIX.md):**
   - إصلاح جذري لعطل أرقام الهواتف المكتوبة بالأرقام العربية (٠-٩): تحويلها تلقائياً لأرقام معيارية لمنع تعطل أزرار الواتساب والاتصال الهاتفي وحفظ جهات الاتصال.

7. **[06_ARABIC_NUMERALS_NORMALIZATION_FOR_STREETS_AND_SEARCH.md](./06_ARABIC_NUMERALS_NORMALIZATION_FOR_STREETS_AND_SEARCH.md):**
   - تمكين البحث التبادلي عن أرقام العمارات والبوابات والشوارع بالأرقام العربية والإنجليزية (مثال: `عمارة 150` و `عمارة ١٥٠`) لإنهاء مشكلة "النتائج الصفرية الزائفة".

8. **[07_HADAYEK_GATES_MODAL_MOBILE_NAVIGATION_ENHANCEMENT.md](./07_HADAYEK_GATES_MODAL_MOBILE_NAVIGATION_ENHANCEMENT.md):**
   - تحسين نافذة دليل بوابات حدائق الأهرام: قفل تمرير الخريطة بالخلفية، دعم زر `Escape`، تصحيح مسار الملاحة المباشر في Google Maps وتجاوب تذييل النافذة على الموبايل.

9. **[08_FAVORITES_CROSS_TAB_SYNC_AND_SMART_FILTERING.md](./08_FAVORITES_CROSS_TAB_SYNC_AND_SMART_FILTERING.md):**
   - تزامن قائمة المفضلة حياً عبر كافة التبويبات المفتوحة (`Cross-Tab Storage Sync`)، والفرز التلقائي للأقرب مسافة، مع شرائح فلترة الأقسام داخل المفضلة.

10. **[09_PRESERVE_ROUTE_ON_MODAL_CLOSE_FIX.md](./09_PRESERVE_ROUTE_ON_MODAL_CLOSE_FIX.md):**
    - إصلاح جذري لعطل التوجيه القسري: منع طرد المستخدم من الخريطة أو المفضلة إلى صفحة البحث عند إغلاق نافذة تفاصيل أي نشاط.

11. **[10_VIDEO_MODAL_MOBILE_AUTOPLAY_AND_ACTIONS_ENHANCEMENT.md](./10_VIDEO_MODAL_MOBILE_AUTOPLAY_AND_ACTIONS_ENHANCEMENT.md):**
    - تحسين مشغل الفيديو الميداني: معالجة سياسة التشغيل التلقائي للموبايل، تصحيح روابط الواتساب والاتصال بالأرقام العربية، وتفعيل زر الموقع التلقائي للإحداثيات.

12. **[11_OFFLINE_RESILIENCE_AND_LEAFLET_PWA_CACHING.md](./11_OFFLINE_RESILIENCE_AND_LEAFLET_PWA_CACHING.md):**
    - صمود التطبيق في وضع عدم الاتصال وتخزين محرك الخريطة في PWA Service Worker مع شارة تنبيه ذكية عند انقطاع الإنترنت.

13. **[12_MAP_QUICK_CHIPS_CATEGORY_TAXONOMY_ALIGNMENT.md](./12_MAP_QUICK_CHIPS_CATEGORY_TAXONOMY_ALIGNMENT.md):**
    - مطابقة الفئات التصنيفية لشرائح الخريطة السريعة والتحليل الفوري O(1) لضمان ظهور كافة المحلات عند الضغط على الشرائح المفردة (صيدلية، مطعم، مخبز).

14. **[13_FOR_BUSINESS_LEAD_FORM_AND_WHATSAPP_ENHANCEMENT.md](./13_FOR_BUSINESS_LEAD_FORM_AND_WHATSAPP_ENHANCEMENT.md):**
    - تحسين شامل لنموذج إضافة الأنشطة التجارية والتكامل مع واتساب: معالجة الأرقام العربية، التحقق التفاعلي، خيارات بوابات حدائق الأهرام، ورابط Google Maps مع حماية من حظر النوافذ المنبثقة.

15. **[14_SMART_SEARCH_BAR_ACCESSIBILITY_AND_ARABIC_SUGGESTIONS.md](./14_SMART_SEARCH_BAR_ACCESSIBILITY_AND_ARABIC_SUGGESTIONS.md):**
    - ترقية شريط البحث الذكي: إدماج محرك التطبيع العربي في المقترحات المنسدلة، إغلاق القائمة الآمن باللمس دون توقيتات هشة، إنزال لوحة مفاتيح الموبايل تلقائياً، وإمكانية حذف عناصر مفردة من سجل البحث.

16. **[15_BUSINESS_PRICING_VIEW_CONVERSION_AND_TRUST_ENHANCEMENT.md](./15_BUSINESS_PRICING_VIEW_CONVERSION_AND_TRUST_ENHANCEMENT.md):**
    - تعزيز صفحة باقات الأنشطة التجارية: إضافة قسم تفاعلي للأسئلة الشائعة (FAQ)، شارات الثقة والضمانات الرسمية (InstaPay، الفاتورة الرسمية، التوثيق الدائم)، وتسهيل الوصول لزر الاستشارة المباشرة.

17. **[16_SHOWCASE_PHOTO_LIGHTBOX_GESTURES_AND_ACCESSIBILITY.md](./16_SHOWCASE_PHOTO_LIGHTBOX_GESTURES_AND_ACCESSIBILITY.md):**
    - ترقية عارض الصور (Lightbox): قفل تمرير خلفية الصفحة، دعم التنقل بالأسهم وEscape، إيماءة السحب لأسفل للإغلاق بالموبايل (Swipe-Down Dismiss)، ومؤشر تحميل تفاعلي.

18. **[17_SEARCH_EMPTY_STATE_AND_DIRECTORY_LEADS_ENHANCEMENT.md](./17_SEARCH_EMPTY_STATE_AND_DIRECTORY_LEADS_ENHANCEMENT.md):**
    - تحويل شاشة انعدام النتائج إلى واجهة تفاعلية ذكية: تمكين الزائر من اقتراح إضافة المكان المفقود مباشرة عبر واتساب، مع دعوة مباشرة لأصحاب الأنشطة لإدراج محلاتهم مجاناً.

19. **[18_CINEMATIC_CAMERA_FLIGHT_RESTORATION.md](./18_CINEMATIC_CAMERA_FLIGHT_RESTORATION.md)** — ✅ **منفَّذ ومتحقَّق بالكامل (2026-10-05)**:
    - استعادة الرحلة السينمائية لكاميرا الخريطة عند تغيير المنطقة (نمط الأرشيف `b63ebc5`): تمهيد بلاط المنطقة مسبقاً، تحديث التظليل قبل الانطلاق لمنع الوميض، حركة قوسية/انزلاقية بمدد متدرجة، وقفل الارتجاج أثناء الرحلة — مدمجاً بأمان داخل المعمارية الحديثة (`CameraController` بأولوية `zone`).
    - التحقق القاطع: 0 إخفاقات في المسبار السلوكي الموثَّق (§6.2 في الوثيقة)، مع إصلاح جذري إضافي لسباق ازدواج نسخة Leaflet تحت `React.StrictMode` (إعادة كتابة `leafletLoader.ts` بنمط Single-Flight + اختبار انحدار).

20. **[19_LARGE_SCREEN_LAYOUT_FIXES_AND_RTL_CENTERING.md](./19_LARGE_SCREEN_LAYOUT_FIXES_AND_RTL_CENTERING.md)** — ✅ **منفَّذ ومتحقَّق بالكامل (2026-10-05)**:
    - إصلاحات نمط الشاشات الكبيرة (Desktop ≥ 1024px): فك انحباس التمرير وقصّ المحتوى في المسارات الخمسة غير الخاصة بالخريطة (حتى 1123px محتوى مقطوع)، تصحيح تمركز 5 عناصر مكسورة في RTL بنمط `start-1/2`، وحلّ تداخل مفتاح تبديل العرض مع بطاقات البحث — بقياسات فعلية لكل مقاس شاشة.
    - التحقق القاطع: 0 عناصر مقصوصة و0 تداخل في كل المسارات والمقاسات (1024/1280/1920)، مع أدلة قبل/بعد مؤرشفة في `verification/evidence/` (§7.1 في الوثيقة).

21. **[20_DESKTOP_DARK_LEAK_AND_TWO_PANE_OVERLAY_FIXES.md](./20_DESKTOP_DARK_LEAK_AND_TWO_PANE_OVERLAY_FIXES.md)** — ✅ **منفَّذ ومتحقَّق بالكامل (2026-10-05)** (بنود 4–10 من جدول عيوب الديسكتوب، مع مصفوفة تسوية للبنود 1–3 المُصلَحة سابقاً بالوثيقة 19):
    - تحييد تسرب فئات `dark:` المنهجي (الخيار أ): **حذف 284 توكن من 24 ملفاً** + `@source not "../docs";` في `src/index.css:5` — ناتج البناء النهائي: **0 استعلام `prefers-color-scheme` و0 فئة `dark:` فعّالة**؛ ومسبار الوضع الداكن أثبت ثبات الخلفيات نهاريةً (والمحاكاة قبل-الإصلاح أعادت الأزرق الداكن الثلاثي فأثبتت الآلية وزوالها)، واختبار `rtl_theme_tokens.test.ts` بقي بلا أي تعديل وأخضر.
    - إصلاحات الهيكل الثنائي (Two-Pane) والمفتوحات: إخفاء مفتاح العرض الزائد داخل الخريطة بمفتاح نمط العرض فقط (`lg:hidden`)، فك التصاق أدوات الخريطة بالفاصل، تحرير زر الواتساب إلى جهة الخريطة، اقتطاع الاسم الإنجليزي ببداية مرئية (`dir="auto"` على الـ h4 مع بقاء الـ bdi)، إرساء نافذة التفاصيل جهة الخريطة، وحصر درج العمارة داخل لوح الخريطة.
    - التحقق القاطع: **0px² تقاطعات** للنافذة/الدرج مع قائمة الأنشطة و**16px فجوة ثابتة** عن الفاصل في 1024/1280/1920؛ مسابر Playwright كاملة (بوضع داكن + 3 مقاسات + بطاقة إنجليزية طويلة + انحدار موبايل 390px على 5 مسارات) مع أدلة خام مؤرشفة في `verification/evidence/` (JSON + 22 لقطة) — والتفاصيل في §10.1 من الوثيقة.

---

### 🛡️ التزام الحوكمة (Zero-Defect Commitment):
- كافة الحلول الموثقة هنا اجتازت فحص الأنواع الصارم `npx tsc --noEmit` واختبار البناء `npm run build` بنتيجة نجاح قطعية `Code 0`.
- **الوثائق 18 و19 و20 (البنود 19–21 بالسجل) نُفِّذت ومُتحقَّق منها بالكامل** بموجب طلبات التنفيذ المصرَّح بها — والتغييرات متروكة في شجرة العمل دون أي التزام (commit)، وجاهزة لمراجعتك قبل الدمج. وثيقة 20 تحديداً لم تُمَس فيها أي ملفات اختبار إطلاقاً (شرط الخيار أ).
- بقية وثائق هذا السجل لا تزال **خططاً موثقة** لم تُطبَّق على ملفات الأكواد إلا بموافقة صريحة، وستستمر الإضافات القادمة بنفس الدقة والاحترافية.
