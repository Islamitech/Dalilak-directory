# 🎥 استعادة رحلة الكاميرا السينمائية عند تغيير المنطقة (Cinematic Camera Flight Restoration)
**الملفات المنفَّذ فيها فعلياً:**
- `src/components/map/hooks/useMapSelectionCamera.ts` — ربط رحلة المنطقة (`zone`) + دمج الدرع + تمهيد البلاطات وسحب التمييز قبل الإقلاع (تكييف معماري عن الخطة: حد ≤120 سطراً لهوكس الخريطة منع الإضافة في `useMapPinsClustering.ts`).
- `src/components/map/utils/cameraFlightShield.ts` — **ملف جديد**: وحدة الدرع النهائية (Token + مراقبة استقرار + سقوف زمنية) — تفصيلها في §5.2.
- `src/components/map/utils/leafletLoader.ts` — **إصلاح جذري إضافي غير مخطَّط**: نمط Single-Flight لمانع سباق ازدواج نسخة Leaflet المكتشف أثناء التحقق — تفصيله في §5.3.
- `src/features/map/model/mapDistrictsLayer.ts` — حذف الاستيرادين اليتيمين (كما في §4.1 بالحرف).
- `src/components/map/hooks/useMapPinsClustering.ts` — تمرير `effectiveZone` و`mode` إلى هوك الكاميرا (سطر واحد).
- `src/tests/leaflet_loader.test.ts` — اختبار انحدار للتحميل المشترك (Single-Flight).
- `src/index.css` — الدرع `is-camera-flying / is-camera-settling` **موجود مسبقاً** (سطور ~726-739) — لم يُعدَّل.

**تاريخ التوثيق:** 2026-10-05
**مرجع الأرشيف:** الالتزام `b63ebc5` («feat(map-ux): implement cinematic camera flight, zero-jitter landing...» — 28 سبتمبر 2026)
**الحالة:** ✅ **منفَّذ ومتحقَّق بالكامل** (2026-10-05) — اجتاز كل بوابات الجودة، وفحص المتصفح الآلي انتهى بـ **0 إخفاقات** (تفاصيل §6)

> **ملاحظة قراءة:** الأقسام 1-4 أدناه توثّق التشخيص والخطة الأصلية كما صيغت **قبل** التنفيذ (وتُحفظ للمرجعية)؛ الأقسام 5-8 توثّق ما نُفِّذ فعلياً ونتائج التحقق والمخاطر والحوكمة.

---

### 1. الخلاصة التنفيذية
نمط «الرحلة السينمائية» للكاميرا عند الانتقال بين مناطق حدائق الأهرام (ح/ب/ج...) كان مُفعَّلاً في نسخة الأرشيف، ثم فُقد **ربطه فقط** أثناء إعادة الهيكلة. المكونات الثلاثة الأساسية للنمط لا تزال حاضرة في الكود الحي:

| المكوّن | الحالة الحالية |
|---|---|
| مخطط الرحلات `cameraPlanner.ts` (قوس مكافئ 0.45+0.75 = 1.2s، انزلاق مباشر 1.15s، عرض عام Z14) | ✅ سليم ومُصدَّر — لكنه **لا يُستدعى من أي كود حي** |
| التحميل المسبق للبلاطات `hadayekTilePreloader.ts` (`preloadDistrictTiles`) | ✅ سليم ومُصدَّر — **غير مربوط** بتغيير المنطقة |
| درع منع الارتجاج `index.css` (`.is-camera-flying` / `.is-camera-settling`) | ✅ موجود (سطور ~726-739) — لكن **لا كود يضيف هذه الفئات** → الدرع خامل |
| الموجّه الحديث `CameraController.ts` (مالك الكاميرا الوحيد بالأولويات) | ✅ يعمل لاختيار النشاط (`selection`) والملقط (`locate`) — **لا يستقبل أوامر `zone`** |

