import React from 'react';
import { PhoneCall, AlertTriangle, X, Pill, Wrench } from 'lucide-react';
import { Pressable } from '../../shared/ui';

export interface HadayekEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

const EMERGENCY_NUMBERS = [
  { name: 'الإسعاف المصري', number: '123', icon: '🚑', desc: 'طوارئ طبية ونقل عاجل' },
  { name: 'شرطة النجدة', number: '122', icon: '🚓', desc: 'استغاثة وأمن الحوادث' },
  { name: 'الحماية المدنية والمطافئ', number: '180', icon: '🚒', desc: 'طوارئ الحرائق والإنقاذ' },
  { name: 'طوارئ الغاز الطبيعي', number: '129', icon: '🔥', desc: 'بلاغات تسريب وأعطال الغاز' },
  { name: 'طوارئ الكهرباء', number: '121', icon: '⚡', desc: 'انقطاع وأعطال المحولات' },
];

export const HadayekEmergencyModal: React.FC<HadayekEmergencyModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="خطوط طوارئ وإنقاذ حدائق الأهرام"
    >
      <div className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" aria-hidden="true" />
            <h2 className="text-base font-extrabold">طوارئ وخطوط إنقاذ حدائق الأهرام</h2>
          </div>
          <Pressable
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-muted)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
            aria-label="إغلاق نافذة الطوارئ"
          >
            <X className="w-4 h-4" />
          </Pressable>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Lifeline Filters */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[var(--ink-muted)]">خدمات عاجلة بالحدائق بنقرة واحدة:</p>
            <div className="grid grid-cols-2 gap-2">
              <Pressable
                onClick={() => {
                  onSelectCategory?.('صيدليات');
                  onClose();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-start transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[var(--ink)]">صيدليات 24 ساعة</p>
                  <p className="text-xs text-[var(--ink-muted)]">خدمة ليلية ودليفري</p>
                </div>
              </Pressable>

              <Pressable
                onClick={() => {
                  onSelectCategory?.('خدمات');
                  onClose();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-start transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[var(--ink)]">صيانة وأعطال</p>
                  <p className="text-xs text-[var(--ink-muted)]">سباك وكهربائي طوارئ</p>
                </div>
              </Pressable>
            </div>
          </div>

          {/* Official Hotlines */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-[var(--ink-muted)]">أرقام النجدة والخدمات الوطنية المباشرة:</p>
            <div className="space-y-1.5">
              {EMERGENCY_NUMBERS.map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-red-500/30 hover:bg-red-500/5 transition-all text-decoration-none group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink)] group-hover:text-red-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-extrabold text-xs">
                    <PhoneCall className="w-3 h-3" />
                    <span>{item.number}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--surface-elevated)] border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--ink-muted)]">
            حفظك الله ورعاك · دليل حدائق الأهرام في خدمة أهل الحي على مدار الساعة
          </p>
        </div>
      </div>
    </div>
  );
};
