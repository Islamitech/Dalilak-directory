# 🗺️ التوثيق المعماري الفني الشامل لخريطة «دليلك» (Dalelak Map Engine)

> **وثيقة مرجعية حصرية وخاصة بمنظومة خريطة دليلك في بوابة الدليل العام (`dalelak-directory-portal`)**  
> **تاريخ التحديث والاعتماد:** سبتمبر 2026  
> **الإصدار المعتمد:** v2.4 (Cadastral Numbered Map Edition)

---

## 📌 1. نظرة عامة والهوية الفنية للمنظومة

خريطة «دليلك» هي محرك كارتوغرافي تفاعلي فائق الأداء، مُصمم ومُعاير خصيصاً لخدمة النطاق الجغرافي لـ **هضبة حدائق الأهرام ومحافظة الجيزة**، مع قابلية التوسع لباقي المحافظات.

### الركائز الأساسية للمحرك:
1. **الخريطة المساحية التخطيطية الصفراء (Cadastral Numbered Base Layer):**
   - استبدال الخرائط التجارية الصامتة بنمط الخريطة المساحية الإنسانية الرسمية (OpenStreetMap Humanitarian HOT Style).
   - إظهار **جميع أرقام كتل المباني والقطع وعمارات حدائق الأهرام** بدقة متناهية بمجرد التقريب (Zooms 16 إلى 20).
   - خلفية باستيل صفراء هادئة ومريحة للعين (`#f5f3e9`) تبرز الشوارع والمباني مع خلو كامل 100% من الإعلانات أو التشتيت البصري.
2. **المضلعات الجغرافية للمناطق الـ 16 (Hollow Zone Focus):**
   - احتفاظ جميع المناطق بألوانها وتظليلها الطبيعي.
   - عند اختيار أو النقر على أي منطقة، **تتفرغ من الداخل تماماً** لتكشف أرقام المباني وقطع الأراضي بنقاء 100%، وتُحاط بخط حدودي عريض وبارز بلونها الأصلي مع تقريب سينمائي ناعم وسلس (60 FPS).
3. **التكامل الكارتوغرافي الميداني:**
   - بوابات حدائق الأهرام الـ 6 الرسمية كمعالم مدمجة بالخريطة.
   - دبابيس الأنشطة التجارية الفيكتورية (SVG) الملونة حسب القطاع والتصنيف مع خوارزمية تجميع ذكية (Screen-Space Clustering).
   - شريط تحكم علوي فائق النحافة (Ultra-compact ~32px) وإزالة تامة للشريط السفلي لمنح المستخدم رؤية واسعة ونقية على الهواتف والشاشات.

---

## 📂 2. شجرة الملفات المعتمدة ومسؤولياتها (Authoritative File Inventory)

تتبع الخريطة معمارية تفكيك صارمة (Decomposed Modular Architecture) تفصل بين الحالة (State)، والمحرك الكارتوغرافي (Map Instance)، والتكتل الجغرافي (Clustering)، وواجهات التحكم (UI Controls).

```
src/components/map/
├── README.md                      # 📄 هذا الملف التوثيقي المعتمد
├── index.ts                       # 📦 مجمع التصدير العام (Barrel Export)
├── types.ts                       # 📐 واجهات الخصائص والأنماط (TypeScript Interfaces)
├── badgeMarkers.ts                # 🎨 مولد دبابيس الفيكتور وكبسولات الأنشطة والتكتل
├── MapHeaderBar.tsx               # 🎛️ الشريط العلوي المصغر فائق النحافة (Ultra-compact)
├── MapFloatingControls.tsx        # 🕹️ أدوات التحكم الجانبية العائمة (التقريب، ضبط البوصلة)
├── MapSearchBox.tsx               # 🔍 شريط البحث الجغرافي السريع (في وضع Picker)
├── MapSelectedBusinessDrawer.tsx  # 📋 كارت الدرج المنبثق لتفاصيل النشاط المحدد
├── MapFooterBar.tsx               # ⚙️ شريط الإحداثيات (محفوظ ومفصول عن واجهة العرض العامة)
├── constants/
│   └── mapConstants.ts            # 🌐 ثوابت الإحداثيات، طبقات البلاطات، وقوائم التصنيفات
└── hooks/
    ├── useMapInstance.ts          # 🗺️ إدارة دورة حياة خريطة Leaflet والطبقات الأساسية
    ├── useMapState.ts             # 🧠 إدارة الحالة المحلية (الفلاتر، المنطقة المحددة، التوسيع)
    ├── useMapPinsClustering.ts    # 📍 التجميع الذكي للدبابيس، المضلعات، والبوابات
    ├── useMapGeolocation.ts       # 🛰️ محدد موقع المستخدم الحي عبر GPS
    └── useMapSearch.ts            # 🔎 البحث الجغرافي التنبؤي ومعالجة الإحداثيات
```