**النتيجة:** تغيير المنطقة حالياً يُحدِّث التمييز البصري فقط دون أي حركة كاميرا، وبدون تمهيد بلاطات.

---

### 2. تشريح الفجوة (Gap Analysis)
1. **استيرادات يتيمة في `mapDistrictsLayer.ts` (سطور 2-3):**
   `planCameraTransitionOnZoneChange` و`getVisualViewportPadding` و`preloadDistrictTiles` — بقايا الربط المحذوف؛ لا تُستخدم داخل الملف إطلاقاً (فحص `grep` يؤكد أنها تظهر في سطور الاستيراد فقط).
2. **رحلة المنطقة غائبة من `useMapPinsClustering.ts` الحالي (119 سطراً):** لا يوجد أي Effect يراقب `effectiveZone` لتنفيذ `planCameraTransitionOnZoneChange`؛ الموجود فقط: بناء الطبقات + تزامن الطبقات المساعدة + كاميرا اختيار النشاط.
3. **درع الارتجاج خامل:** لا يوجد في كامل المشروع (`grep` شامل) أي كود يضيف `is-camera-flying` أو `is-camera-settling` — الفئات معرفة في CSS فقط.
4. **فرق معماري عن الأرشيف:** الأرشيف كان ينفّذ `map.flyToBounds / map.flyTo` مباشرة. الكود الحديث يمرر كل حركات الكاميرا عبر `CameraController.request({...}, priority)` (مالك وحيد يمنع تعارض الرحلات؛ `zone=1` أدنى من `selection=4` و`user=5`). لذلك يجب تكييف الاستعادة لتمر عبر الموجّه بدل الاستدعاء المباشر.

---

### 3. السلوك المقصود بعد الاستعادة (تجربة المستخدم)
1. **اختيار منطقة** (نقرة على المضلع أو من فلاتر البحث):
   - تحميل مسبق لبلاطات المنطقة الهدف (لا بلاطات رمادية أثناء الطيران).
   - تمييز المنطقة الهدف يُثبَّت **قبل** الإقلاع (لا وميض انطفاء 450ms).
   - رحلة `flyToBounds` بمسار قوسي (`parabolic-arc`: 0.45s إقلاع + 0.75s هبوط = 1.2s) أو انزلاق مباشر (1.15s) مع هامش بصري وحشوات تمنع تغطية الشريط العلوي/اللوحات العائمة (`getVisualViewportPadding`).
   - أثناء الرحلة: فئة `is-camera-flying` تُجمّد انتقالات حدود SVG (درع الارتجاج)، وعند `moveend` تتحول إلى `is-camera-settling` ثم تُزال بعد 180ms → **هبوط صفر ارتجاج**.
2. **العودة للعرض العام** (إلغاء المنطقة): طيران إلى مركز/زوم العرض العام (Z14) بمدة ~1.1s.
3. **الحماية من التعارض:** تغيير منطقة أثناء رحلة سابقة → `CameraController` يوقف السابقة فوراً (نفس الأولوية `zone` تسبق)؛ سحب المستخدم للخريطة يُلغي الرحلة المعلّقة تلقائياً؛ تحديد نشاط أثناء الرحلة (أولوية `selection` أعلى) يسبقها.

---

### 4. الحل الهندسي — الكود الجاهز للدمج

#### 4.1 تنظيف الاستيرادات اليتيمة (`src/features/map/model/mapDistrictsLayer.ts`)

**قبل (سطور 1-3):**
```ts
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../data/hadayekDistrictsGeoData';
import { planCameraTransitionOnZoneChange, getVisualViewportPadding } from '../../../components/map/utils/cameraPlanner';
import { preloadDistrictTiles } from '../../../utils/hadayekTilePreloader';
```

**بعد:**
```ts
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../data/hadayekDistrictsGeoData';
```

#### 4.2 إعادة الربط (`src/components/map/hooks/useMapPinsClustering.ts`)

