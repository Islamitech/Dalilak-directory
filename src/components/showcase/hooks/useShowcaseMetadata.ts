import { useEffect } from 'react';
import { Business } from '../../../types';
import {
  injectBusinessSchemaLd,
  updatePageMetadata,
} from '../../../utils/directoryEnhancements';
import { getPublicDirectoryUrl } from '../../../utils/directoryUrl';
import { INTEGRATED_FILTER_CATEGORIES } from '../../../features/search';
import { displayBusinessName } from '../../../shared/lib/format';

export function useShowcaseMetadata(
  selectedBiz: Business | null,
  currentPath: string,
  categoryFilter: string,
  hadayekZoneFilter: string,
  searchQuery = ''
): void {
  // Dynamic Schema.org LocalBusiness SEO injection
  useEffect(() => {
    if (selectedBiz && selectedBiz.verificationStatus !== 'rejected') {
      injectBusinessSchemaLd(selectedBiz);
    } else {
      injectBusinessSchemaLd(null);
    }
  }, [selectedBiz]);

  // Dynamic Page Metadata (Title, Description, Canonical) Synchronization
  useEffect(() => {
    if (selectedBiz) {
      const name = displayBusinessName(selectedBiz.nameAr, selectedBiz.nameEn) || 'نشاط معتمد';
      const loc = [selectedBiz.city, selectedBiz.governorate].filter(Boolean).join(' - ') || 'مصر';
      const primaryPhoto = selectedBiz.coverPhoto || (selectedBiz.photos && selectedBiz.photos.length > 0 ? selectedBiz.photos[0] : undefined);
      updatePageMetadata({
        title: `${name} | منصة دليلك المعتمدة`,
        description: selectedBiz.description || `${selectedBiz.category} في ${loc} - تواصل مباشر وتفاصيل الموقع الجغرافي على الخريطة المعتمدة.`,
        canonicalUrl: getPublicDirectoryUrl(selectedBiz),
        ogImage: primaryPhoto,
      });
      return;
    }

    const cleanRoute = currentPath.toLowerCase().split('?')[0];
    const baseDomain = 'https://www.dalilaak.com';

    if (cleanRoute === '/search') {
      const query = searchQuery.trim();
      const categoryName = INTEGRATED_FILTER_CATEGORIES.find((item) => item.id === categoryFilter)?.name;
      const catLabel = !query && categoryName ? ` — ${categoryName}` : '';
      const queryLabel = query ? ` عن «${query}»` : '';
      const zoneLabel = hadayekZoneFilter && hadayekZoneFilter !== 'all' ? ` في منطقة (${hadayekZoneFilter})` : '';
      updatePageMetadata({
        title: `استكشف الأنشطة والخدمات المعتمدة${queryLabel}${catLabel}${zoneLabel} | منصة دليلك`,
        description: `دليل المحلات والأنشطة والخدمات المعتمدة في حدائق الأهرام ومحافظات مصر${queryLabel}${catLabel}${zoneLabel}. تفاصيل العناوين، أرقام التواصل وساعات العمل.`,
        canonicalUrl: `${baseDomain}/search`,
      });
    } else if (cleanRoute === '/' || cleanRoute === '/map') {
      updatePageMetadata({
        title: 'الخريطة التفاعلية والمواقع الموثقة | منصة دليلك',
        description: 'استكشف المحلات والأنشطة والخدمات الميدانية القريبة منك على الخريطة الحية المعتمدة في حدائق الأهرام ومصر.',
        canonicalUrl: `${baseDomain}/`,
      });
    } else if (cleanRoute === '/pricing' || cleanRoute === '/business-pricing') {
      updatePageMetadata({
        title: 'باقات النمو والتوثيق الميداني للأنشطة | منصة دليلك',
        description: 'اكتشف باقات توثيق واعتماد المحلات والشركات، الفواتير الإلكترونية، وبطاقات الدعم الميداني في منصة دليلك.',
        canonicalUrl: `${baseDomain}/pricing`,
      });
    } else if (cleanRoute === '/for-business' || cleanRoute === '/add-business') {
      updatePageMetadata({
        title: 'أضف نشاطك التجاري مجاناً | منصة دليلك',
        description: 'سجّل محلك أو خدمتك في منصة دليلك المعتمدة مجاناً واحصل على توثيق لموقعك على خرائط Google وتواصل مباشر مع العملاء.',
        canonicalUrl: `${baseDomain}/for-business`,
      });
    } else if (cleanRoute === '/about') {
      updatePageMetadata({
        title: 'عن منصة دليلك ورسالتها الميدانية | منصة دليلك',
        description: 'الرؤية والرسالة المؤسسية لمنظومة دليلك لتنظيم وتوثيق الوصول إلى الخدمات والأنشطة في محافظات مصر.',
        canonicalUrl: `${baseDomain}/about`,
      });
    } else if (cleanRoute === '/favorites') {
      updatePageMetadata({
        title: 'الأنشطة المحفوظة والمفضلة | منصة دليلك',
        description: 'قائمتك المفضلة من المحلات والأنشطة والخدمات المحفوظة للرجوع السريع إليها.',
        canonicalUrl: `${baseDomain}/favorites`,
      });
    } else {
      updatePageMetadata({
        title: 'الصفحة غير موجودة | منصة دليلك',
        description: 'هذا الرابط غير موجود في دليل دليلك. عُد إلى الخريطة أو قائمة الأنشطة.',
        canonicalUrl: `${baseDomain}${cleanRoute}`,
      });
    }
  }, [selectedBiz, currentPath, categoryFilter, hadayekZoneFilter, searchQuery]);
}
