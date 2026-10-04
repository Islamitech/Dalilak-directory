import React, { useId } from 'react';
import { Search, MapPin, LocateFixed } from 'lucide-react';
import { useDirectoryCatalog } from '../contracts/DirectoryCatalogProvider';
import type { DirectoryFilters, LocationState } from '../contracts/directory';
import { SearchField } from '../../shared/ui';

export function SearchForm({
  filters,
  onChange,
  onSubmit,
  location,
  onLocate,
}: {
  filters: DirectoryFilters;
  onChange: (patch: Partial<DirectoryFilters>) => void;
  onSubmit: () => void;
  location: LocationState;
  onLocate: () => void;
}) {
  const catalog = useDirectoryCatalog();
  const id = useId();

  return (
    <form
      role="search"
      className="directory-search-form flex flex-col md:flex-row items-stretch gap-3 bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex-1 min-w-0">
        <SearchField
          value={filters.query}
          onChange={(val) => onChange({ query: val })}
          onClear={() => onChange({ query: '' })}
          placeholder="مطعم، طبيب، خدمة… ماذا تحتاج؟"
          aria-label="اسم النشاط أو الخدمة"
          onSubmit={onSubmit}
        />
      </div>

      <label className="flex gap-2 items-center px-3">
        <MapPin size={19} />
        <span className="sr-only">المدينة</span>
        <select
          className="min-h-11 bg-transparent max-w-full"
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
        >
          <option value="all">كل المناطق</option>
          {catalog.cities.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="directory-button secondary"
        onClick={onLocate}
        disabled={location === 'loading'}
        aria-label="محاكاة البحث بالقرب مني"
      >
        <LocateFixed size={18} />
        {location === 'loading'
          ? 'جارٍ التحديد…'
          : location === 'allowed'
          ? 'موقعي محدد'
          : 'بالقرب مني'}
      </button>

      <button className="directory-button" type="submit">
        <Search size={18} />
        بحث
      </button>
    </form>
  );
}
