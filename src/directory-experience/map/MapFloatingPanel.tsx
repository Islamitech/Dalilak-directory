import React from 'react';
import { X, RotateCcw, ArrowLeft, Search } from 'lucide-react';
import { CategoryIcon as DiscCategoryIcon } from '../discovery/CategoryIcon';
import type { DirectoryPlace } from '../contracts/directory';

export interface MapFloatingPanelProps {
  panel: 'filters' | 'results';
  places: DirectoryPlace[];
  districts: readonly { id: string | number; nameAr: string }[];
  categories: readonly string[];
  area: string;
  category: string;
  showGates: boolean;
  showNames: boolean;
  selected: string | null;
  onClose: () => void;
  onChangeArea: (area: string) => void;
  onChangeCategory: (cat: string) => void;
  onToggleGates: (checked: boolean) => void;
  onToggleNames: (checked: boolean) => void;
  onReset: () => void;
  onSelectPlace: (id: string) => void;
}

export const MapFloatingPanel: React.FC<MapFloatingPanelProps> = ({
  panel,
  places,
  districts,
  categories,
  area,
  category,
  showGates,
  showNames,
  selected,
  onClose,
  onChangeArea,
  onChangeCategory,
  onToggleGates,
  onToggleNames,
  onReset,
  onSelectPlace,
}) => {
  return (
    <section
      className="hm-floating-panel"
      id="hm-floating-panel"
      aria-label={panel === 'filters' ? 'فلاتر الخريطة' : 'نتائج الخريطة'}
    >
      <div className="hm-panel-title">
        <h2>{panel === 'filters' ? 'خصص استكشافك' : `${places.length} نتيجة على الخريطة`}</h2>
        <button aria-label="إغلاق لوحة الخريطة" onClick={onClose}>
          <X size={19} />
        </button>
      </div>

      {panel === 'filters' ? (
        <>
          <div id="hadayek-map-filters" className="hm-floating-fields">
            <label>
              المنطقة
              <select value={area} onChange={(e) => onChangeArea(e.target.value)}>
                <option value="all">كل مناطق الحدائق</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.nameAr}>
                    {d.nameAr}
                  </option>
                ))}
              </select>
            </label>
            <label>
              نوع النشاط
              <select value={category} onChange={(e) => onChangeCategory(e.target.value)}>
                <option value="all">كل الأنشطة</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="hm-panel-layers">
            <label>
              <input
                type="checkbox"
                checked={showGates}
                onChange={(e) => onToggleGates(e.target.checked)}
              />
              إظهار البوابات
            </label>
            <label>
              <input
                type="checkbox"
                checked={showNames}
                onChange={(e) => onToggleNames(e.target.checked)}
              />
              أسماء المناطق
            </label>
          </div>
          <div className="hm-panel-actions">
            <button className="directory-button" onClick={onClose}>
              عرض {places.length} نتيجة
            </button>
            <button className="hm-reset" onClick={onReset}>
              <RotateCcw size={15} />إعادة ضبط
            </button>
          </div>
        </>
      ) : (
        <div className="hm-floating-results">
          {places.length ? (
            places.map((place) => (
              <button
                key={place.id}
                className="hm-result-item"
                onClick={() => onSelectPlace(place.id)}
                aria-pressed={selected === place.id}
              >
                <DiscCategoryIcon category={place.category} size={22} />
                <span className="hm-result-text">
                  <strong>{place.name}</strong>
                  <small>{place.category} · {place.area}</small>
                </span>
                <ArrowLeft size={16} />
              </button>
            ))
          ) : (
            <div className="hm-no-results">
              <Search size={28} />
              <h3>لا توجد نتائج بهذه الخيارات</h3>
              <p>جرّب اسمًا آخر أو وسّع نطاق البحث.</p>
              <button className="directory-button secondary" onClick={onReset}>
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