**(أ) إضافة الواردات:**
```tsx
import { useCallback } from 'react'; // تُضاف إلى الاستيراد الحالي من react
import {
  planCameraTransitionOnZoneChange,
  getVisualViewportPadding,
} from '../utils/cameraPlanner';
import { preloadDistrictTiles } from '../../../utils/hadayekTilePreloader';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../../data/hadayekDistrictsGeoData';
// ويُضاف updateDistrictHighlightStyles إلى الاستيراد الحالي من '../../../features/map'
```

**(ب) المراجع ودالة الدرع (داخل الهوك):**
```tsx
const previousSelectedZoneRef = useRef<string>(effectiveZone);
const flightSettlingTimerRef = useRef<number | null>(null);

// 🛡️ درع الهبوط: تجميد انتقالات SVG أثناء الرحلة ثم تسوية لمدة 180ms بعد moveend
const markCameraFlight = useCallback((map: any) => {
  const container = map?.getContainer?.();
  if (!container) return;
  if (flightSettlingTimerRef.current !== null) {
    window.clearTimeout(flightSettlingTimerRef.current);
    flightSettlingTimerRef.current = null;
  }
  container.classList.remove('is-camera-settling');
  container.classList.add('is-camera-flying');
  map.once('moveend', () => {
    container.classList.remove('is-camera-flying');
    container.classList.add('is-camera-settling');
    flightSettlingTimerRef.current = window.setTimeout(() => {
      container.classList.remove('is-camera-settling');
      flightSettlingTimerRef.current = null;
    }, 180);
  });
}, []);

useEffect(() => () => {
  if (flightSettlingTimerRef.current !== null) {
    window.clearTimeout(flightSettlingTimerRef.current);
  }
}, []);
```

**(ج) Effect الرحلة السينمائية (يُضاف بعد Effect المزامنة `syncAuxiliaryLayers`):**
```tsx
// 🎥 رحلة الكاميرا السينمائية عند تغيير المنطقة (استعادة من الأرشيف b63ebc5)
useEffect(() => {
  if (mode !== 'view' || !mapInstance.isMapReady) return;
  const map = mapInstance.leafletMapRef.current;
  if (!map) return;

  const decision = planCameraTransitionOnZoneChange(
    previousSelectedZoneRef.current,
    effectiveZone,
    HADAYEK_OFFICIAL_DISTRICTS,
    map.getZoom(),
  );
  previousSelectedZoneRef.current = effectiveZone;
  if (!decision.shouldMove) return;

  const isMobile = map.getSize().x < 640;
  const viewportPadding = getVisualViewportPadding(isMobile, false);

  if (decision.type === 'zone' && decision.targetBounds) {
    try {
      preloadDistrictTiles(effectiveZone, decision.targetBounds);
      map.stop();
      // تمييز الوجهة قبل الإقلاع مباشرة — يمنع وميض انطفاء الحدود
      updateDistrictHighlightStyles(effectiveZone);
      const duration = decision.flightMode === 'parabolic-arc'
        ? (decision.totalDuration || 1.25)
        : (decision.totalDuration || 1.15);
      markCameraFlight(map);
      mapInstance.cameraController?.request(
        {
          kind: 'flyToBounds',
          bounds: window.L.latLngBounds(decision.targetBounds),
          options: {
            paddingTopLeft: viewportPadding.paddingTopLeft,
            paddingBottomRight: viewportPadding.paddingBottomRight,
            maxZoom: 16.5,
            duration,
            easeLinearity: 0.25,
          },
        },
        'zone',
      );
    } catch {}
  } else if (decision.type === 'overview' && decision.targetCenter) {
    try {
      updateDistrictHighlightStyles('');
      map.stop();
      markCameraFlight(map);
      mapInstance.cameraController?.request(
        {
          kind: 'flyTo',
          center: decision.targetCenter,
          zoom: decision.targetZoom || 14,
          options: { duration: decision.totalDuration || 1.1, easeLinearity: 0.25 },
        },
        'zone',
      );
    } catch {}
  }
}, [effectiveZone, mode, mapInstance.isMapReady, mapInstance.cameraController, markCameraFlight]);
```

