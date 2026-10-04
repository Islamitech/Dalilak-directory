import React from 'react';
import { FlaskConical } from 'lucide-react';
import { MOCK_PRESETS } from '../../../data/mockData';
import { HADAYEK_ZONES } from '../../../data/hadayekAtlasData';

interface MapSandboxHeaderProps {
  onNavigate?: (path: string) => void;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  activeBuildingNumber: string;
  setActiveBuildingNumber: (num: string) => void;
  activeZoneLetter: string;
  setActiveZoneLetter: (letter: string) => void;
}

export const MapSandboxHeader: React.FC<MapSandboxHeaderProps> = ({
  onNavigate,
  selectedPresetId,
  setSelectedPresetId,
  activeBuildingNumber,
  setActiveBuildingNumber,
  activeZoneLetter,
  setActiveZoneLetter,
}) => {
  return (
    <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-inner">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white">
                بيئة العمل المعزولة للخريطة (Map Temp Sandbox)
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مجلد معزول: src/components/map_temp
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              هذه البيئة تعمل بنواة مستقلة 100% مع بيانات تجريبية وهمية (Mock Data) دون أي مساس بالمجلد الأصلي أو بقاعدة البيانات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              العودة للرئيسية ↩
            </button>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            📦 باقة البيانات الوهمية (Mock Presets):
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            {MOCK_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            🏢 محاكاة رقم العمارة:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="مثال: 142"
              value={activeBuildingNumber}
              onChange={(e) => setActiveBuildingNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
            />
            {activeBuildingNumber && (
              <button
                type="button"
                onClick={() => setActiveBuildingNumber('')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            🎯 محاكاة اختيار المنطقة (Zone):
          </label>
          <select
            value={activeZoneLetter}
            onChange={(e) => setActiveZoneLetter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            {HADAYEK_ZONES.map((z) => (
              <option key={z.id} value={z.letterAr}>
                منطقة {z.letterAr} - {z.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
