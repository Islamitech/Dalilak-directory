export interface MapLayerGroups {
  districtsLayerGroup: any;
  cardsLayerGroup: any;
  clusterLayerGroup: any;
  selectedLayerGroup: any;
  gatesLayerGroup: any;
  targetLayerGroup: any;
  routeLayerGroup: any;
}

export function initializeMapPanesAndLayers(map: any): MapLayerGroups | null {
  if (!map || !window.L) return null;

  if (!map.getPane('maskPane')) {
    const maskPane = map.createPane('maskPane');
    maskPane.style.zIndex = '350';
    maskPane.style.pointerEvents = 'none';
  }
  if (!map.getPane('districtsPane')) {
    const districtsPane = map.createPane('districtsPane');
    districtsPane.style.zIndex = '360';
  }
  if (!map.getPane('districtLabelsPane')) {
    const districtLabelsPane = map.createPane('districtLabelsPane');
    districtLabelsPane.style.zIndex = '460';
  }
  if (!map.getPane('pinsPane')) {
    const pinsPane = map.createPane('pinsPane');
    pinsPane.style.zIndex = '600';
  }
  if (!map.getPane('selectedPinPane')) {
    const selectedPinPane = map.createPane('selectedPinPane');
    selectedPinPane.style.zIndex = '700';
  }

  const districtsLayerGroup = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
  const cardsLayerGroup = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
  const clusterLayerGroup = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
  const selectedLayerGroup = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
  const gatesLayerGroup = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
  const targetLayerGroup = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
  const routeLayerGroup = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);

  return {
    districtsLayerGroup,
    cardsLayerGroup,
    clusterLayerGroup,
    selectedLayerGroup,
    gatesLayerGroup,
    targetLayerGroup,
    routeLayerGroup,
  };
}
