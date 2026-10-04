import React from 'react';
import { Clock, Star, Video, Check } from 'lucide-react';

interface QuickTogglesSectionProps {
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { id: 'default', label: 'الأفضل مطابقة' },
  { id: 'nearest', label: 'الأقرب مسافة' },
  { id: 'newest', label: 'الأحدث تسجيلاً' },
  { id: 'open_now', label: 'المفتوح أولاً' },
];

export const QuickTogglesSection: React.FC<QuickTogglesSectionProps> = ({
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  sortBy,
  onSortChange,
}) => {
  return (
    <>
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>خيارات ومميزات</span>
        </h4>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 text-xs">مفتوح الآن لاستقبال العملاء</span>
            </div>
            <input
              type="checkbox"
              checked={openNowOnly}
              onChange={onToggleOpenNow}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="font-bold text-slate-800 text-xs">يحتوي على تقييمات معتمدة</span>
            </div>
            <input
              type="checkbox"
              checked={hasRatingOnly}
              onChange={onToggleHasRating}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-slate-800 text-xs">يحتوي على فيديو تعريفي</span>
            </div>
            <input
              type="checkbox"
              checked={hasVideoOnly}
              onChange={onToggleHasVideo}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <h4 className="font-black text-slate-900 text-xs">ترتيب النتائج</h4>
        <div className="grid grid-cols-2 gap-2">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSortChange(s.id)}
              className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                sortBy === s.id
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sortBy === s.id && <Check className="w-3 h-3" />}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
