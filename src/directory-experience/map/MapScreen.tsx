import React, { useMemo, useState } from 'react';
import { MapPin, DoorOpen, ArrowLeft, SlidersHorizontal, List, Info, X, Search } from 'lucide-react';
import { CategoryIcon } from '../discovery/CategoryIcon';
import { DiscoveryProps } from '../discovery/HomeScreen';
import { useDirectoryCatalog } from '../contracts/DirectoryCatalogProvider';
import { ScreenState } from '../design-system/ScreenState';
import { GeographicCanvas } from './GeographicCanvas';
import { MapActivityCards } from './MapActivityCards';
import { MapFloatingPanel } from './MapFloatingPanel';
import { MapScreenDialogs } from './MapScreenDialogs';
import { MapGateDetailOverlay } from './MapGateDetailOverlay';
import { SearchField } from '../../shared/ui';
import type { ActionKind, DirectoryPlace } from '../contracts/directory';
import './map.css';

export function MapScreen(p: DiscoveryProps) {
  const catalog = useDirectoryCatalog();
  const [area, setArea] = useState('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [panel, setPanel] = useState<'filters' | 'results' | null>(null);
  const [gatesOpen, setGatesOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showGates, setShowGates] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const places = useMemo(() =>
    catalog.places.filter(place =>
      place.coordinates &&
      place.city === 'حدائق الأهرام' &&
      (area === 'all' || place.area === area) &&
      (category === 'all' || place.category === category) &&
      (!query.trim() || `${place.name} ${place.address} ${place.category}`.includes(query.trim()))
    ), [catalog.places, area, category, query]);

  const chosen = places.find(place => place.id === selected);
  const gate = catalog.gates.find(item => item.id === selectedGate);
  const activeCount = Number(area !== 'all') + Number(category !== 'all') + Number(!!query.trim());

  const clearSelection = () => { setSelected(null); setSelectedGate(null); };
  const changeArea = (value: string) => { setArea(value); clearSelection(); setCardsOpen(true); };
  const reset = () => { setArea('all'); setCategory('all'); setQuery(''); clearSelection(); setResetKey(k => k + 1); };

  const selectPlace = (id: string) => { setSelected(id); setSelectedGate(null); setPanel(null); setCardsOpen(true); };
  const selectGate = (id: string) => { setSelectedGate(id); setSelected(null); setShowGates(true); setPanel(null); setCardsOpen(false); };

  /**
   * Bridge from map cards to the parent onAction.
   * MapActivityCards now passes the relevant DirectoryPlace so the correct
   * dialog (call, WhatsApp, directions, …) opens with real data.
   */
  const handleCardAction = (kind: ActionKind, place: DirectoryPlace) => {
    p.onAction(kind, place);
  };

  return (
    <div className="hm-full-page">
      <h1 className="sr-only">خريطة حدائق الأهرام — اكتشف الأماكن والأنشطة</h1>
      <ScreenState state={p.state} onReset={p.onReset}>
        <GeographicCanvas
          districts={catalog.districts}
          gates={catalog.gates}
          places={places}
          area={area}
          selected={selected}
          selectedGate={selectedGate}
          showGates={showGates}
          showNames={showNames}
          resetKey={resetKey}
          onArea={changeArea}
          onPlace={selectPlace}
          onGate={selectGate}
          contextKey={`${area}|${category}|${query}`}
          cardsOpen={cardsOpen || !!gate}
        >
          {/* ── Floating search + quick categories ── */}
          <div className="hm-floating-tools" data-map-ui="true" onPointerDown={e => e.stopPropagation()}>
            <form
              className="hm-map-search"
              role="search"
              onSubmit={e => {
                e.preventDefault();
                if (places.length === 1) {
                  /* Only one result — go straight to it */
                  selectPlace(places[0].id);
                } else if (places.length > 1) {
                  /* Multiple results — open results panel so the user can choose */
                  setPanel('results');
                }
                /* Zero results — the "no results" UI inside the panel handles it */
                else {
                  setPanel('results');
                }
              }}
            >
              <MapPin size={22} />
              <SearchField
                value={query}
                onChange={(val) => {
                  setQuery(val);
                  clearSelection();
                  setPanel(val ? 'results' : null);
                }}
                onClear={() => {
                  setQuery('');
                  clearSelection();
                  setPanel(null);
                }}
                placeholder={area === 'all' ? 'ابحث في حدائق الأهرام…' : `ابحث في ${area}…`}
                aria-label="البحث في أنشطة الخريطة"
                className="flex-1"
                inputClassName="!h-10 !bg-transparent !border-none !text-sm !font-bold focus:!ring-0"
              />
              <button type="submit" aria-label="عرض نتائج البحث على الخريطة">
                <Search size={21} />
              </button>
            </form>

            <div className="hm-quick-categories" role="toolbar" aria-label="تصنيفات سريعة">
              {catalog.categories.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`hm-category-chip ${category === cat ? 'is-active' : ''}`}
                  onClick={() => { setCategory(prev => prev === cat ? 'all' : cat); clearSelection(); }}
                  aria-pressed={category === cat}
                >
                  <CategoryIcon category={cat} size={14} />
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* ── Filter / results / gates buttons ── */}
            <div className="hm-floating-buttons">
              <button
                aria-expanded={panel === 'filters'}
                aria-controls="hm-floating-panel"
                onClick={() => setPanel(panel === 'filters' ? null : 'filters')}
              >
                <SlidersHorizontal size={18} />
                {area === 'all' ? 'المناطق والفلاتر' : area}
                {activeCount > 0 && <span className="hm-count">{activeCount}</span>}
              </button>
              <button onClick={() => setGatesOpen(true)}>
                <DoorOpen size={18} />البوابات
              </button>
              <button
                aria-expanded={panel === 'results'}
                aria-controls="hm-floating-panel"
                onClick={() => setPanel(panel === 'results' ? null : 'results')}
              >
                <List size={18} />النتائج <span className="hm-count">{places.length}</span>
              </button>
            </div>

            {/* ── Floating panel (filters or results) ── */}
            {panel && (
              <MapFloatingPanel
                panel={panel}
                places={places}
                districts={catalog.districts}
                categories={catalog.categories}
                area={area}
                category={category}
                showGates={showGates}
                showNames={showNames}
                selected={selected}
                onClose={() => setPanel(null)}
                onChangeArea={changeArea}
                onChangeCategory={(cat) => {
                  setCategory(cat);
                  clearSelection();
                }}
                onToggleGates={(checked) => {
                  setShowGates(checked);
                  if (!checked) setSelectedGate(null);
                }}
                onToggleNames={setShowNames}
                onReset={reset}
                onSelectPlace={(id) => {
                  selectPlace(id);
                  setPanel(null);
                }}
              />
            )}
          </div>

          {/* ── Activity cards overlay ── */}
          {!gate && (
            <MapActivityCards
              places={places.slice(0, 3)}
              selected={chosen}
              area={area}
              searching={!!query.trim()}
              saved={p.saved}
              onSelect={selectPlace}
              onBack={clearSelection}
              onDetails={p.onOpen}
              onSave={p.onSave}
              open={cardsOpen}
              onToggle={() => setCardsOpen(!cardsOpen)}
              onAction={handleCardAction}
            />
          )}

          {/* ── Gate detail overlay ── */}
          <MapGateDetailOverlay
            gate={gate ?? null}
            onBack={() => {
              clearSelection();
              setCardsOpen(true);
            }}
            onDirections={() => p.onAction('directions')}
          />

          <button
            className="hm-map-info"
            data-map-ui="true"
            aria-label="معلومات الخريطة ومصدر البيانات"
            onClick={() => setInfoOpen(true)}
          >
            <Info size={17} />
          </button>
        </GeographicCanvas>
      </ScreenState>

      <MapScreenDialogs
        gatesOpen={gatesOpen}
        infoOpen={infoOpen}
        gates={catalog.gates}
        onCloseGates={() => setGatesOpen(false)}
        onCloseInfo={() => setInfoOpen(false)}
        onSelectGate={(id) => { setArea('all'); selectGate(id); setGatesOpen(false); }}
      />
    </div>
  );
};