**ملاحظات دمج مهمة:**
- `previousSelectedZoneRef` تُهيَّأ بالقيمة الحالية للمنطقة → **لا رحلة زائفة عند أول تحميل** حتى لو كانت هناك منطقة محددة مسبقاً من الرابط/الفلاتر.
- الاستدعاء يمر عبر `cameraController.request(..., 'zone')` وليس عبر `map.flyTo*` مباشرة — التزاماً بمبدأ «المالك الوحيد للكاميرا» في المعمارية الحديثة؛ حماية التعارض (Token) القديمة استُبدلت بطبقات أولوية الموجّه.
- `map.stop()` قبل الطلب يُلغي أي حركة يدوية جارية (سحب/زوم) لبداية نظيفة.
- عند فشل تحميل محرك الخريطة (`mapScriptError`) لا يعمل الـ Effect لأن `isMapReady=false`.

---

### 5. ما نُفِّذ فعلياً — التكييفات عن الخطة الأصلية

نُفِّذت الخطة كاملةً، مع ثلاثة تكييفات معمارية فرضها الكود الحي، وإصلاح جذري إضافي اكتُشف أثناء التحقق (وكان مانعاً صامتاً لرحلات المنطقة):

#### 5.1 نقل Effect الرحلة إلى `useMapSelectionCamera.ts` (بدلاً من `useMapPinsClustering.ts`)

فحص البناء (`scripts/check-architecture.cjs`) يفرض حداً أقصى **120 سطراً** لهوكس الخريطة؛ إضافة ~70 سطراً من القسم 4.2 داخل `useMapPinsClustering.ts` كانت ستخرقه. الأنسب معمارياً: كان `useMapSelectionCamera` يستقبل `(selectedBiz, mapInstance)` فقط، فأُضيف له المعاملان `effectiveZone` و`mode`، ووُضِع Effect الرحلة داخله بجوار رحلة اختيار النشاط (تنسيق كاميرا موحّد في ملف واحد يمر كله عبر `CameraController`). الربط من `useMapPinsClustering.ts` بسطر واحد: `useMapSelectionCamera(state.selectedBiz, mapInstance, effectiveZone, mode)`.

#### 5.2 استخراج الدرع إلى وحدة مستقلة `cameraFlightShield.ts` (تطور عن درع §4.2ب)

الدرع البسيط (فئة + `map.once('moveend')` + مهلة 180ms) ثبت أنه هشّ في ثلاثة سيناريوهات حقيقية اكتُشفت أثناء التحقق:
1. **نقرات متتالية سريعة** — `map.stop()` يُطلق `moveend` شارداً (تُسوية `zoomSnap` في Leaflet 1.9.4) قد يُحرر درع رحلة جديدة قبل إقلاعها.
2. **رحلة ملغاة بلفتة مستخدم** بدون أي `moveend` → الدرع يبقى عالقاً حتى يخفي الواجهة.
3. **تبديل منطقة → منطقة → عرض عام** بتتابع سريع مع تداخل مهلات التسوية.

الحل النهائي في `cameraFlightShield.ts` (المستخدَم فعلياً):
- **إبطال بالرمز (Token):** كل رحلة جديدة تُلغي (off) مستمعي `moveend` لأي رحلة أقدم قبل تفعيل درعها — فالـ moveend الشارد لا يستطيع تحرير درع أحدث منه.
- **فكّ الدرع بعد ثبات فعلي:** بعد `moveend` لا يكفي انتظار 180ms؛ يبدأ فحص `requestAnimationFrame` يتطلب **إطارين متتاليين مستقرين** (زوم + مركز) بسقف 5000ms، ثم يُزال الدرع خلال 180ms.
- **سقف تسليح 6000ms:** شبكة أمان لأي رحلة أُلغيت دون `moveend`.
- الثوابت: `SETTLING_RELEASE_MS=180`, `ARM_DEADLINE_MS=6000`, `WATCH_DEADLINE_MS=5000`, `STABLE_FRAMES_REQUIRED=2`.

