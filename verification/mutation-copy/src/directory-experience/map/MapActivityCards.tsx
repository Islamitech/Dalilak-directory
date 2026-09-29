import React, { useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Star, Heart, ShieldCheck, ChevronDown, ChevronUp, Phone, MessageCircle, Navigation, ExternalLink } from 'lucide-react';
import type { DirectoryPlace, ActionKind } from '../contracts/directory';
import { CategoryIcon } from '../discovery/CategoryIcon';

interface Props {
  places: readonly DirectoryPlace[];
  selected?: DirectoryPlace;
  area: string;
  searching: boolean;
  saved: readonly string[];
  onSelect: (id: string) => void;
  onBack: () => void;
  onDetails: (place: DirectoryPlace) => void;
  onSave: (id: string) => void;
  open?: boolean;
  onToggle?: () => void;
  /** onAction receives the action kind AND the relevant place so callers can open the correct dialog. */
  onAction?: (type: ActionKind, place: DirectoryPlace) => void;
}

function Thumbnail({ place }: { place: DirectoryPlace }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="hm-card-media">
      {place.photos[0] && !failed
        ? <img src={place.photos[0]} alt="صورة توضيحية للنشاط" onError={() => setFailed(true)} />
        : <CategoryIcon category={place.category} size={28} />}
    </div>
  );
}

/** Returns a Google Maps directions URL for the given place (falls back to address search). */
function buildMapsUrl(place: DirectoryPlace): string {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city}`)}`;
}

export function MapActivityCards(p: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  /** Track which card is centred as the user scrolls the horizontal strip. */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || p.places.length < 2) return;
    const cardWidth = el.scrollWidth / p.places.length;
    setActiveIdx(Math.round(el.scrollLeft / cardWidth));
  }, [p.places.length]);

  if (!p.places.length && !p.selected) return null;

  return (
    <section
      className={`hm-activity-overlay ${p.selected ? 'is-detail' : ''}`}
      data-map-ui="true"
      aria-label="كروت الأنشطة على الخريطة"
      onPointerDown={e => e.stopPropagation()}
    >
      {p.selected ? (
        /* ── Expanded single-place card ── */
        <article className="hm-expanded-card" key={p.selected.id}>
          <div className="hm-cards-heading">
            <button className="hm-cards-back" onClick={p.onBack}>
              <ArrowRight size={17} />الرجوع لأبرز الأنشطة
            </button>
            <span>النشاط المحدد</span>
          </div>

          <div className="hm-expanded-body">
            <Thumbnail place={p.selected} />
            <div>
              <span className="hm-card-category">{p.selected.category}</span>
              <h2>{p.selected.name}</h2>
              <p><MapPin size={14} />{p.selected.address}</p>
              <p>
                {p.selected.open === null
                  ? 'مواعيد العمل غير متاحة'
                  : p.selected.open ? 'مفتوح الآن' : 'مغلق حاليًا'}
                {p.selected.rating && <> · <Star size={12} /><bdi>{p.selected.rating}</bdi></>}
              </p>
            </div>
          </div>

          <p className="hm-expanded-description">{p.selected.description}</p>

          {/* Quick action row — passes the real place to onAction */}
          {p.onAction && (
            <div className="hm-expanded-quick-actions">
              <button
                type="button"
                className="hm-quick-action-btn"
                disabled={!p.selected.phone}
                title={p.selected.phone ? undefined : 'رقم الهاتف غير متاح'}
                onClick={() => p.onAction!('call', p.selected!)}
              >
                <Phone size={13} />اتصال
              </button>
              <button
                type="button"
                className="hm-quick-action-btn"
                disabled={!p.selected.phone}
                title={p.selected.phone ? undefined : 'رقم الهاتف غير متاح'}
                onClick={() => p.onAction!('whatsapp', p.selected!)}
              >
                <MessageCircle size={13} />واتساب
              </button>
              <button
                type="button"
                className="hm-quick-action-btn"
                onClick={() => p.onAction!('directions', p.selected!)}
              >
                <Navigation size={13} />الاتجاهات
              </button>
            </div>
          )}

          {/* Bottom row: details + external map link + save */}
          <div className="hm-expanded-actions">
            <button className="directory-button" onClick={() => p.onDetails(p.selected!)}>
              تفاصيل النشاط<ArrowLeft size={16} />
            </button>
            {/* Open real external map in a new tab — always available */}
            <button type="button" onClick={()=>p.onAction?.('directions', p.selected!)} 
              className="hm-quick-action-btn hm-maps-link"
              
              
              
              aria-label={`افتح ${p.selected.name} في خرائط جوجل`}
              title="عرض الموقع على خرائط جوجل"
            >
              <ExternalLink size={15} />
            </button>
            <button
              className="hm-card-save"
              aria-label={p.saved.includes(p.selected.id) ? 'إزالة النشاط المحدد من المفضلة' : 'حفظ النشاط المحدد'}
              aria-pressed={p.saved.includes(p.selected.id)}
              onClick={() => p.onSave(p.selected!.id)}
            >
              <Heart size={19} fill={p.saved.includes(p.selected.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </article>
      ) : (
        /* ── Collapsed / strip view ── */
        <>
          <button
            className="hm-cards-heading hm-cards-toggle"
            onClick={p.onToggle}
            aria-expanded={p.open !== false}
          >
            <span className="hm-tray-title">
              {p.searching
                ? 'أبرز نتائج البحث'
                : p.area === 'all'
                  ? 'أماكن تستحق الاكتشاف'
                  : `أبرز الأنشطة في ${p.area}`}
            </span>
            <span>{p.places.length} أماكن</span>
            {p.open === false ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>

          {p.open !== false && (
            <div
              className="hm-featured-cards"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {p.places.map(place => (
                <button
                  className="hm-featured-card"
                  key={place.id}
                  onClick={() => p.onSelect(place.id)}
                  aria-label={`استكشف ${place.name} على الخريطة`}
                >
                  <Thumbnail place={place} />
                  <div className="hm-featured-content">
                    <span className="hm-card-category">
                      {place.category}{place.verified && <ShieldCheck size={12} />}
                    </span>
                    <h3>{place.name}</h3>
                    <div className="hm-card-meta">
                      <span>{place.area}</span>
                      {place.rating
                        ? <span><Star size={12} /><bdi>{place.rating}</bdi></span>
                        : <ArrowLeft size={15} />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Scroll-position indicator dots — react to actual scroll */}
          {p.open !== false && p.places.length > 1 && (
            <div className="hm-cards-dots" aria-hidden="true">
              {p.places.map((_, i) => (
                <span key={i} className={`hm-dot ${i === activeIdx ? 'is-active' : ''}`} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