### جداول تفصيل الملفات ومسؤولياتها:

| الملف | المسؤولية والدور الفني | أهم التوابع والـ Exports |
| :--- | :--- | :--- |
| [`types.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/types.ts) | تعريف عقود الـ TypeScript لجميع المكونات والـ Props | `InteractiveMapProps`, `MapTileLayerType` |
| [`badgeMarkers.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/badgeMarkers.ts) | بناء دبابيس الـ DOM الفيكتورية (SVG) الملونة حسب التصنيف | `createLightweightBadgeHtml`, `createLightweightClusterHtml` |
| [`MapHeaderBar.tsx`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/MapHeaderBar.tsx) | شريط التحكم العلوي المدمج (منطقة، خريطة، بوابات، مناطق، أنشطة، فلاتر) | `MapHeaderBar` |
| [`constants/mapConstants.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/constants/mapConstants.ts) | إحداثيات المحافظات، روابط بلاطات الخرائط، والتصنيفات | `GOVERNORATE_COORDS`, `MAP_QUICK_CATEGORIES` |
| [`hooks/useMapInstance.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/hooks/useMapInstance.ts) | تهيئة Leaflet، ربط البلاطات المساحية، والتحكم في الكاميرا | `useMapInstance` |
| [`hooks/useMapState.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/hooks/useMapState.ts) | إدارة حالة الواجهة: `selectedZone`، `tileLayer`، `showBusinesses` | `useMapState` |
| [`hooks/useMapPinsClustering.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/hooks/useMapPinsClustering.ts) | رسم المضلعات، التجميع الذكي للأنشطة، وتحديث الستايل بدون Lag | `useMapPinsClustering` |
| [`hooks/useMapGeolocation.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/hooks/useMapGeolocation.ts) | تحديد الموقع الفعلي بدقة GPS ورسم دائرة الدقة | `useMapGeolocation` |
| [`hooks/useMapSearch.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/components/map/hooks/useMapSearch.ts) | البحث عن العناوين والشوارع وتوجيه الدبوس | `useMapSearch` |

---

## 🗺️ 3. الطبقة المساحية التخطيطية (Cadastral Numbered Tile Layer)

### المواصفات الفنية المعتمدة:
- **المعرف (Key):** `'dalelak-clean'` (الافتراضي الأول للمنظومة).
- **الرابط المعتمد:**
  ```
  https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png
  ```
- **المخدمات الفرعية (Subdomains):** `['a', 'b', 'c']`.
- **مستويات التكبير:**
  - `maxNativeZoom: 19` (أعلى دقة تصوير مساحي للبلاطات).
  - `maxZoom: 20` (تكبير رقمي فائق لسهولة القراءة على الهواتف).
- **خصائص الأداء:**
  - `keepBuffer: 8` (تحميل مسبق للبلاطات المجاورة لمنع وميض الخريطة أثناء الحركة).
  - `crossOrigin: true` (توافق كامل مع سياسات المتصفحات).
- **سياسات الحماية (Content Security Policy):**
  - تم تضمين `https://*.tile.openstreetmap.fr` و `https://*.openstreetmap.fr` في سياسات CSP لملف `vercel.json` و `server.ts` لضمان عدم حظرها على متصفحات الإنتاج.

