import React from 'react';
import { DoorOpen, ArrowLeft } from 'lucide-react';
import { Dialog } from '../design-system/Dialog';
import type { DirectoryCatalog } from '../contracts/directory';

export interface MapScreenDialogsProps {
  gatesOpen: boolean;
  infoOpen: boolean;
  gates: DirectoryCatalog['gates'];
  onCloseGates: () => void;
  onCloseInfo: () => void;
  onSelectGate: (id: string) => void;
}

export const MapScreenDialogs: React.FC<MapScreenDialogsProps> = ({
  gatesOpen,
  infoOpen,
  gates,
  onCloseGates,
  onCloseInfo,
  onSelectGate,
}) => {
  return (
    <>
      {gatesOpen && (
        <Dialog title="بوابات حدائق الأهرام" onClose={onCloseGates}>
          <p className="directory-form-help">اختر بوابة لتقريب الخريطة وإظهار معلوماتها.</p>
          <div className="hm-gates-grid">
            {gates.map((item) => (
              <article className="hm-gate-card" key={item.id}>
                <DoorOpen size={25} />
                <h3>{item.name}</h3>
                <p>{item.road}</p>
                <small>المناطق: {item.areas}</small>
                <button
                  className="directory-button secondary"
                  onClick={() => onSelectGate(item.id)}
                >
                  عرض على الخريطة<ArrowLeft size={16} />
                </button>
              </article>
            ))}
          </div>
        </Dialog>
      )}

      {infoOpen && (
        <Dialog title="عن هذه الخريطة" onClose={onCloseInfo}>
          <p>١٦ منطقة و٦ بوابات من بيانات المشروع المحلية. الحدود إرشادية وليست مساحية معتمدة. أسماء الأنشطة ومواقعها بيانات عرض افتراضية.</p>
          <p className="mt-4">اسحب للتحريك، واستخدم أزرار التكبير أو Ctrl مع عجلة الفأرة، أو إصبعين على الهاتف. لوحة المفاتيح: الأسهم و+ و− وHome.</p>
          <p className="mt-4">أبرز الأنشطة مرتبة في بيانات العرض، وليست توصيات أو ترتيبًا تجاريًا حقيقيًا. ربط أرقام العمارات الدقيقة متروك لمصدر بيانات معتمد عند الدمج.</p>
        </Dialog>
      )}
    </>
  );
};
