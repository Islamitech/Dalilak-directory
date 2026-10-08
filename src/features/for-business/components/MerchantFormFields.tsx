import React from 'react';
import { EGYPT_GOVERNORATES } from '../../../shared/data/geography';
import { CATEGORY_TAXONOMY, getCategoryGroupById } from '../../../data/categoryTaxonomy';
import { AlertCircle } from 'lucide-react';

interface MerchantFormFieldsProps {
  bizName: string;
  setBizName: (val: string) => void;
  ownerName: string;
  setOwnerName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  phoneError: string;
  gov: string;
  setGov: (val: string) => void;
  mainCategoryId: string;
  setMainCategoryId: (val: string) => void;
  subcategoryId: string;
  setSubcategoryId: (val: string) => void;
}

export const MerchantFormFields: React.FC<MerchantFormFieldsProps> = ({
  bizName,
  setBizName,
  ownerName,
  setOwnerName,
  phone,
  setPhone,
  phoneError,
  gov,
  setGov,
  mainCategoryId,
  setMainCategoryId,
  subcategoryId,
  setSubcategoryId,
}) => {
  const selectedCategoryGroup = getCategoryGroupById(mainCategoryId);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 block">اسم المحل أو النشاط التجاري *</label>
        <input
          type="text"
          required
          aria-label="اسم النشاط التجاري"
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          placeholder="مثال: صيدلية الأهرام، مطعم الحبايب..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 block">اسم صاحب النشاط أو المسؤول</label>
        <input
          type="text"
          aria-label="اسم صاحب النشاط"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="الاسم الكريم..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 block">رقم الهاتف أو الواتساب للتواصل *</label>
        <input
          type="tel"
          required
          aria-label="رقم الهاتف"
          aria-invalid={!!phoneError}
          aria-describedby={phoneError ? 'phone-error-msg' : undefined}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className={`w-full bg-white border rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none ${
            phoneError ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20' : 'border-slate-200 focus:border-amber-500'
          }`}
        />
        {phoneError && (
          <p id="phone-error-msg" role="alert" className="text-caption font-bold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{phoneError}</span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 block">المحافظة</label>
        <select
          aria-label="المحافظة"
          value={gov}
          onChange={(e) => setGov(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-700 block">الفئة الرئيسية للنشاط</label>
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
        <label className="text-xs font-extrabold text-slate-700 block">نوع النشاط أو الخدمة بالتحديد</label>
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
  );
};
