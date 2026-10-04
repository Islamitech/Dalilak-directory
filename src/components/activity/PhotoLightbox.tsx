import React, { useState, useEffect } from 'react';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';

export interface ShowcasePhotoLightboxProps {
  photos: string[];
  previewPhotoIndex: number | null;
  setPreviewPhotoIndex: (index: number | null) => void;
  handlePrevPhoto: () => void;
  handleNextPhoto: () => void;
}
export type PhotoLightboxProps = ShowcasePhotoLightboxProps;

export const ShowcasePhotoLightbox: React.FC<ShowcasePhotoLightboxProps> = ({
  photos,
  previewPhotoIndex,
  setPreviewPhotoIndex,
  handlePrevPhoto,
  handleNextPhoto,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isOpen = previewPhotoIndex !== null && photos.length > 0;

  const { containerRef } = useAccessibleDialog({
    isOpen,
    onClose: () => setPreviewPhotoIndex(null),
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevPhoto, handleNextPhoto]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="معرض صور النشاط"
      tabIndex={-1}
      className="fixed inset-0 z-[99999] bg-slate-950/97 backdrop-blur-md flex items-center justify-center animate-fade-in outline-none"
      onClick={() => setPreviewPhotoIndex(null)}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) {
          delta > 0 ? handlePrevPhoto() : handleNextPhoto();
        }
        setTouchStartX(null);
      }}
    >
      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPhoto();
          }}
          className="absolute start-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95"
          title="الصورة السابقة"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div 
        className="relative inline-block max-w-full max-h-[85vh] select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={photos[previewPhotoIndex]}
          alt=""
          role="presentation"
          aria-hidden="true"
          data-reader-skip="true"
          data-readability-ignore="true"
          draggable={false}
          className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-fade-in-scale pointer-events-none select-none"
          onClick={(e) => e.stopPropagation()}
        />
        {/* Anti-Extraction Transparent Protection Shield */}
        <div 
          className="absolute inset-0 z-10 select-none pointer-events-auto cursor-default"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
        <PhotoWatermarkBadge
          position="bottom-right"
          size="xl"
          className="!bottom-4 !end-4 sm:!bottom-6 sm:!end-6 shadow-2xl z-20"
        />
      </div>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextPhoto();
          }}
          className="absolute end-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95"
          title="الصورة التالية"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <button
        type="button"
        onClick={() => setPreviewPhotoIndex(null)}
        className="absolute top-4 start-4 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
        title="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[80vw] overflow-x-auto py-1 px-2 scrollbar-none">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewPhotoIndex(i);
              }}
              className={`rounded-full transition-all cursor-pointer shrink-0 ${
                i === previewPhotoIndex ? 'w-6 h-2 bg-amber-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      <span className="absolute bottom-4 end-4 text-white/70 text-xs font-bold">
        {previewPhotoIndex + 1} / {photos.length}
      </span>
    </div>
  );
};
