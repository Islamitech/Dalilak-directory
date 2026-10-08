import { HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { escapeHtml } from './mapMarkerHtml';

export function renderGatesMarkers(gatesLayer: any, activeZone = ''): void {
  if (!gatesLayer || !window.L) return;
  gatesLayer.clearLayers();

  HADAYEK_OFFICIAL_GATES.forEach((gate) => {
    const servesZone = Boolean(activeZone && activeZone !== 'all' && gate.servedZones.includes(activeZone));
    const quiet = Boolean(activeZone && activeZone !== 'all' && !servesZone);
    const fill = quiet ? '#f8fafc' : '#f59e0b';
    const ink = quiet ? '#64748b' : '#0f172a';
    const label = escapeHtml(gate.popularNameAr || gate.shortNameAr);
    const gateHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:none;user-select:none;">
        <div style="background:${fill};color:${ink};width:18px;height:18px;border-radius:50%;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;font-family:Cairo,sans-serif;">${gate.number}</div>
        <div style="color:${ink};font-family:Cairo,sans-serif;font-weight:800;font-size:11px;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;white-space:nowrap;">${label}</div>
      </div>
    `;

    const gateIcon = window.L.divIcon({
      className: 'custom-gate-pin-native',
      html: gateHtml,
      iconSize: [96, 36],
      iconAnchor: [48, 9],
    });

    const gateMarker = window.L.marker([gate.lat, gate.lng], {
      icon: gateIcon,
      pane: 'pinsPane',
      interactive: false,
      keyboard: false,
      zIndexOffset: servesZone ? 420 : 380,
    });
    gatesLayer.addLayer(gateMarker);
  });
}
