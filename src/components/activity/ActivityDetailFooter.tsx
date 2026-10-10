import React, { useState } from 'react';
import { Pressable, Button } from '../../shared/ui';
import { Store, AlertTriangle } from 'lucide-react';
import { Business } from '../../types';
import { getFirstStrongDirection } from '../../shared/lib/textDirection';
import { collectRealPhotos } from '../../utils/categoryPhotos';
import { getCategoryVisual } from '../../utils/categoryVisuals';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export interface ActivityDetailFooterProps {
  business: Business;
  similarPlaces: Business[];
  onSelectBusiness?: (biz: Business) => void;
  effectiveUrl?: string | null;
  onShowOnMap?: (biz: Business) => void;
  onNavigateToBusinessClaim?: (biz: Business) => void;
}

function SimilarMark({ business }: { business: Business }) {
  const cover = collectRealPhotos(business.photos, business.coverPhoto)[0];
  const [failed, setFailed] = useState(false);
  if (!cover || failed) {
    return <span className="dl-sm-ico">{getCategoryVisual(business.category, 'light').icon}</span>;
  }
  return (
    <img
      src={getOptimizedImageUrl(cover, 96, 96)}
      alt=""
      className="dl-sm-img"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export const ActivityDetailFooter: React.FC<ActivityDetailFooterProps> = ({
  business,
  similarPlaces,
  onSelectBusiness,
  onNavigateToBusinessClaim,
}) => {
  return (
    <div className="space-y-3 pt-1">
      {similarPlaces.length > 0 && (
        <div className="dl-sm">
          <h4>أنشطة مشابهة</h4>
          <div className="dl-g">
            {similarPlaces.map((sim) => (
              <Pressable key={sim.id} type="button" onClick={() => onSelectBusiness && onSelectBusiness(sim)}>
                <SimilarMark business={sim} />
                <div className="dl-w">
                  <b dir={getFirstStrongDirection(sim.nameAr)}>
                    <bdi dir="auto">{sim.nameAr}</bdi>
                  </b>
                  <small>{sim.category}</small>
                </div>
              </Pressable>
            ))}
          </div>
        </div>
      )}

      <div className="dl-cr">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Store />}
          className="text-slate-400!"
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