---

## 📐 4. محرك مضلعات مناطق حدائق الأهرام (16 Districts Engine)

### 1. مصدر البيانات الجغرافية
تعتمد الخريطة على ملف البيانات الميدانية المعايرة:
[`src/data/hadayekDistrictsGeoData.ts`](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/dalelak-directory-portal/src/data/hadayekDistrictsGeoData.ts)
يحتوي على إحداثيات مضلعات الحدود الحقيقية لجميع مناطق حدائق الأهرام الـ 16:
`أ، ب، ج، د، هـ، و، س، ص، ع، ن، ل، ط، ك، ح، ز، م` مع الألوان والسنترويد الدقيق لكل منطقة.

### 2. سلوك التلوين الطبيعي الافتراضي
- جميع المناطق الـ 16 تظهر بألوانها الرسمية الخاصة.
- تظليل داخلي هادئ: `fillColor: district.color`, `fillOpacity: 0.10`.
- إطار حدودي: `color: district.color`, `weight: 1.5`, `opacity: 0.85`.

### 3. سلوك التحديد والتفريغ الذكي (Hollow Selection)
عند انتقال المستخدم لمنطقة معينة (عبر القائمة العلوية أو بالنقر المباشر على مضلع المنطقة):
1. **المنطقة المحددة فقط (Selected District):**
   - **تتفرغ من الداخل تماماً:** `fill: false` مع `fillOpacity: 0` لكشف شبكة الشوارع وأرقام المباني بدقة 100%.
   - **إطار حدودي بارز بلونها الأصلي:** `color: district.color`, `weight: 3.5`, `opacity: 1.0` (دون أي خط أسود أو تشويه).
2. **باقي المناطق الأخرى:**
   - **تظل محتفظة بألوانها وتظليلها الطبيعي الكامل** (`fillColor: district.color`, `fillOpacity: 0.10`) دون أي تغيير أو حذف.
3. **السلاسة والانسيابية الفائقة (60 FPS - Decoupling):**
   - تم عزل تحديث ستايل المضلعات في تأثير خفيف جداً عبر `polygon.setStyle(...)` دون إعادة تشغيل تجميع الدبابيس لـ 2000+ نشاط.
   - حركة الكاميرا تعتمد الانتقال السينمائي الناعم:
     ```typescript
     map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 17, duration: 1.0 });
     ```

---

## 🚪 5. طبقة بوابات حدائق الأهرام الـ 6 الرسمية (Landmark Gates Layer)

تُعرض البوابات الست كمعالم جغرافية رئيسية مدمجة بالخريطة:
1. **بوابة خوفو (1):** مدخل شارع الجيش / طريق مصر الفيوم.
2. **بوابة أحمس (2 الجديدة):** مدخل شارع الضغط العالي الأوسط.
3. **بوابة خفرع (2):** طريق القاهرة - الفيوم الصحراوي.
4. **بوابة منقرع (3):** مدخل شارع النادي.
5. **بوابة حورس (4 الجنوبية):** مدخل طريق الواحات.
6. **بوابة مينا (4 الغربية):** مدخل شارع الثروة المعدنية / الطريق الدائري.

### المميزات التفاعلية للبوابة:
- رقم البوابة الفيكتوري داخل دائرة ملونة مميزة.
- اسم البوابة الشعبي والمعتمد.
- نافذة منبثقة (Popup) تتضمن: الطريق المؤدي، المناطق المخدومة، وزر توجيه وملاحة مباشر عبر **Google Maps Direction**.

---

## 📍 6. طبقة دبابيس وتصنيفات الأنشطة والتكتل الذكي (Business Pins)