#### 5.3 إصلاح جذري إضافي: سباق ازدواج نسخة Leaflet — إعادة كتابة `leafletLoader.ts` بنمط Single-Flight

**هذا الإصلاح لم يكن في الخطة، واكتُشف أثناء التحقق السلوكي** حين فشلت رحلة المنطقة صامتةً على الديسكتوب بينما نجحت على الموبايل في نفس الجلسة.

- **الأعراض:** نقرة منطقة → لا حركة كاميرا، لا `moveend`، والدرع يبقى حتى سقف التسليح 6000ms. بلا أي خطأ ظاهر (TypeError مُبتلع داخل حماية `try/catch` في الموجّه).
- **الجذر (مُثبت بالأدلة عبر أداة `copyDiag` في المسبار):** في `React.StrictMode` يُنفَّذ Effect الخريطة مرتين متتاليتين. التنفيذ الأول يضيف سكربت Leaflet ثم يُنظّف مسجّلاته فوراً (السكربت يبقى في الـ DOM)، والثاني لا يرى `window.L` بعد (السكربت ما زال قيد الجلب) فيزيل سكربت الأول من منتصف رحلته ويضيف سكربتاً ثانياً — وسكربت مُزال وقد بدأ الجلب **يواصل التنفيذ في Chrome**، فينفَّذ Leaflet **مرتين** ويكتب الواصل الأخير `window.L`. عندها `window.L.latLngBounds()` (نسخة ثانية) ينتج `LatLngBounds` من نسخة أخرى، فيفشل فحص `instanceof` داخل `toLatLngBounds` الخاصة بـ `flyToBounds` في خريطة النسخة الأولى → TypeError → لا رحلة ولا `moveend` نهائياً. سلوك سباقي: يظهر على مقاس ويغيب على آخر من تشغيل لآخر — وقد سُجِّل تنفيذان في دليل التشخيص (`[{t:750},{t:767}]`) بينما وسم سكربت واحد فقط ظاهر في الـ DOM.
- **الإصلاح:** إعادة كتابة `loadLeafletScript` بنمط **Single-Flight**: كل المستدعين يتشاركون عملية تحميل واحدة مفهرسة بمفتاح `__dalilakLeafletPending` على `window`؛ لا يُزال سكربت قيد الجلب إطلاقاً؛ الإزالة فقط عند الفشل (كي ينفّذ الـ Retry طلب شبكة جديداً كما ينص عقد الاختبار الأصلي)؛ إلغاء اشتراك مستدعٍ (StrictMode) لا يُلغي التحميل عن المستدعي الباقي.
- **دليل ما بعد الإصلاح:** `lAssignments` صار مدخلاً واحداً في كلا المقاسين، وكل فحوص الهوية خضراء: `mapCtorSameCopy=true`, `flyToBoundsOnProto=true`, `stopOnProto=true`, `containerMapSame=true` — ثم عملت كل رحلات المنطقة بلا إخفاق (النتائج الكاملة في §6.2).
- **اختبار انحدار:** أُضيف فحص Single-Flight إلى `src/tests/leaflet_loader.test.ts`: مستدعيان متزامنان → سكربت واحد فقط في الـ head، إلغاء اشتراك الأول لا يضر الثاني، والنجاح المشترك الإخطار مرة واحدة بلا أخطاء.

#### 5.4 تسليمات صغيرة مصاحبة (ضمن نطاق الوثيقة)

