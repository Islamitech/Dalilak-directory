import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Phone, Navigation, Share2, MessageCircle, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import type { ActionKind, DirectoryPlace } from '../contracts/directory';
import { Dialog } from '../design-system/Dialog';

const labels: Record<ActionKind, string> = {
  call: 'الاتصال بالنشاط',
  whatsapp: 'التواصل عبر واتساب',
  directions: 'الاتجاهات إلى المكان',
  share: 'مشاركة النشاط',
  contact: 'حفظ جهة الاتصال',
  report: 'تصحيح معلومة',
  package: 'طلب باقة أعمال',
};

/** Returns a Google Maps directions URL for the given place. */
function buildMapsUrl(place: DirectoryPlace): string {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city}`)}`;
}

export function ActionPreview({
  kind, place, packageName, onClose, fail,
}: {
  kind: ActionKind;
  place?: DirectoryPlace;
  packageName?: string;
  onClose: () => void;
  fail: boolean;
}) {
  const [status, setStatus] = useState<'ready' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);

  const finish = () => {
    if (kind === 'report' && !message.trim()) { setInvalid(true); return; }
    setStatus(fail ? 'error' : 'success');
  };

  const shareUrl = place ? `${window.location.origin}${window.location.pathname}#/place/${place.id}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback: select the text */
    }
  };

  const Icon = kind === 'call' ? Phone
    : kind === 'directions' ? Navigation
      : kind === 'share' ? Share2
        : MessageCircle;

  return (
    <Dialog title={labels[kind]} onClose={onClose}>
      {status === 'ready' ? (
        <>
          <Icon size={34} className="text-emerald-800 mb-4" />
          <h3 className="text-xl font-bold mb-3">{packageName || place?.name || 'معاينة الإجراء'}</h3>

          {/* Call — show the number clearly */}
          {kind === 'call' && (
            <p className="text-2xl mb-4"><bdi>{place?.phone}</bdi></p>
          )}

          {/* Directions — real Google Maps link */}
          {kind === 'directions' && place && (
            <div className="mb-4">
              <p className="text-slate-600 mb-3">{place.address}، {place.city}</p>
              <a
                className="directory-button"
                href={buildMapsUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={17} />فتح خرائط جوجل
              </a>
              {!place.coordinates && (
                <p className="directory-form-help mt-2">الموقع الدقيق غير متاح — سيتم البحث بالاسم والعنوان.</p>
              )}
            </div>
          )}

          {/* Directions — gate (no place) */}
          {kind === 'directions' && !place && (
            <p className="mb-4">سيظهر هنا مسار الوصول إلى البوابة المختارة.</p>
          )}

          {/* Share — copyable link */}
          {kind === 'share' && (
            <div className="mb-4">
              <p className="p-3 bg-slate-50 rounded-xl break-all mb-3 text-sm" dir="ltr">{shareUrl}</p>
              <button className="directory-button secondary" onClick={copyLink}>
                {copied ? <><CheckCheck size={16} />تم النسخ!</> : <><Copy size={16} />نسخ الرابط</>}
              </button>
              {navigator.share && place && (
                <button
                  className="directory-button mr-2"
                  onClick={() => navigator.share({ title: place.name, url: shareUrl })}
                >
                  <ExternalLink size={16} />مشاركة
                </button>
              )}
            </div>
          )}

          {/* Report — textarea */}
          {kind === 'report' && (
            <label className="directory-field mb-4">
              ما المعلومة التي تحتاج تصحيحًا؟
              <textarea
                className="border rounded-lg p-3"
                rows={3}
                maxLength={500}
                value={message}
                onChange={e => setMessage(e.target.value)}
                aria-invalid={invalid}
                aria-describedby={invalid ? 'report-error' : undefined}
              />
              {invalid && <small role="alert" id="report-error">اكتب المعلومة التي ترغب في تصحيحها.</small>}
            </label>
          )}

          {/* WhatsApp */}
          {kind === 'whatsapp' && place?.phone && (
            <div className="mb-4">
              <a
                className="directory-button"
                href={`https://wa.me/${place.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} />فتح واتساب
              </a>
            </div>
          )}

          {/* Generic help note for non-link actions */}
          {!['directions', 'share', 'whatsapp'].includes(kind) && (
            <p className="directory-form-help">
              هذا إجراء محاكاة فقط. لن نفتح تطبيقًا خارجيًا أو نرسل رسالة أو ننسخ بيانات أو ننشئ سجلًا.
            </p>
          )}

          {kind !== 'directions' && kind !== 'share' && kind !== 'whatsapp' && (
            <button className="directory-button mt-3" onClick={finish}>
              تجربة نتيجة الإجراء
            </button>
          )}

          {/* Allow simulating success/failure for directions too */}
          {(kind === 'directions' || kind === 'share' || kind === 'whatsapp') && (
            <button className="directory-button secondary mt-3" onClick={onClose}>
              إغلاق
            </button>
          )}
        </>
      ) : status === 'success' ? (
        <div role="status">
          <CheckCircle2 size={40} className="text-emerald-700 mb-4" />
          <h3 className="text-xl font-bold">نجحت المحاكاة</h3>
          <p className="my-4">اكتملت تجربة «{labels[kind]}» دون تنفيذ عملية فعلية.</p>
          <button className="directory-button" onClick={onClose}>العودة إلى الدليل</button>
        </div>
      ) : (
        <div role="alert">
          <AlertCircle size={40} className="text-red-700 mb-4" />
          <h3 className="text-xl font-bold">تعذر إكمال الإجراء</h3>
          <p className="my-4">حُفظت المعلومات داخل النافذة. يمكنك إعادة المحاولة بعد تغيير سيناريو الفشل من أدوات التجربة.</p>
          <button className="directory-button" onClick={() => setStatus('ready')}>العودة والمحاولة مجددًا</button>
        </div>
      )}
    </Dialog>
  );
}
