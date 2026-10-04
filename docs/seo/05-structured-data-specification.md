# Schema.org Structured Data Specification & Hard Safety Rule Enforcement

## 1. Overview
This document specifies the Schema.org JSON-LD generation engine used across the Dalilak Directory platform (`api/share.ts`), detailing category mapping, compliance with Google Search Essentials, and hard safety rule verifications.

---

## 2. Category to Schema.org Mapping Matrix

The directory maps real Arabic category labels to the most specific valid `schema.org/LocalBusiness` subtype:

| Arabic Category Keyword | Schema.org Subtype | Inheritance |
| :--- | :--- | :--- |
| صيدلية، أدوية، علاج | `Pharmacy` | `MedicalOrganization` -> `LocalBusiness` |
| مطعم، مأكولات، وجبات، مشويات، بيتزا، برجر، شاورما، أسماك | `Restaurant` | `FoodEstablishment` -> `LocalBusiness` |
| كافيه، مقهى، قهوة | `CafeOrCoffeeShop` | `FoodEstablishment` -> `LocalBusiness` |
| أسنان، طب أسنان | `Dentist` | `MedicalOrganization` -> `LocalBusiness` |
| طبي، عيادة، دكتور، مستشفى، بصريات | `MedicalBusiness` | `LocalBusiness` |
| سيارات، ميكانيكا، إطارات، زيوت، غسيل سيارات | `AutoRepair` | `AutomotiveBusiness` -> `LocalBusiness` |
| سوبر ماركت، ماركت، بقالة، أغذية | `GroceryStore` | `Store` -> `LocalBusiness` |
| حلويات، مخبز، أفران، فطائر | `Bakery` | `FoodEstablishment` -> `LocalBusiness` |
| حلاق، تجميل، كوافير، صالون | `BeautySalon` | `HealthAndBeautyBusiness` -> `LocalBusiness` |
| *(Default / Other)* | `LocalBusiness` | `Organization` -> `Place` -> `Thing` |

---

## 3. Hard Safety Rule #2 Compliance (Zero Fake Ratings)

### Google Spam Policy Mandate
> *"Don't mark up third-party reviews (from sites like Google, Yelp, TripAdvisor) as your own aggregateRating on your domain. Structured review data must represent genuine user reviews submitted on your platform."*

### Implementation & Verification
1. **Source of Truth Check**: The database contains no platform reviews table. Ratings stored in `notes` are synced from external Google Maps places.
2. **Action Taken**: The engine strictly omits `aggregateRating` and `review` from Schema.org JSON-LD structured data graph across all business pages.
3. **Display vs Structured Data**: Human users can see the informative text note in the pre-rendered HTML snapshot (*"⭐ تقييم Google: 4.6 (142 تقييم)"*), but Googlebot is never served structured `aggregateRating` tags.
4. **CI Enforcement**: `scripts/seo/check-seo.ts` automatically scans JSON-LD output and **fails the build** if any `AggregateRating` node is detected.

---

## 4. Truthful Data Enforcement (Zero Fabricated Price Ranges)

* **Previous Bug**: Hardcoded `priceRange: '$'` and `currenciesAccepted: 'EGP'` were previously output for all businesses regardless of whether price data existed.
* **Remediation**: `priceRange` and `currenciesAccepted` have been completely removed from the JSON-LD generator. Only verified fields from the database are emitted.

---

## 5. Validated Schema.org Output (5 Sample Pages)