### دبابيس الفيكتور (`badgeMarkers.ts`):
- دبابيس مبرمجة بـ SVG فائق الخفة بدون صور خارجية لتوفير استهلاك الذاكرة.
- ألوان وهوية فيكتور لكل تصنيف:
  - 🍔 **مطاعم وكافيهات:** برتقالي كهرماني `#f59e0b` مع شوكة وملعقة.
  - 🛒 **سوبرماركت وبقالة:** زمردي `#10b981` مع عربة تسوق.
  - 💊 **صيدليات ومراكز طبية:** سماوي `#0284c7` مع كبسولة ورعاية.
  - 👗 **أزياء وموضة:** بنفسجي `#8b5cf6` مع قميص.
  - 🚗 **سيارات وصيانة:** وردي أحمر `#f43f5e` مع مركبة.
  - 🏬 **خدمات ومحلات:** نيلي `#6366f1` مع متجر.

### التكتل الذكي (Screen-Space Marker Clustering):
- خوارزمية تكتل سريعة بحساب المسافة الشاشية (~52px).
- تجميع دبابيس الأنشطة القريبة في كبسولة تكتل دائرية أنيقة تعرض عدد الأنشطة بخط عربي واضح.
- عند النقر على التكتل، تتوسع الخريطة تلقائياً بملاءمة الأنشطة المجمعة (`fitBounds`).

---

## 🎛️ 7. الشريط العلوي فائق النحافة (Ultra-Compact Header)

تم تقليص ارتفاع الشريط العلوي من ~140px إلى **~32px** فقط، وإلغاء جميع النصوص التوضيحية الإرشادية الطويلة لتحقيق أقصى استغلال لمساحة الشاشة:

```
[ 🧭 المنطقة... ▾ ] [ 🗺️ مساحية ▾ ] [☑ بوابات] [☑ مناطق] [☑ أنشطة] | [فلاتر] [استكشف 🧭] [⛶]
```

- **قائمة المنطقة:** اختيار فوري لأي منطقة من (أ إلى م) والانتقال إليها بانسيابية.
- **قائمة الخريطة:** التبديل الفوري بين `🗺️ مساحية (أرقام المباني)` و `📍 جوجل`.
- **مربعات التحكم الخفيفة:** تحكم مباشر بنقرة واحدة في إظهار أو إخفاء (البوابات، تقسيمات المناطق، دبابيس الأنشطة).
- **الأزرار السريعة:**
  - `فلاتر`: قائمة منبثقة لاختيار تصنيف النشاط أو عرض الموثق فقط.
  - `استكشف`: التوجيه السريع لصفحة البحث الدليلي الكاملة (`/search`).
  - `⛶`: التوسيع أو الخروج من وضع الشاشة الكاملة.

---

## 🛡️ 8. معالجات الأمان وتجربة المستخدم (UX Safeguards)

1. **إزالة المستطيل الأسود نهائياً:**
   - حذف تول تيب `polygon.bindTooltip` المستطيل الذي كان ينبثق عند التحديد.
   - تطبيق قواعد CSS صارمة لمنع إطار التركيز للمتصفح:
     ```css
     .leaflet-container path,
     .leaflet-interactive,
     .hadayek-district-polygon,
     .hadayek-district-polygon-selected {
       outline: none !important;
       border: none !important;
       box-shadow: none !important;
       -webkit-tap-highlight-color: transparent !important;
     }
     ```
   - عمل `blur()` فوري عند النقر لإلغاء أي Bounding Box من المتصفح.
2. **إلغاء الشريط السفلي تماماً:**
   - حذف شريط الإحداثيات وزر النسخ لتصبح الخريطة ممتدة بكامل الارتفاع بدون أي عوائق بصرية.

---

## 🚀 9. دليل المزامنة والإنتاج (Production & Deployment)

الخريطة متزامنة بين مستودعين مستقلين:
1. **مستودع بوابة الدليل العام:**
   `https://github.com/Islamitech/Dalilak-directory.git` (فرع `main`).
2. **مستودع المنظومة الأساسية:**
   `git@github.com:Islamitech/Dalilak.git` (فرع `main`).

كلا المستودعين تم إعدادهما لاجتياز اختبارات بناء TypeScript و Vite بنجاح كامل (0 أخطاء) والنشر التلقائي المعتمد على **Vercel**.
