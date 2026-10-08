/** All map zoom boundaries live here. Keep the established 15 / 15.5 behavior. */
export const MAP_ZOOM_POLICY = Object.freeze({
  citywideFilterBelow: 15.0,
  localPinPresentationFrom: 15.5,
  detailedActivityCardsFrom: 17.0,
  zoneCameraTransitionFrom: 15.0,
  businessSelectionOverviewThrough: 15.0,
});

export function isCitywideFilterZoom(zoom: number | undefined): boolean {
  return typeof zoom === 'number' && zoom < MAP_ZOOM_POLICY.citywideFilterBelow;
}

export function isLocalPinPresentationZoom(zoom: number): boolean {
  return zoom >= MAP_ZOOM_POLICY.localPinPresentationFrom;
}

export function isZoneCameraTransitionZoom(zoom: number | undefined): boolean {
  return typeof zoom === 'number' && zoom >= MAP_ZOOM_POLICY.zoneCameraTransitionFrom;
}

export function isBusinessSelectionOverviewZoom(zoom: number | undefined): boolean {
  return typeof zoom === 'number' && zoom <= MAP_ZOOM_POLICY.businessSelectionOverviewThrough;
}
