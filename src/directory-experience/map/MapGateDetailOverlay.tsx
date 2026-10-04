import React from 'react';
import { DoorOpen, ArrowLeft } from 'lucide-react';

export interface MapGateDetailOverlayProps {
  gate: {
    id: string;
    name: string;
    road: string;
    areas: string;
  } | null;
  onBack: () => void;
  onDirections: () => void;
}

export const MapGateDetailOverlay: React.FC<MapGateDetailOverlayProps> = ({
  gate,
  onBack,
  onDirections,
}) => {
  if (!gate) return null;

  return (
    <section className="hm-gate-overlay" data-map-ui="true" onPointerDown={(e) => e.stopPropagation()}>
      <button className="hm-cards-back" onClick={onBack}>
        الرجوع للأنشطة<ArrowLeft size={16} />
      </button>
      <h2>
        <DoorOpen size={22} />
        {gate.name}
      </h2>
      <p>{gate.road}</p>
      <p>المناطق المرتبطة: {gate.areas}</p>
      <button type="button" onClick={onDirections} className="directory-button">
        الاتجاهات للبوابة
      </button>
    </section>
  );
};
