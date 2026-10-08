import React from 'react';
import { ShieldCheck, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { Button, PageFrame } from '../../shared/ui';

export interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <PageFrame
      title="عن دليلك"
      subtitle="دليل حدائق الأهرام للأنشطة والخدمات: موقع دقيق، ورقم تواصل مباشر، وبوابة المنطقة من الخريطة نفسها."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-900">بيانات موثقة</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            يُراجع الموقع ورقم الهاتف وساعات العمل قبل ظهور النشاط في الدليل.
          </p>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <MapPin className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-900">اتجاهات للمنطقة</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            الخريطة تعرض بوابة المنطقة ورقم العمارة، وزر الاتجاهات يفتح المسار.
          </p>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <Phone className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-900">تواصل مباشر</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            الاتصال وواتساب يصلان إلى النشاط مباشرة، بلا وسيط على الطلب.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium leading-relaxed text-slate-600">
          التغطية الحالية هي حدائق الأهرام: المناطق، والبوابات، والأنشطة الموثقة على الخريطة والقائمة.
        </p>
        <Button variant="primary" size="md" onClick={() => onNavigate('/search')} icon={<ArrowLeft className="h-4 w-4" />}>
          استكشف الدليل
        </Button>
      </div>
    </PageFrame>
  );
};