### Sample 1: Restaurant with Approved SEO & FAQ
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": "https://www.dalilaak.com/biz/restaurant-sample#business",
      "name": "مطعم أندلسية للمشويات",
      "description": "مطعم أندلسية للمشويات في شارع الجيش - منطقة أ - عمارة 15، حدائق الأهرام. تواصل: 01012345678. ساعات العمل: يومياً من 11 صباحاً حتى 2 صباحاً.",
      "url": "https://www.dalilaak.com/biz/restaurant-sample",
      "telephone": "01012345678",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "حدائق الأهرام",
        "addressRegion": "الجيزة",
        "streetAddress": "شارع الجيش - منطقة أ - عمارة 15",
        "addressCountry": "EG"
      },
      "image": "https://xdqpbajymacpdccorjcj.supabase.co/storage/v1/object/public/photos/andalusia.jpg",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 29.9812,
        "longitude": 31.1245
      },
      "openingHours": "يومياً من 11 صباحاً حتى 2 صباحاً",
      "hasMap": "https://maps.google.com/?cid=1111111111",
      "sameAs": [
        "https://maps.google.com/?cid=1111111111"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.dalilaak.com/biz/restaurant-sample#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "منصة دليلك", "item": "https://www.dalilaak.com/" },
        { "@type": "ListItem", "position": 2, "name": "الجيزة", "item": "https://www.dalilaak.com/search" },
        { "@type": "ListItem", "position": 3, "name": "المطاعم والكافيهات", "item": "https://www.dalilaak.com/search?cat=%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%B9%D9%85%20%D9%88%D8%A7%D9%84%D9%83%D8%A7%D9%81%D9%8A%D9%87%D8%A7%D8%AA" },
        { "@type": "ListItem", "position": 4, "name": "مطعم أندلسية للمشويات", "item": "https://www.dalilaak.com/biz/restaurant-sample" }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.dalilaak.com/biz/restaurant-sample#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "ما هو عنوان مطعم أندلسية للمشويات؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "يقع في شارع الجيش - منطقة أ - عمارة 15، حدائق الأهرام، الجيزة."
          }
        },
        {
          "@type": "Question",
          "name": "ما هي ساعات العمل في مطعم أندلسية للمشويات؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "يعمل يومياً من 11 صباحاً حتى 2 صباحاً."
          }
        }
      ]
    }
  ]
}
```

### Sample 2: Pharmacy (`Pharmacy` Type)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Pharmacy",
      "@id": "https://www.dalilaak.com/biz/al-noor-pharmacy#business",
      "name": "صيدلية النور الحديثة",
      "description": "صيدلية متكاملة تقدم الأدوية والمستلزمات الطبية ورعاية صحية شاملة. • تواصل: 01198765432",
      "url": "https://www.dalilaak.com/biz/al-noor-pharmacy",
      "telephone": "01198765432",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "حدائق الأهرام",
        "addressRegion": "الجيزة",
        "streetAddress": "البوابة الرابعة - منطقة ع عمارة 120",
        "addressCountry": "EG"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 29.9754,
        "longitude": 31.1189
      },
      "openingHours": "خدمة 24 ساعة"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.dalilaak.com/biz/al-noor-pharmacy#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "منصة دليلك", "item": "https://www.dalilaak.com/" },
        { "@type": "ListItem", "position": 2, "name": "الجيزة", "item": "https://www.dalilaak.com/search" },
        { "@type": "ListItem", "position": 3, "name": "الرعاية الصحية والصيدليات", "item": "https://www.dalilaak.com/search?cat=%D8%A7%D9%84%D8%B1%D8%B9%D8%A7%D9%8A%D8%A9%20%D8%A7%D9%84%D8%B5%D8%AD%D9%8A%D8%A9%20%D9%88%D8%A7%D9%84%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A7%D8%AA" },
        { "@type": "ListItem", "position": 4, "name": "صيدلية النور الحديثة", "item": "https://www.dalilaak.com/biz/al-noor-pharmacy" }
      ]
    }
  ]
}
```

### Sample 3: Dentist Clinic (`Dentist` Type)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Dentist",
      "@id": "https://www.dalilaak.com/biz/ahmed-ibrahim-dental#business",
      "name": "عيادة د. أحمد إبراهيم لطب وجراحة الأسنان",
      "description": "عيادة د. أحمد إبراهيم لطب وجراحة الأسنان • تواصل: 01000000000 • الرعاية الصحية والصيدليات - حدائق الأهرام - منطقة د - الجيزة",
      "url": "https://www.dalilaak.com/biz/ahmed-ibrahim-dental",
      "telephone": "01000000000",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "حدائق الأهرام",
        "addressRegion": "الجيزة",
        "streetAddress": "منطقة د",
        "addressCountry": "EG"
      }
    }
  ]
}
```

### Sample 4: Automotive Workshop (`AutoRepair` Type)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AutoRepair",
      "@id": "https://www.dalilaak.com/biz/ahram-auto#business",
      "name": "مركز الأهرام لصيانة السيارات",
      "description": "ميكانيكا وكهرباء سيارات وضبط زوايا. • تواصل: 01234567890",
      "url": "https://www.dalilaak.com/biz/ahram-auto",
      "telephone": "01234567890",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "حدائق الأهرام",
        "addressRegion": "الجيزة",
        "streetAddress": "منطقة ك",
        "addressCountry": "EG"
      }
    }
  ]
}
```

### Sample 5: Beauty Salon (`BeautySalon` Type)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BeautySalon",
      "@id": "https://www.dalilaak.com/biz/beauty-center-sample#business",
      "name": "صالون ليدي لتصفيف الشعر والتجميل",
      "description": "صالون تجميل وعناية بالبشرة والشعر. • تواصل: 01022334455",
      "url": "https://www.dalilaak.com/biz/beauty-center-sample",
      "telephone": "01022334455",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "حدائق الأهرام",
        "addressRegion": "الجيزة",
        "streetAddress": "منطقة ل عمارة 45",
        "addressCountry": "EG"
      }
    }
  ]
}
```
