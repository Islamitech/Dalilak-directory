import React, { useState } from 'react';
import {
  Heart, Share2, Phone, Navigation, MessageCircle,
  Play, UserPlus, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink, Star, MapPin
} from 'lucide-react';
import type { DirectoryPlace, DirectoryActions } from '../contracts/directory';
import { Dialog } from '../design-system/Dialog';
import { CategoryIcon } from '../discovery/CategoryIcon';

interface Props extends DirectoryActions {
  place: DirectoryPlace;
  saved: boolean;
  onSave: (id: string) => void;
  onClose: () => void;
  onClaim: () => void;
}

/** Returns a Google Maps directions URL or a search URL as fallback. */
function buildMapsUrl(place: DirectoryPlace): string {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  }
  if (place.mapPoint) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.city}`)}`;
}

export function PlaceDetails({ place: p, saved, onSave, onClose, onAction, onClaim }: Props) {
  const [photo, setPhoto] = useState<number | null>(null);
  const [video, setVideo] = useState(false);
  const [playing, setPlaying] = useState(false);

  const hasLocation = !!(p.coordinates || p.mapPoint);

  return (
    <Dialog title={p.name} onClose={onClose}>

      {/* ── Photo gallery ── */}
      {p.photos.length ? (
        <div className="directory-detail-gallery">
          {p.photos.map((src, index) => (
            <button
              key={src}
              onClick={() => setPhoto(index)}
              aria-label={`تكبير الصورة ${index + 1}`}
            >
              <img src={src} alt={`صورة توضيحية ${index + 1} للنشاط`} />
            </button>
          ))}
        </div>
      ) : (
        <div className="directory-card-art rounded-xl p-8 mb-6">
          <CategoryIcon category={p.category} />
          <p>لا توجد صور لهذا النشاط في بيانات العرض</p>
        </div>
      )}

      {/* ── Category kicker ── */}
      <div className="directory-kicker">
        {p.category}
        {p.verified && (
          <><ShieldCheck size={16} />موثق</>
        )}
        {p.rating && (
          <span className="inline-flex gap-1 items-center text-amber-600">
            <Star size={14} fill="currentColor" />
            <bdi>{p.rating}</bdi>
            {p.reviewCount && <span className="text-slate-500 font-normal">({p.reviewCount} مراجعة)</span>}
          </span>
        )}
      </div>

      <h3 className="text-3xl font-bold mb-3">{p.name}</h3>
      <p className="text-slate-600 leading-8">{p.description}</p>

      {/* ── Quick chip actions ── */}
      <div className="flex gap-2 flex-wrap mt-5">
        <button
          className="directory-chip"
          aria-pressed={saved}
          onClick={() => onSave(p.id)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'محفوظ في المفضلة' : 'حفظ النشاط'}
        </button>
        <button className="directory-chip" onClick={() => onAction('share', p)}>
          <Share2 size={17} />مشاركة
        </button>
        {p.hasVideo && (
          <button className="directory-chip" onClick={() => setVideo(true)}>
            <Play size={17} />جولة مرئية
          </button>
        )}
      </div>

      {/* ── Fact sheet ── */}
      <dl className="directory-detail-facts">
        <div>
          <dt>العنوان</dt>
          <dd className="flex items-start gap-1"><MapPin size={14} className="mt-1 flex-shrink-0" />{p.address}، {p.city}</dd>
        </div>
        <div>
          <dt>ساعات العمل</dt>
          <dd>
            {p.open !== null && (
              <strong style={{ color: p.open ? 'var(--d-success)' : 'var(--d-muted)' }}>
                {p.open ? 'مفتوح الآن · ' : 'مغلق حاليًا · '}
              </strong>
            )}
            {p.hours || 'غير متاحة — تواصل مع النشاط للتأكد'}
          </dd>
        </div>
        <div>
          <dt>رقم التواصل</dt>
          <dd><bdi>{p.phone || 'غير متاح'}</bdi></dd>
        </div>
        <div>
          <dt>الموقع</dt>
          <dd>
            {hasLocation ? (
              <button type="button" onClick={()=>onAction('directions', p)} 
                
                
                
                className="inline-flex items-center gap-1 text-emerald-700 underline"
              >
                عرض على الخريطة <ExternalLink size={13} />
              </button>
            ) : 'الموقع الدقيق غير متاح'}
          </dd>
        </div>
      </dl>

      {/* ── Primary action buttons ── */}
      <div className="flex gap-3 flex-wrap">
        <button
          className="directory-button"
          disabled={!p.phone}
          title={p.phone ? undefined : 'رقم الهاتف غير متاح'}
          onClick={() => onAction('call', p)}
        >
          <Phone size={17} />اتصال
        </button>
        <button
          className="directory-button secondary"
          disabled={!p.phone}
          title={p.phone ? undefined : 'رقم الهاتف غير متاح'}
          onClick={() => onAction('whatsapp', p)}
        >
          <MessageCircle size={17} />واتساب
        </button>
        <button
          className="directory-button secondary"
          onClick={() => onAction('directions', p)}
          title={hasLocation ? undefined : 'سيتم البحث بالاسم'}
        >
          <Navigation size={17} />الاتجاهات
        </button>
        {/* Direct Google Maps link — always available */}
        <button type="button" onClick={()=>onAction('directions', p)} 
          className="directory-button secondary"
          
          
          
          aria-label={`افتح ${p.name} في خرائط جوجل`}
        >
          <ExternalLink size={17} />خرائط جوجل
        </button>
        <button
          className="directory-button secondary"
          disabled={!p.phone}
          title={p.phone ? undefined : 'رقم الهاتف غير متاح'}
          onClick={() => onAction('contact', p)}
        >
          <UserPlus size={17} />حفظ جهة الاتصال
        </button>
      </div>

      {/* ── Footer links ── */}
      <div className="mt-6 pt-5 border-t flex justify-between gap-4 flex-wrap">
        <button onClick={onClaim} className="text-emerald-800 underline">
          هل تملك هذا النشاط؟
        </button>
        <button onClick={() => onAction('report', p)} className="text-slate-600 underline">
          الإبلاغ عن معلومة غير صحيحة
        </button>
      </div>

      {/* ── Lightbox dialog ── */}
      {photo !== null && (
        <Dialog
          title={`الصور · ${photo + 1} من ${p.photos.length}`}
          onClose={() => setPhoto(null)}
        >
          <img
            src={p.photos[photo]}
            alt={`صورة توضيحية ${photo + 1}`}
            className="rounded-xl max-h-[60vh] w-full object-contain"
          />
          {p.photos.length > 1 && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                className="directory-button secondary"
                onClick={() => setPhoto((photo - 1 + p.photos.length) % p.photos.length)}
                aria-label="الصورة السابقة"
              >
                <ChevronRight size={18} />السابقة
              </button>
              <button
                className="directory-button secondary"
                onClick={() => setPhoto((photo + 1) % p.photos.length)}
                aria-label="الصورة التالية"
              >
                التالية<ChevronLeft size={18} />
              </button>
            </div>
          )}
        </Dialog>
      )}

      {/* ── Video dialog ── */}
      {video && (
        <Dialog
          title={`جولة مرئية · ${p.name}`}
          onClose={() => { setVideo(false); setPlaying(false); }}
        >
          <div className="rounded-2xl bg-emerald-950 text-white p-10 text-center">
            <Play size={45} className="mx-auto mb-5" />
            <h3 className="text-xl mb-3">
              {playing ? 'الجولة قيد العرض — محاكاة' : 'تعرّف على أجواء المكان'}
            </h3>
            <p className="text-sm mb-6">
              معاينة لحالة مشغّل الفيديو. لا يوجد ملف فيديو حقيقي ضمن الأصول الحالية.
            </p>
            <button className="directory-button gold" onClick={() => setPlaying(!playing)}>
              {playing ? 'إيقاف مؤقت' : 'تشغيل الجولة التجريبية'}
            </button>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}
