import React, { useState } from 'react';
import { Heart, MapPin, Star, ShieldCheck, Phone, Navigation, MessageCircle, Play, ExternalLink } from 'lucide-react';
import type { DirectoryPlace, DirectoryActions } from '../contracts/directory';
import { CategoryIcon } from './CategoryIcon';

export interface PlaceCardProps extends DirectoryActions {
  place: DirectoryPlace;
  saved: boolean;
  onSave: (id: string) => void;
  onOpen: (place: DirectoryPlace) => void;
}

/** Returns a Google Maps directions URL for the given place. */
function buildMapsUrl(place: DirectoryPlace): string {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city}`)}`;
}

export function PlaceCard({ place: p, saved, onSave, onOpen, onAction }: PlaceCardProps) {
  const [failed, setFailed] = useState(false);

  return (
    <article className="directory-card">
      {/* ── Media ── */}
      <div className="directory-card-media">
        {p.photos[0] && !failed ? (
          <img
            src={p.photos[0]}
            alt={`صورة توضيحية لـ ${p.name}`}
            width={600}
            height={338}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="directory-card-art">
            <CategoryIcon category={p.category} />
            <span>{p.category}</span>
          </div>
        )}
        {/* Save / favourite button */}
        <button
          className="directory-card-favorite"
          aria-pressed={saved}
          aria-label={`${saved ? 'إزالة' : 'حفظ'} ${p.name} ${saved ? 'من' : 'في'} المفضلة`}
          onClick={() => onSave(p.id)}
        >
          <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {/* Video tour badge */}
        {p.hasVideo && (
          <button className="directory-card-video" onClick={() => onOpen(p)}>
            <Play size={15} />جولة المكان
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="directory-card-content">
        <div className="directory-card-meta">
          <span>{p.category}</span>
          {p.verified && (
            <span className="inline-flex gap-1 items-center">
              <ShieldCheck size={14} />موثق
            </span>
          )}
        </div>

        <h3>
          {/* Navigates in-app; Ctrl/Cmd+Click opens the native hash link in a new tab */}
          <a
            href={`#/place/${p.id}`}
            onClick={e => {
              if (e.ctrlKey || e.metaKey || e.shiftKey) return;
              e.preventDefault();
              onOpen(p);
            }}
          >
            {p.name}
          </a>
        </h3>

        <p className="directory-card-address">
          <MapPin size={16} />{p.city} · {p.area}
        </p>

        <div className="directory-card-hours">
          <span>
            {p.open === null
              ? 'ساعات العمل غير متاحة'
              : <strong style={{ color: p.open ? 'var(--d-success)' : 'var(--d-muted)' }}>
                  {p.open ? 'مفتوح الآن' : 'مغلق حاليًا'}
                </strong>}
          </span>
          {p.rating && (
            <span className="inline-flex gap-1 items-center">
              <Star size={14} /><bdi>{p.rating} ({p.reviewCount})</bdi>
            </span>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="directory-card-actions">
          {/* Directions — always clickable; opens dialog for in-app experience */}
          <button
            onClick={() => onAction('directions', p)}
            disabled={!p.coordinates}
            title="الاتجاهات إلى المكان"
          >
            <Navigation size={15} />الاتجاهات
          </button>
          {/* WhatsApp */}
          <button
            onClick={() => onAction('whatsapp', p)}
            disabled={!p.phone}
            title={p.phone ? 'التواصل عبر واتساب' : 'رقم الهاتف غير متاح'}
          >
            <MessageCircle size={15} />واتساب
          </button>
          {/* Phone call */}
          <button
            onClick={() => onAction('call', p)}
            disabled={!p.phone}
            title={p.phone ? 'الاتصال بالنشاط' : 'رقم الهاتف غير متاح'}
          >
            <Phone size={15} />اتصال
          </button>
        </div>

        {/* External Google Maps link — discrete, always available */}
        <button type="button" onClick={()=>onAction('directions', p)} 
          className="directory-card-maps-link"
          
          
          
          aria-label={`افتح ${p.name} في خرائط جوجل`}
        >
          <ExternalLink size={12} />عرض على خرائط جوجل
        </button>
      </div>
    </article>
  );
}
