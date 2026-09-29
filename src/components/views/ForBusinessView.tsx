import React, { useState } from 'react';
import { FREE_DIRECTORY_SERVICE, EGYPT_GOVERNORATES, PACKAGES } from '../../data/mockData';
import { CATEGORY_TAXONOMY, getCategoryGroupById, getSubcategoryById } from '../../data/categoryTaxonomy';
import {
  Store,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Sparkles,
  Phone,
  Send,
  ArrowLeft,
  BadgeDollarSign,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { isValidEgyptianPhone, normalizePhone } from '../../utils/phone';

export interface ForBusinessViewProps {
  onNavigate: (path: string) => void;
}

const DRAFT_KEY = 'dalelak_for_business_draft';

function loadDraft() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const ForBusinessView: React.FC<ForBusinessViewProps> = ({ onNavigate }) => {
  const [draft] = useState(loadDraft);
  const [bizName, setBizName] = useState(draft?.bizName || '');
  const [ownerName, setOwnerName] = useState(draft?.ownerName || '');
  const [phone, setPhone] = useState(draft?.phone || '');
  const [gov, setGov] = useState(draft?.gov || 'الجيزة');
  const [mainCategoryId, setMainCategoryId] = useState(draft?.mainCategoryId || 'all');
  const [subcategoryId, setSubcategoryId] = useState(draft?.subcategoryId || 'all');
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const selectedCategoryGroup = getCategoryGroupById(mainCategoryId);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ bizName, ownerName, phone, gov, mainCategoryId, subcategoryId })
      );
    } catch {}
  }, [bizName, ownerName, phone, gov, mainCategoryId, subcategoryId]);

  const getWhatsAppMessageText = () => {
    return `مرحباً دليلك 👋 أود إدراج نشاطي في المنصة:
- اسم النشاط: ${bizName.trim()}
- اسم المسؤول: ${ownerName.trim() || 'صاحب النشاط'}
- رقم الهاتف: ${phone.trim()}
- المحافظة: ${gov}
- الفئة الرئيسية: ${selectedCategoryGroup?.label || 'غير محددة'}
- النوع الفرعي: ${getSubcategoryById(subcategoryId)?.label || 'غير محدد'}
- الخدمة المطلوبة: إدراج مجاني (0 ج) بموقع Google Maps`;
  };

  const getWhatsAppUrl = () => {
    return `https://wa.me/201556221141?text=${encodeURIComponent(getWhatsAppMessageText())}`;
  };

  const openWhatsApp = () => {
    let popup: Window | null = null;
    try {
      popup = window.open(getWhatsAppUrl(), '_blank');
    } catch {
      popup = null;
    }

    if (!popup || popup.closed) {
      setPopupBlocked(true);
      setSubmitted(false);
      return false;
    }

    setPopupBlocked(false);
    setSubmitted(true);
    return true;
  };

  const handleCopyMessage = async () => {
    try {
      const text = getWhatsAppMessageText();
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyStatus('copied');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!success) throw new Error('execCommand copy failed');
        setCopyStatus('copied');
      }
    } catch {
      setCopyStatus('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) return;

    if (!isValidEgyptianPhone(phone)) {
      setPhoneError('يرجى إدخال رقم هاتف محمول مصري صحيح (مثال: 01012345678)');
      return;
    }
    setPhoneError('');

    openWhatsApp();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-24 text-right" style={{ direction: 'rtl' }}>
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">أضف نشاطك مجاناً</h1>
        <p className="text-sm text-emerald-700">تسجيل نشاطك وظهوره في الدليل مجانيان بالكامل.</p>
      </header>

      {/* Submission Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">بيانات النشاط</h3>
          <p className="text-xs text-slate-500 font-medium">
            أدخل بيانات النشاط الأساسية وسيتم التواصل معك لاعتماد ونشر مكانكم على المنصة
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-black text-base text-slate-900">تم تجهيز طلب الإدراج بنجاح</h4>
              <p className="text-xs text-slate-600 font-medium">
                فُتحت رسالة جاهزة ببيانات منشأتك للتواصل مع فريق الدعم الفني عبر واتساب.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إعادة فتح واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                تعديل البيانات
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {popupBlocked && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 text-right space-y-3 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-slate-900">
                      تعذر فتح واتساب تلقائياً (تم حظر النوافذ المنبثقة)
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      يبدو أن المتصفح قد حظر فتح نافذة جديدة تلقائياً. مسودة بياناتك محفوظة؛ يمكنك إعادة المحاولة بالزر أدناه أو نسخ نص الرسالة وإرسالها يدوياً.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openWhatsApp()}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>افتح واتساب مرة أخرى</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>انسخ الرسالة</span>
                  </button>
                </div>

                {copyStatus === 'copied' && (
                  <p role="status" className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم نسخ الرسالة بنجاح إلى الحافظة! يمكنك الآن لصقها في محادثة واتساب.</span>
                  </p>
                )}
                {copyStatus === 'error' && (
                  <p role="alert" className="text-xs font-bold text-rose-600 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>تعذر النسخ التلقائي إلى الحافظة. يرجى المحاولة مرة أخرى أو فتح واتساب مباشرة.</span>
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اسم المنشأة أو المحل التجاري *</label>
                <input
                  type="text"
                  required
                  aria-label="اسم النشاط"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="مثال: مطعم الأهرام، صيدلية السلام..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اسم صاحب النشاط أو المسؤول</label>
                <input
                  type="text"
                  aria-label="اسم المسؤول"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="الاسم الكريم..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">رقم الهاتف أو الواتساب للتواصل *</label>
                <input
                  type="tel"
                  required
                  aria-label="رقم الهاتف"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'phone-error-msg' : undefined}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="01XXXXXXXXX"
                  className={`w-full bg-white border rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none ${
                    phoneError ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20' : 'border-slate-200 focus:border-amber-500'
                  }`}
                />
                {phoneError && (
                  <p id="phone-error-msg" role="alert" className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">المحافظة</label>
                <select
                  aria-label="المحافظة"
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">الفئة الرئيسية للنشاط</label>
                <select
                  aria-label="الفئة الرئيسية"
                  value={mainCategoryId}
                  onChange={(e) => {
                    setMainCategoryId(e.target.value);
                    setSubcategoryId('all');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">اختر الفئة الرئيسية</option>
                  {CATEGORY_TAXONOMY.map((group) => (
                    <option key={group.id} value={group.id}>{group.icon} {group.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">نوع النشاط أو الخدمة بالتحديد</label>
                <select
                  aria-label="نوع النشاط"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!selectedCategoryGroup}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">{selectedCategoryGroup ? `كل ${selectedCategoryGroup.label}` : 'اختر الفئة الرئيسية أولاً'}</option>
                  {selectedCategoryGroup?.children.map((child) => (
                    <option key={child.id} value={child.id}>{child.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">{FREE_DIRECTORY_SERVICE.condition}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-8 py-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>متابعة الطلب عبر واتساب</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/pricing')}
                className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <BadgeDollarSign className="w-4 h-4 text-amber-600" />
                <span>الاطلاع على باقات التسويق والتأسيس الرقمي</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
