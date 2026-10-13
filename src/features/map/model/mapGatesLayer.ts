import { HADAYEK_OFFICIAL_GATES } from '../../../shared/data/hadayek/hadayekDistrictsGeoData';
import { escapeHtml } from './mapMarkerHtml';

export function renderGatesMarkers(
  gatesLayer: any,
  activeZone = '',
  onSelectZone?: (letter: string) => void,
  onSelectGate?: (gate: (typeof HADAYEK_OFFICIAL_GATES)[0]) => void
): void {
  if (!gatesLayer || !window.L) return;
  gatesLayer.clearLayers();

  HADAYEK_OFFICIAL_GATES.forEach((gate) => {
    const servesZone = Boolean(activeZone && activeZone !== 'all' && gate.servedZones.includes(activeZone));
    const quiet = Boolean(activeZone && activeZone !== 'all' && !servesZone);
    const fill = quiet ? '#f8fafc' : '#f59e0b';
    const ink = quiet ? '#64748b' : '#0f172a';
    const label = escapeHtml(gate.popularNameAr || gate.shortNameAr);
    const gateHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:auto;cursor:pointer;user-select:none;" title="${escapeHtml(gate.nameAr)}">
        <div style="background:${fill};color:${ink};width:20px;height:20px;border-radius:50%;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;font-family:Cairo,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.15);">${gate.number}</div>
        <div style="color:${ink};font-family:Cairo,sans-serif;font-weight:800;font-size:11px;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;white-space:nowrap;">${label}</div>
      </div>
    `;

    const gateIcon = window.L.divIcon({
      className: 'custom-gate-pin-native',
      html: gateHtml,
      iconSize: [96, 38],
      iconAnchor: [48, 10],
    });

    const gateMarker = window.L.marker([gate.lat, gate.lng], {
      icon: gateIcon,
      pane: 'pinsPane',
      interactive: true,
      keyboard: false,
      zIndexOffset: servesZone ? 420 : 380,
    });

    const zonePillsHtml = gate.servedZones
      .map(
        (z) =>
          `<button type="button" data-zone="${z}" style="background:#f8fafc;color:#0f172a;border:1px solid #cbd5e1;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">منطقة ${z}</button>`
      )
      .join('');

    const popupHtml = `
      <div dir="rtl" class="dl-gate-popup" style="padding:6px;min-width:180px;font-family:Cairo,sans-serif;font-size:12px;color:#0f172a;text-align:right;">
        <div style="font-weight:800;font-size:13px;color:#b45309;display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span>🚪</span> <span>${escapeHtml(gate.nameAr)}</span>
        </div>
        ${
          gate.accessRoadAr
            ? `<div style="font-size:11px;color:#64748b;margin-bottom:6px;line-height:1.4;">${escapeHtml(gate.accessRoadAr)}</div>`
            : ''
        }
        <div style="font-weight:700;font-size:11px;color:#334155;margin-bottom:4px;">المناطق المخدومة (انقر للتصفح):</div>
        <div class="dl-gate-zones" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">
          ${zonePillsHtml}
        </div>
      </div>
    `;

    gateMarker.bindPopup(popupHtml, { maxWidth: 260 });
    gateMarker.on('popupopen', (e: any) => {
      const popupEl =
        e?.popup?.getElement?.() ||
        (typeof document !== 'undefined' ? document.querySelector('.dl-gate-popup') : null);
      if (popupEl && typeof popupEl.querySelectorAll === 'function') {
        popupEl.querySelectorAll('[data-zone]').forEach((btn: any) => {
          btn.onclick = (evt: Event) => {
            evt?.stopPropagation?.();
            const z = btn.getAttribute('data-zone');
            gateMarker.closePopup();
            if (z) onSelectZone?.(z);
          };
        });
      }
    });

    gateMarker.on('click', () => {
      onSelectGate?.(gate);
    });

    gatesLayer.addLayer(gateMarker);
  });
}
