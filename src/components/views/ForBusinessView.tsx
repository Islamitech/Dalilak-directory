import React, { useState, useEffect } from 'react';
import { FREE_DIRECTORY_SERVICE } from '../../data/mockData';
import { CheckCircle2, AlertCircle, Send, BadgeDollarSign, Copy, Check } from 'lucide-react';
import { isValidEgyptianPhone } from '../../shared/lib/phone';
import {
  loadMerchantDraft,
  saveMerchantDraft,
  createMerchantWhatsAppMessage,
  getMerchantWhatsAppIntentUrl,
  MerchantDraft,
} from '../../features/for-business/model/merchantRegistration';
import { MerchantFormFields } from '../../features/for-business/components/MerchantFormFields';

export interface ForBusinessViewProps {
  onNavigate: (path: string) => void;
}

export const ForBusinessView: React.FC<ForBusinessViewProps> = ({ onNavigate }) => {
  const [draft] = useState<MerchantDraft | null>(loadMerchantDraft);
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

  const currentDraft: MerchantDraft = { bizName, ownerName, phone, gov, mainCategoryId, subcategoryId };

  useEffect(() => {
    saveMerchantDraft(currentDraft);
  }, [bizName, ownerName, phone, gov, mainCategoryId, subcategoryId]);

  const openWhatsApp = () => {
    let popup: Window | null = null;
    try {
      popup = window.open(getMerchantWhatsAppIntentUrl(currentDraft), '_blank');
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
      const text = createMerchantWhatsAppMessage(currentDraft);
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-24 text-start" style={{ direction: 'rtl' }}>
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">أضف نشاطك مجاناً</h1>
        <p className="text-sm text-emerald-700">تسجيل نشاطك وظهوره في الدليل مجانيان بالكامل.</p>
      </header>

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
                href={getMerchantWhatsAppIntentUrl(currentDraft)}
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
              <div role="alert" aria-live="assertive" className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 text-start space-y-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-slate-900">تعذر فتح واتساب تلقائياً (تم حظر النوافذ المنبثقة)</h4>
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
              </div>
            )}

            <MerchantFormFields
              bizName={bizName}
              setBizName={setBizName}
              ownerName={ownerName}
              setOwnerName={setOwnerName}
              phone={phone}
              setPhone={setPhone}
              phoneError={phoneError}
              gov={gov}
              setGov={setGov}
              mainCategoryId={mainCategoryId}
              setMainCategoryId={setMainCategoryId}
              subcategoryId={subcategoryId}
              setSubcategoryId={setSubcategoryId}
            />

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
