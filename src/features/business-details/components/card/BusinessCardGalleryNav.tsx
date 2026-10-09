import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pressable } from '../../../../shared/ui';

export interface BusinessCardGalleryNavProps {
  count: number;
  currentSlide: number;
  onSlide: (direction: number, event: React.MouseEvent) => void;
}

export const BusinessCardGalleryNav: React.FC<BusinessCardGalleryNavProps> = ({
  count,
  currentSlide,
  onSlide,
}) => (
  <>
    <span className="dl-cnt" dir="ltr" aria-hidden="true">
      {currentSlide + 1}/{count}
    </span>
    <Pressable
      type="button"
      className="dl-nav-btn dl-nx"
      onClick={(event) => onSlide(1, event)}
      aria-label="الصورة التالية"
      style={{ display: currentSlide >= count - 1 ? 'none' : 'flex' }}
    >
      <ChevronLeft className="w-4 h-4" />
    </Pressable>
    <Pressable
      type="button"
      className="dl-nav-btn dl-pv"
      onClick={(event) => onSlide(-1, event)}
      aria-label="الصورة السابقة"
      style={{ display: currentSlide <= 0 ? 'none' : 'flex' }}
    >
      <ChevronRight className="w-4 h-4" />
    </Pressable>
    <div className="dl-segs" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} className={`dl-seg ${index === currentSlide ? 'dl-on' : ''}`} />
      ))}
    </div>
  </>
);
