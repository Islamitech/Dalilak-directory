import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_GROUPS, EGYPT_GOVERNORATES, EGYPT_CITIES_BY_GOV } from '../../data/mockData';

export interface InteractiveOnboardingExperienceProps {
  onComplete: (selectedCategory: string, selectedGovernorate: string, selectedCity: string) => void;
  onSkip: () => void;
}

type Step = 0 | 1 | 2;

export const InteractiveOnboardingExperience: React.FC<InteractiveOnboardingExperienceProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<Step>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const finish = () => {
    try { localStorage.setItem('dalelak_onboarding_completed', 'true'); } catch {}
    onComplete(selectedCategory, selectedGovernorate, selectedCity);
  };

  const handleSkip = () => {
    try { localStorage.setItem('dalelak_onboarding_completed', 'true'); } catch {}
    onSkip();
  };

  const renderStep0 = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-black text-amber-800">على ماذا تبحث؟</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`p-3 rounded-xl border ${selectedCategory === 'all' ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-amber-50'}`}
          onClick={() => { setSelectedCategory('all'); setStep(1); }}
        >
          الكل — تصفح كل الأنشطة
        </button>
        {CATEGORY_GROUPS.map((group) => (
          <button
            key={group.group}
            className={`p-3 rounded-xl border ${selectedCategory === group.group ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-amber-50'}`}
            onClick={() => { setSelectedCategory(group.group); setStep(1); }}
          >
            {group.icon} {group.group}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-black text-amber-800">هل تفضل منطقة محددة؟</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          className={`px-3 py-1 rounded ${selectedGovernorate === 'all' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'}`}
          onClick={() => { setSelectedGovernorate('all'); setSelectedCity('all'); setStep(2); }}
        >
          كل المناطق
        </button>
        {EGYPT_GOVERNORATES.map((gov) => (
          <button
            key={gov}
            className={`px-3 py-1 rounded ${selectedGovernorate === gov ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'}`}
            onClick={() => { setSelectedGovernorate(gov); setSelectedCity('all'); setStep(2); }}
          >
            {gov}
          </button>
        ))}
      </div>
      {selectedGovernorate !== 'all' && (
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          <button
            className={`px-2 py-1 rounded ${selectedCity === 'all' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-800'}`}
            onClick={() => setSelectedCity('all')}
          >
            كل المدن
          </button>
          {EGYPT_CITIES_BY_GOV[selectedGovernorate]?.map((city) => (
            <button
              key={city}
              className={`px-2 py-1 rounded ${selectedCity === city ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-800'}`}
              onClick={() => setSelectedCity(city)}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-black text-amber-800">ابدأ الاستكشاف 🚀</h2>
      <button
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
        onClick={finish}
      >
        استكشاف الآن
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-white" style={{ direction: 'rtl' }}>
      <div className="p-6 bg-amber-50 rounded-xl max-w-lg w-full text-center relative">
        <button
          className="absolute top-2 left-2 text-slate-600 flex items-center"
          onClick={handleSkip}
        >
          تخطي <ArrowLeft size={12} />
        </button>
        {step > 0 && (
          <button
            className="absolute top-2 right-2 text-slate-600 flex items-center"
            onClick={() => setStep(step - 1 as Step)}
          >
            <ChevronLeft size={12} /> رجوع
          </button>
        )}
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-slate-500">
          خطوة {step + 1} من 3
        </div>
      </div>
    </div>
  );
};