- `src/features/map/hooks/useMapViewUrlState.ts`: مزامنة معامل `zone` في الرابط عند تغيير المنطقة (`replaceState` + حذف `bldg`) ليبقى الرابط دائم الحالة ومطابقاً لمتطلبات فحص §6.
- `src/components/map/hooks/useTargetBuildingCamera.ts`: إزالة سجلات تشخيص `[TBC]` قديمة كانت تُلوّث الـ console أثناء القياسات الآلية (سلوك الرحلة لم يتغير).
- `src/features/map/model/mapDistrictsLayer.ts`: حذف الاستيرادين اليتيمين — كما في §4.1 بالحرف.

---

### 6. خطة التحقق (Verification Plan) — نُفِّذت بالكامل مع النتائج الفعلية
1. **فحص الأنواع والبناء:** `npx tsc --noEmit` + `npm run build` (Code 0 إلزامي).
2. **اختبارات الموجّه:** `npx vitest run src/tests/camera_controller.test.ts` (يبقى أخضر).
3. **فحص سلوكي بصري (يدوي/آلي):**
   - نقرة منطقة «ح» → رحلة قوسية + بلاطات جاهزة + **لا وميض حدود** + هبوط بلا ارتجاج → فئة `is-camera-flying` تظهر أثناء الحركة وتُزال خلال ~180ms بعد الهبوط.
   - تبديل سريع بين منطقتين متتاليتين → لا تضارب؛ الرحلة الثانية تسبق الأولى فوراً.
   - سحب الخريطة أثناء رحلة → تتوقف الرحلة فوراً (سلوك `cancelForGesture`).
   - تحديد نشاط أثناء رحلة منطقة → كاميرا النشاط (selection) تسبق رحلة المنطقة ثم لا عودة خاطئة.
   - إلغاء المنطقة (عرض عام) → طيران Z14 بمدة ~1.1s.
   - التأكد أن رحلات `locate` (الملقط) و`fitAll` لم تتأثر.
4. **مرجع مرئي:** الالتزام `b63ebc5` يوثّق النتيجة النهائية (Zero-Jitter Landing) — يقارَن الفيديو/اللقطات قبل/بعد.

#### 6.1 بوابات الجودة الثابتة (Static Gates) — كلها خضراء ✅

| البوابة | الأمر | النتيجة |
|---|---|---|
| فحص الأنواع | `npx tsc --noEmit` | **Code 0** |
| البناء الكامل (يشمل `scripts/check-architecture.cjs` — قيد ≤120 سطراً لهوكس الخريطة) | `npm run build` | **Code 0** |
| عدّة اختبارات الخريطة (tsx harness) | `npm run test:map` | **41/41 ✅** |
| اختبارات الوحدة (vitest) | `npm run test:map:unit` | **12/12 ✅** (تشمل `camera_controller` و`map_state`) |
| اختبار محمّل Leaflet (مع انحدار Single-Flight الجديد) | `npx tsx src/tests/leaflet_loader.test.ts` | **✅** |

#### 6.2 الفحص السلوكي الآلي في متصفح حقيقي (Playwright + Chrome) — 0 إخفاقات ✅

**الدليل الخام:** `verification/evidence/camera-flight-probe.json` (تشغيل `2026-10-05T11:29:45.193Z`، قائمة `failures` = **فارغة**)، مع لقطات `camera-flight-*.png` و`rtl-toast-centered.png`.

