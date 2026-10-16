import { Business } from '../../../types';
import {
  createCompactActivityPinHtml,
} from '../badgeMarkers';

export function renderSelectedBusinessMarker(
  selectedLayer: any,
  selectedMarkerRef: { current: any },
  selectedBiz: Business | null,
  onSelectBusiness: (biz: Business) => void,
  _onDeselect: () => void,
  _onStartNavigation?: (biz: Business) => void
): void {
  if (!selectedLayer || !window.L) return;

  if (!selectedBiz) {
    if (selectedMarkerRef.current) {
      selectedLayer.clearLayers();
      selectedMarkerRef.current = null;
    }
    return;
  }

  // Phase 4: Replace bloated 256x300px HTML popup card with high-performance sleek glowing pin,
  // while the native spring bottom sheet opens immediately in Peek mode (~110px).
  const pinData = createCompactActivityPinHtml(selectedBiz, true, false, undefined, [0, 0], true);

  const bizIcon = window.L.divIcon({
    className: 'custom-biz-pin selected-glowing-pin selected-compact-card animate-scale-in',
    html: pinData.html,
    iconSize: pinData.iconSize,
    iconAnchor: pinData.iconAnchor,
  });

  const handlePinClick = () => {
    onSelectBusiness(selectedBiz);
  };

  if (selectedMarkerRef.current && selectedLayer.hasLayer(selectedMarkerRef.current)) {
    if (selectedMarkerRef.current.__bizId !== selectedBiz.id) {
      selectedMarkerRef.current.__bizId = selectedBiz.id;
      selectedMarkerRef.current.setLatLng([selectedBiz.lat, selectedBiz.lng]);
      selectedMarkerRef.current.setIcon(bizIcon);
      selectedMarkerRef.current.off('click');
      selectedMarkerRef.current.on('click', handlePinClick);
    }
  } else {
    selectedLayer.clearLayers();
    const marker = window.L.marker([selectedBiz.lat, selectedBiz.lng], {
      icon: bizIcon,
      pane: 'selectedPinPane',
      zIndexOffset: 1200,
    });
    marker.__bizId = selectedBiz.id;
    marker.on('click', handlePinClick);
    selectedLayer.addLayer(marker);
    selectedMarkerRef.current = marker;
  }
}
