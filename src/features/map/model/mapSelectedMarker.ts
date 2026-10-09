import { Business } from '../../../types';
import {
  createExpandedActivityCardHtml,
  attachCardDomListeners,
} from '../badgeMarkers';

export function renderSelectedBusinessMarker(
  selectedLayer: any,
  selectedMarkerRef: { current: any },
  selectedBiz: Business | null,
  onSelectBusiness: (biz: Business) => void,
  onDeselect: () => void,
  onStartNavigation?: (biz: Business) => void
): void {
  if (!selectedLayer || !window.L) return;

  if (!selectedBiz) {
    if (selectedMarkerRef.current) {
      selectedLayer.clearLayers();
      selectedMarkerRef.current = null;
    }
    return;
  }

  const cardData = createExpandedActivityCardHtml(selectedBiz);

  const bizIcon = window.L.divIcon({
    className: 'custom-biz-pin selected-expanded-card animate-scale-in',
    html: cardData.html,
    iconSize: cardData.iconSize,
    iconAnchor: cardData.iconAnchor,
  });

  const handleDirections = onStartNavigation ? () => onStartNavigation(selectedBiz) : undefined;

  const handleCardClick = () => {
    onSelectBusiness(selectedBiz);
  };

  if (selectedMarkerRef.current && selectedLayer.hasLayer(selectedMarkerRef.current)) {
    selectedMarkerRef.current.setLatLng([selectedBiz.lat, selectedBiz.lng]);
    selectedMarkerRef.current.setIcon(bizIcon);
    selectedMarkerRef.current.off('click');
    selectedMarkerRef.current.on('click', handleCardClick);
    attachCardDomListeners(selectedMarkerRef.current, cardData.fallbackCover, onDeselect, handleDirections);
  } else {
    selectedLayer.clearLayers();
    const marker = window.L.marker([selectedBiz.lat, selectedBiz.lng], {
      icon: bizIcon,
      pane: 'selectedPinPane',
      zIndexOffset: 1200,
    });
    marker.on('click', handleCardClick);
    selectedLayer.addLayer(marker);
    attachCardDomListeners(marker, cardData.fallbackCover, onDeselect, handleDirections);
    selectedMarkerRef.current = marker;
  }
}
