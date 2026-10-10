import React from 'react';
import { Pressable, Button } from '../../shared/ui';
import { Store, AlertTriangle } from 'lucide-react';
import { Business } from '../../types';
import { getFirstStrongDirection } from '../../shared/lib/textDirection';
import { collectDisplayPhotos, getCategoryFallbackCover } from '../../utils/categoryPhotos';

export interface ActivityDetailFooterProps {
  business: Business;
  similarPlaces: Business[];
  onSelectBusiness?: (biz: Business) => void;
  effectiveUrl?: string | null;
  onShowOnMap?: (biz: Business) => void;
  onNavigateToBusinessClaim?: (biz: Business) => void;
}

export const ActivityDetailFooter: React.FC<ActivityDetailFooterProps> = ({
  business,
  similarPlaces,
  onSelectBusiness,
  onNavigateToBusinessClaim,
}) => {
  return (
    <div className="space-y-3 pt-1">
      {/* 3. Similar Activities */}
      {similarPlaces.length > 0 && (
        <div className="dl-sm">
          <h4>أنشطة مشابهة</h4>
          <div className="dl-g">
            {similarPlaces.map((sim) => {
              const fallback = getCategoryFallbackCover(sim.category);
              const simCover = collectDisplayPhotos(sim.photos, sim.coverPhoto)[0] || fallback;

              return (
                <Pressable
                  key={sim.id}
                  type="button"
                  onClick={() => onSelectBusiness && onSelectBusiness(sim)}
                >
                  <img
                    src={simCover}
                    alt=""
                    className="dl-sm-img"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (fallback && img.dataset.fallback !== '1' && img.src !== fallback) {
                        img.dataset.fallback = '1';
                        img.src = fallback;
                      }
                    }}
                  />
                  <div className="dl-w">
                    <b dir={getFirstStrongDirection(sim.nameAr)}>
                      <bdi dir="auto">{sim.nameAr}</bdi>
                    </b>
                    <small>{sim.category}</small>
                  </div>
                </Pressable>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Claim & Report WhatsApp Links */}
      <div className="dl-cr">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Store />}
          className="text-amber-700"
          onClick={() => {
            if (onNavigateToBusinessClaim) {
              onNavigateToBusinessClaim(business);
            } else {
              window.open(
                `https://wa.me/201556221141?text=${encodeURIComponent(
                  `مرحباً دليلك 👋 أنا صاحب منشأة "${business.nameAr}" وأود إدارة وتحديث بياناتها.`
                )}`,
                '_blank',
                'noopener,noreferrer'
              );
            }
          }}
        >
          صاحب النشاط؟ اطلب الإدارة
        </Button>

        <a
          href={`https://wa.me/201556221141?text=${encodeURIComponent(
            `إبلاغ عن خطأ: "${business.nameAr}" (${business.id})`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>إبلاغ عن خطأ</span>
        </a>
      </div>
    </div>
  );
};
