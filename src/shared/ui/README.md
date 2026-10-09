# نظام التصميم — `src/shared/ui`

القيم البصرية تُعرَّف مرة واحدة في `src/index.css` وتُستهلك من هنا. بطاقة القائمة (`BusinessCardGridVariant`) هي مرجع الأسطح.

## التوكنز

| التوكن | القيمة | الاستخدام |
|---|---|---|
| `--brand` | `#d97706` | العلامة، الأزرار الأساسية، التركيز |
| `--brand-hover` | `#b45309` | التحويم |
| `--brand-soft` | `#fef3c7` | خلفية الكبسولة النشطة |
| `--brand-ring` | `rgba(217,119,6,.25)` | حلقة التركيز |
| `--state-open` / `--state-open-bg` | `#059669` / `#ecfdf5` | «مفتوح الآن» فقط |
| `--state-closed` / `--state-closed-bg` | `#475569` / `#f1f5f9` | «مغلق» |
| `--danger` | `#dc2626` | الأخطاء والحذف فقط |
| `--radius-sm` | `10px` | المدخلات |
| `--radius-md` | `14px` | أيقونات مربعة |
| `--radius-lg` | `22px` | بطاقات وأوراق ومودال |
| `--radius-pill` | `999px` | أزرار وكبسولات وشارات |
| `--shadow-card` / `--shadow-floating` / `--shadow-modal` | — | الظلال الثلاثة |
| `--text-display` | `28px` | عناوين العرض |
| `--text-title` | `22px` | عناوين الصفحات |
| `--text-heading` | `17px` | عناوين البطاقات |
| `--text-body` | `15px` | النص |
| `--text-label` | `13px` | التسميات |
| `--text-caption` | `12px` | أصغر نص مسموح |

التركيز موحّد: `outline: 2px solid var(--brand); outline-offset: 2px`.

الأخضر محجوز لـ«مفتوح الآن». شارة «موثق» كهرمانية الأيقونة. واتساب أيقونة فقط.

## المكوّنات

- `Button`: `primary` | `secondary` | `ghost` | `danger` | `icon`. الأحجام `sm` 36px، `md` 42px، `lg` 48px. الشكل pill. `leadingIcon` و`loading`.
- `Chip`: كبسولات الفلاتر.
- `IconButton` / `Pressable`: أزرار أيقونات وأسطح قابلة للضغط.
- `Card`, `Modal`, `Drawer`, `EntitySheet`, `MapInfoSheet`.
- `SearchField`, `Skeleton`, `LoadingSkeleton`, `EmptyState`, `ErrorState`, `OfflineState`, `Toast`, `PageFrame`.

## الممنوعات

يفشل `npm run check:architecture` (ومعه `npm run build`) عند أي من التالي داخل `*.tsx`:

- لون سداسي خام `#[0-9a-f]{6}` — استخدم توكناً.
- `font-black` — الوزن الأثقل المحمّل هو `font-extrabold` (800).
- `text-[Npx]` عندما يكون `N` أقل من 12. الاستثناء الوحيد لنص 11px هو ملفا دبابيس الخريطة `badgeMarkers.ts` و`categoryPinStyle.ts` (وهما `.ts` لا `.tsx`).
- `<button className=` خارج `src/shared/ui`.