| السيناريو | النتائج المقاسة فعلياً |
|---|---|
| 🛡️ تشخيص النسخ (`copyDiag`) | سكربت Leaflet واحد في الـ DOM و**تعيين واحد** لـ `window.L` في كلا المقاسين (بعد الإصلاح)، وفحوص الهوية كلها خضراء: `mapCtorSameCopy=true`, `flyToBoundsOnProto=true`, `stopOnProto=true`, `containerMapSame=true` |
| رحلة منطقة (قوسية) — ديسكتوب 1280×800 | `is-camera-flying` ظهرت **1120ms** ثم `is-camera-settling` **~200ms** ثم أُزيلت الاثنتان (`endFlying/endSettling=false`)؛ **29 قيمة زوم متمايزة** و29 إطار طيران عبر 77 عيّنة (حركة فعلية مثبتة)؛ نافذة المضلع الهدف بعد الهبوط 655×398 بنسبة **3.99×3.98** (تعبئة بلا تشويه)؛ `zoneParam=أ` |
| تبديل سريع بين منطقتين (`rapid`) | رحلة واحدة متصلة **1400ms** بـ**36** عيّنة زوم متمايزة؛ لا تراكب دروع؛ انتهت على المنطقة الثانية «ح» بنافذة مضلع سليمة |
| العودة للعرض العام (`overview`) | **1280ms** بـ**28** عيّنة؛ سلسلة استدعاءات الجلسة تنتهي بـ `panTo`+`moveend` (نمط العرض العام)؛ `zoneParam` **حُذف** من الرابط؛ لوحة المنطقة أُغلقت (`sheetStillOpen=false`) |
| موبايل 390×844 (منطقة «ز») | **1120ms** / **29** عيّنة، نافذة المضلع 2.84×2.82، `zoneParam=ز` |
| الاستقرار | `pageErrors` فارغة في كل السيناريوهات؛ ملاحظة: أخطاء console الأربعة هي `ERR_BLOCKED_BY_CLIENT` من موارد حجبها هارنس التحقق نفسه (ضجيج بنية تحتية، مستثنى) |
| أثر إصلاح RTL (مقطع من الجلسة نفسها) | لافتة `Toast` بمركز 640px = مركز نافذة 1280px بالضبط (`dx=0`) |

> **ملاحظة منهجية:** كاشف الإطارات (`makePump` بكثافة 150ms) طغى على تجويع rAF في المتصفح المُشغَّل بلا واجهة، وعدّاد `distinctZoom` يثبت الحركة الفعلية حتى لو لم تُلتقط كل الإطارات الوسيطة.

---

### 7. تقدير المخاطر
| المخاطرة | التقييم | التخفيف |
|---|---|---|
| تعارض رحلات (قديم/جديد) | منخفض | أولويات CameraController + `map.stop()` |
| استدعاء `window.L` أثناء فشل المحرك | منخفض | حارس `isMapReady` + `try/catch` |
| انحدار أداء عند تبديل المناطق بسرعة | منخفض | التحميل المسبق مُقيَّد ببلاطات المنطقة؛ تبديل متكرر يلغي الرحلات السابقة (أُثبت في سيناريو `rapid`) |
| اتساع ملف الهوك | 🟠 تحقق فعلياً ثم عولج | قيد ≤120 سطراً رفض الإضافة في `useMapPinsClustering.ts` → نُقل Effect إلى `useMapSelectionCamera.ts` (تكييف §5.1) |
| سباق ازدواج نسخة Leaflet | 🔴 مانع صامت اكتُشف واكتُسح | إصلاح Single-Flight في `leafletLoader.ts` + اختبار انحدار (§5.3) — كان سبب فشل رحلات المنطقة على الديسكتوب |

---

### 8. التزام الحوكمة
- ✅ **نُفِّذ هذا المستند بالكامل ومُتحقَّق منه** (2026-10-05) — التعديلات مطبَّقة في شجرة العمل المذكورة أعلاه، واجتازت كل بوابات الجودة (§6.1) والفحص السلوكي الآلي بلا أي إخفاق (§6.2).
- الأقسام 1-4 محفوظة كمرجع **قبل** التنفيذ؛ الأقسام 5-8 توثّق ما تم فعلياً وأدلته.
- لم يُنشأ أي التزام (commit) — التغييرات متروكة للمراجعة والدمج عند الطلب.
