import React from 'react';
import { HADAYEK_GATES, HadayekGate } from '../../data/hadayekAtlasData';
import { Modal, IconButton, Button } from '../../shared/ui';
import {
  Compass,
  Clock,
  Car,
} from 'lucide-react';

export interface HadayekGatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone?: (zoneLetter: string) => void;
}

export const HadayekGatesModal: React.FC<HadayekGatesModalProps> = ({
  isOpen,
  onClose,
  onSelectZone,
}) => {
  const handleOpenGateMaps = (gate: HadayekGate) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}&query=${encodeURIComponent(
      gate.nameAr + ' ' + gate.popularNameAr + ' حدائق الأهرام'
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      hideDefaultHeader
      aria-label="دليل بوابات حدائق الأهرام ومسارات الدخول"
      className="!bg-[var(--bg-card)] !border-amber-500/30 overflow-hidden"
      contentClassName="p-0 flex flex-col max-h-[90vh]"
    >
      {/* Modal Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
              دليل بوابات حدائق الأهرام ومسارات الدخول
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              تعرف على البوابة المناسبة لعماراتك وأسهل مسار للوصول وتفادي الزحام
            </p>
          </div>
        </div>

        <IconButton
          aria-label="إغلاق النافذة"
          onClick={onClose}
          size="sm"
          variant="ghost"
          className="!w-9 !h-9 !rounded-md !bg-slate-100 !text-slate-600 hover:!bg-slate-200"
          icon={<span className="text-sm font-extrabold">✕</span>}
        />
      </div>

      {/* Modal Body: The 4 Gates Cards */}
      <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {HADAYEK_GATES.map((gate) => (
            <div
              key={gate.id}
              className="bg-slate-50 border border-[var(--border-color)] hover:border-amber-500/50 rounded-lg p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-700 text-xs font-extrabold flex items-center justify-center">
                      🚪
                    </span>
                    <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                      {gate.nameAr} ({gate.popularNameAr})
                    </h3>
                  </div>
                  <span className="text-caption font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-pill flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    24 ساعة
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                  {gate.descriptionAr}
                </p>

                <div className="space-y-1.5 text-caption bg-white p-3 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <span>🚗 طريق المدخل:</span>
                    <span className="text-[var(--text-primary)]">{gate.accessRoadAr}</span>
                  </div>
                  <div className="flex items-start gap-1.5 font-medium text-[var(--text-secondary)]">
                    <span className="font-bold text-slate-600 shrink-0">
                      📍 تخدم مناطق:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {gate.servedZones.map((z) => (
                        <span
                          key={z}
                          onClick={() => {
                            if (onSelectZone) {
                              onSelectZone(z);
                              onClose();
                            }
                          }}
                          className="text-caption font-extrabold bg-amber-500/15 text-amber-700 px-1.5 py-0.5 rounded-pill cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition-colors"
                          title="اختر هذه المنطقة في الأطلس"
                        >
                          منطقة {z}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-caption text-slate-500 leading-normal pt-1 border-t border-slate-100">
                    💡 {gate.tipsAr}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => handleOpenGateMaps(gate)}
                  leadingIcon={<Car />}
                >
                  ملاحة بالسيارة لهذه البوابة
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-50 border-t border-[var(--border-color)] flex items-center justify-between text-xs shrink-0">
        <span className="text-caption text-[var(--text-secondary)]">
          💡 نصيحة دليلك: ادخل دائماً من أقرب بوابة لعمارة وجهتك لتفادي التباطؤ داخل شوارع الحدائق.
        </span>
        <Button variant="secondary" size="sm" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </Modal>
  );
};
