import React from 'react';
import { Compass, MapPin, ArrowLeft, Search, LocateFixed } from 'lucide-react';
import { SearchField } from '../../../shared/ui';

interface SearchHeroHeaderProps {
  categoryFilter: string;
  selectedZone: string;
  selectedCity: string;
  selectedGov: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLocationSelect: (val: string) => void;
  onRequestLocation: () => void;
  isLocatingUser: boolean;
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
  onSearchSubmit: () => void;
}

export const SearchHeroHeader: React.FC<SearchHeroHeaderProps> = ({
  categoryFilter,
  selectedZone,
  selectedCity,
  selectedGov,
  searchQuery,
  onSearchChange,
  onLocationSelect,
  onRequestLocation,
  isLocatingUser,
  userCoords,
  onNavigate,
  onSearchSubmit,
}) => {
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black w-max shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
            <span>دليلك للأماكن والخدمات</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.25]">
            {categoryFilter && categoryFilter !== 'all' ? `دليل ${categoryFilter}` : 'دليل المحلات والأنشطة والخدمات'}،
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600">
              {selectedZone && selectedZone !== 'all'
                ? `في حدائق الأهرام — منطقة (${selectedZone})`
                : selectedCity && selectedCity !== 'all'
                ? `المعتمدة في ${selectedCity}`
                : selectedGov && selectedGov !== 'all'
                ? `المعتمدة في ${selectedGov}`
                : 'المعتمدة في حدائق الأهرام ومصر'}.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
            من قهوتك الصباحية إلى خدمة تحتاجها اليوم. اكتشف منطقتك، قارن اختياراتك، ووصل إلى المكان المناسب.
          </p>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl sm:rounded-3xl bg-white border-2 border-amber-200/90 text-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group min-h-[170px] sm:min-h-[200px]">
            <div className="space-y-2 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-2xs">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                كل شارع، <span className="text-amber-600">فيه اكتشاف جديد.</span>
              </h2>

              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs">
                استكشف مناطق حدائق الأهرام، واعرف البوابات والخدمات المحيطة.
              </p>
            </div>

            <div className="pt-3 relative z-10">
              <button
                type="button"
                onClick={() => onNavigate('/map')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 group/btn"
              >
                <span>افتح الخريطة</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2.5 transition-all"
        >
          <div className="flex-1 min-w-0 bg-white">
            <SearchField
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="مطعم، طبيب، خدمة… ماذا تحتاج؟"
              aria-label="البحث في الدليل"
              onClear={() => onSearchChange('')}
              onSubmit={onSearchSubmit}
            />
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 border-b md:border-b-0 md:border-inline-end border-slate-100 shrink-0 bg-white">
            <select
              value={selectedCity !== 'all' ? selectedCity : selectedGov !== 'all' ? selectedGov : 'all'}
              onChange={(e) => onLocationSelect(e.target.value)}
              aria-label="تحديد النطاق الجغرافي أو المدينة"
              className="bg-white text-sm font-bold text-slate-800 cursor-pointer min-h-10 py-1 outline-none w-full"
              style={{ colorScheme: 'light' }}
            >
              <option value="حدائق الأهرام" className="bg-white text-slate-900 font-bold">حدائق الأهرام (الافتراضي)</option>
              <option value="all" className="bg-white text-slate-900 font-bold">كل المناطق والمحافظات</option>
              <option value="الجيزة" className="bg-white text-slate-900 font-bold">محافظة الجيزة (الكل)</option>
              <option value="مدينة 6 أكتوبر" className="bg-white text-slate-900 font-bold">مدينة 6 أكتوبر</option>
              <option value="مدينة الشيخ زايد" className="bg-white text-slate-900 font-bold">مدينة الشيخ زايد</option>
              <option value="الهرم" className="bg-white text-slate-900 font-bold">شارع الهرم</option>
              <option value="فيصل" className="bg-white text-slate-900 font-bold">شارع فيصل</option>
              <option value="الدقي" className="bg-white text-slate-900 font-bold">الدقي والمهندسين</option>
              <option value="القاهرة" className="bg-white text-slate-900 font-bold">محافظة القاهرة</option>
              <option value="الإسكندرية" className="bg-white text-slate-900 font-bold">محافظة الإسكندرية</option>
            </select>
            <MapPin className="w-5 h-5 text-slate-600 shrink-0" />
          </div>

          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocatingUser}
            className="w-full md:w-auto h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap active:scale-98 shadow-2xs"
          >
            <LocateFixed
              className={`w-4 h-4 ${
                isLocatingUser
                  ? 'animate-spin text-amber-500'
                  : userCoords
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            />
            <span>
              {isLocatingUser ? 'جارٍ التحديد…' : userCoords ? 'موقعي محدد' : 'بالقرب مني'}
            </span>
          </button>

          <button
            type="submit"
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 shrink-0"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>بحث</span>
          </button>
        </form>
      </div>
    </section>
  );
};
