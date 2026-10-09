import React, { useState } from 'react';
import { Business } from '../types';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { Modal, IconButton, Pressable } from '../shared/ui';
import { getWhatsAppUrl } from '../shared/lib/whatsapp';
import { getGoogleMapsDirectionsUrl } from '../shared/lib/directions';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Navigation, 
  Clock, 
  Sparkles,
  Share2,
  Check,
  Film
} from 'lucide-react';

interface VideoPlayerModalProps {
  business: Business | null;
  videoUrl?: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  business,
  videoUrl,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!business) return null;

  const activeVideo = videoUrl || (business.videos && business.videos.length > 0 ? business.videos[0] : null);
  if (!activeVideo) return null;

  const isVerified = business.verificationStatus === 'verified' || business.googleSyncStatus === 'synced';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `فيديو ${business.nameAr} على منصة دليلك`,
        text: `شاهد فيديو "${business.nameAr}" الموثق في ${business.governorate}:`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
  };

  const whatsAppUrl = getWhatsAppUrl(
    business.whatsapp || business.phone || business.secondaryPhone || '',
    `مرحباً "${business.nameAr}"، رأيت الفيديو الخاص بكم على منصة دليلك.`
  );

  const directionsUrl = business.googleMapsUrl && business.googleMapsUrl.trim().startsWith('http')
    ? business.googleMapsUrl.trim()
    : getGoogleMapsDirectionsUrl({
        lat: business.lat,
        lng: business.lng,
        destinationAddress: `${business.nameAr} ${business.street || ''} ${business.city} ${business.governorate}`,
      });

  return (
    <Modal
      isOpen={!!business && !!activeVideo}
      onClose={onClose}
      maxWidth="lg"
      hideDefaultHeader
      aria-labelledby="video-modal-title"
      className="!bg-slate-900 !border-amber-500/40 text-slate-100 !rounded-lg !shadow-2xl overflow-hidden"
      overlayClassName="!bg-slate-950/90 !backdrop-blur-xl"
      contentClassName="p-0"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 id="video-modal-title" className="font-extrabold text-sm text-white line-clamp-1 flex items-center gap-1.5">
              <span>{business.nameAr}</span>
              {isVerified && (
                <span className="text-caption font-bold px-2 py-0.2 rounded-pill bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  ✓ موثق
                </span>
              )}
            </h3>
            <p className="text-caption text-slate-400 font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{business.governorate} • {business.city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton
            aria-label={copied ? 'تم نسخ الرابط بنجاح!' : 'مشاركة الفيديو'}
            onClick={handleShare}
            size="sm"
            variant="ghost"
            className={`!w-9 !h-9 !rounded-md transition-colors ${
              copied ? '!bg-amber-600 !text-white' : '!bg-slate-800 hover:!bg-slate-700 !text-slate-300'
            }`}
            icon={copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          />
          <IconButton
            aria-label="إغلاق"
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="!w-9 !h-9 !rounded-md !bg-slate-800 hover:!bg-rose-500/20 !text-slate-400 hover:!text-rose-400"
            icon={<span className="text-sm font-extrabold">✕</span>}
          />
        </div>
      </div>

      {/* Cinematic Video Player Container */}
      <div className="relative aspect-[9/13] max-h-[58vh] bg-black flex items-center justify-center overflow-hidden">
        <video
          src={activeVideo}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
        <VideoWatermarkBadge position="bottom-right" />
      </div>

      {/* Video Bottom Summary & Fast Actions */}
      <div className="p-4 bg-slate-950/90 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-pill font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>فيديو ميداني موثق (30 ثانية)</span>
          </span>

          {business.workingHours && (
            <span className="text-caption text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{business.workingHours}</span>
            </span>
          )}
        </div>

        {business.description && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/5 font-medium">
            {business.description}
          </p>
        )}

        {/* Fast Contact Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-extrabold text-xs py-2.5 rounded-pill flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال</span>
            </a>
          ) : (
            <span />
          )}

          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-extrabold text-xs py-2.5 rounded-pill flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>
          ) : (
            <span />
          )}

          {directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-extrabold text-xs py-2.5 rounded-pill flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
              title="فتح على خرائط Google"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>الخريطة 🗺️</span>
            </a>
          ) : (
            <Pressable
              type="button"
              disabled
              className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-pill flex items-center justify-center gap-1.5 border border-slate-700 cursor-not-allowed opacity-60"
            >
              <Navigation className="w-3.5 h-3.5 opacity-40" />
              <span>قيد التوثيق ⏳</span>
            </Pressable>
          )}
        </div>
      </div>
    </Modal>
  );
};
