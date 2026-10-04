import { HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { escapeHtml } from './mapMarkerHtml';

export function renderGatesMarkers(gatesLayer: any): void {
  if (!gatesLayer || !window.L) return;
  gatesLayer.clearLayers();

  HADAYEK_OFFICIAL_GATES.forEach((gate) => {
    const gateHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; user-select: none;">
        <div style="background: #4f46e5; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 1.5px 4px rgba(0,0,0,0.4); font-family: 'Arial', sans-serif;">${gate.number || '🚪'}</div>
        <div style="color: #312e81; font-family: 'Cairo', system-ui, sans-serif; font-weight: 800; font-size: 12px; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; letter-spacing: -0.2px;">${escapeHtml(gate.popularNameAr || gate.shortNameAr)}</div>
      </div>
    `;

    const gateIcon = window.L.divIcon({
      className: 'custom-gate-pin-native',
      html: gateHtml,
      iconSize: [100, 40],
      iconAnchor: [50, 10],
    });

    const gateMarker = window.L.marker([gate.lat, gate.lng], {
      icon: gateIcon,
      pane: 'pinsPane',
      zIndexOffset: 400,
    });
    gateMarker.bindPopup(`
      <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; text-align: right; min-width: 220px; padding: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <span style="background: #4f46e5; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">${gate.number || '🚪'}</span>
          <b style="color: #1e1b4b; font-size: 13px;">${escapeHtml(gate.nameAr)}</b>
        </div>
        <p style="margin: 4px 0; font-size: 11px; color: #475569; line-height: 1.4;"><b>🛣️ الطريق:</b> ${escapeHtml(gate.accessRoadAr)}</p>
        <p style="margin: 4px 0; font-size: 11px; color: #047857; line-height: 1.4;"><b>🎯 تخدم مناطق:</b> ${escapeHtml(gate.servedZones.join('، '))}</p>
        <div style="margin-top: 8px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #4f46e5; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-decoration: none;">
            <span>📍 الاتجاهات عبر Google Maps</span>
          </a>
        </div>
      </div>
    `);
    gatesLayer.addLayer(gateMarker);
  });
}
