export type CameraPriority = 'initial' | 'zone' | 'cluster' | 'building' | 'route' | 'locate' | 'selection' | 'user';

export type CameraCommand =
  | { kind: 'flyTo'; center: [number, number]; zoom: number; options?: Record<string, unknown> }
  | { kind: 'flyToBounds'; bounds: unknown; options?: Record<string, unknown> }
  | { kind: 'fitBounds'; bounds: unknown; options?: Record<string, unknown> }
  | { kind: 'panTo'; center: [number, number]; options?: Record<string, unknown> }
  | { kind: 'panBy'; offset: [number, number]; options?: Record<string, unknown> }
  | { kind: 'zoom'; delta: number };

const PRIORITY: Record<CameraPriority, number> = {
  initial: 0,
  zone: 1,
  cluster: 2,
  building: 3,
  route: 3,
  locate: 3,
  selection: 4,
  user: 5,
};

const MIN_FLIGHT_SECONDS = 0.9;
const MAX_FLIGHT_SECONDS = 2.4;

/**
 * Flight time that scales with how far and how much the camera has to travel, so short hops stay
 * calm and long jumps never feel like a cut. Callers can ask for longer, never for abrupt.
 */
function adaptiveFlightSeconds(map: any, target: { lat: number; lng: number } | null, targetZoom: number | null, requested?: number): number {
  let seconds = MIN_FLIGHT_SECONDS;
  try {
    const size = map.getSize();
    const diag = Math.hypot(size.x, size.y) || 1;
    const zoom = map.getZoom();
    const toZoom = typeof targetZoom === 'number' && Number.isFinite(targetZoom) ? targetZoom : zoom;
    let travel = 0;
    if (target) {
      const a = map.project(map.getCenter(), toZoom);
      const b = map.project(target, toZoom);
      travel = Math.hypot(a.x - b.x, a.y - b.y) / diag; // in screen diagonals at the destination zoom
    }
    seconds += 0.3 * Math.abs(toZoom - zoom) + 0.22 * Math.min(travel, 5);
  } catch {}
  const wanted = typeof requested === 'number' && Number.isFinite(requested) ? requested : 0;
  return Math.min(MAX_FLIGHT_SECONDS, Math.max(seconds, wanted, MIN_FLIGHT_SECONDS));
}

/** Sole owner of Leaflet camera mutations. New higher-priority requests preempt old flights. */
export class CameraController {
  private map: any;
  private active: { id: number; priority: CameraPriority } | null = null;
  private activeTimer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 0;
  private container: HTMLElement | null = null;
  private cancelForGesture = () => this.cancelPending();

  constructor(map: any) {
    this.map = map;
    this.container = map?.getContainer?.() || null;
    this.container?.addEventListener('pointerdown', this.cancelForGesture, true);
    this.container?.addEventListener('wheel', this.cancelForGesture, { capture: true, passive: true });
    this.map?.on?.('dragstart', this.cancelForGesture);
  }

  request(command: CameraCommand, priority: CameraPriority): boolean {
    if (!this.map) return false;
    if (this.active && PRIORITY[this.active.priority] > PRIORITY[priority]) return false;
    if (this.active) {
      const prior = this.active;
      this.active = null;
      if (this.activeTimer) clearTimeout(this.activeTimer);
      this.activeTimer = null;
      this.map.stop?.();
      if (this.active?.id === prior.id) this.active = null;
    }

    const id = ++this.nextId;
    const options: Record<string, unknown> = { ...('options' in command ? command.options || {} : {}) };
    // Smooth, never-abrupt flights: derive the duration from the real travel distance and zoom change.
    if (command.kind === 'flyTo') {
      options.duration = adaptiveFlightSeconds(
        this.map,
        { lat: command.center[0], lng: command.center[1] },
        command.zoom,
        options.duration as number | undefined
      );
      options.easeLinearity = options.easeLinearity ?? 0.2;
    } else if (command.kind === 'flyToBounds') {
      let target: { lat: number; lng: number } | null = null;
      let zoom: number | null = null;
      try {
        const cz = this.map._getBoundsCenterZoom(command.bounds, options);
        target = cz.center;
        zoom = cz.zoom;
      } catch {}
      options.duration = adaptiveFlightSeconds(this.map, target, zoom, options.duration as number | undefined);
      options.easeLinearity = options.easeLinearity ?? 0.2;
    } else if (command.kind === 'panTo') {
      options.duration = Math.max(0.6, typeof options.duration === 'number' ? options.duration : 0);
    }
    this.active = { id, priority };
    const complete = () => {
      if (this.active?.id === id) {
        this.active = null;
        if (this.activeTimer) clearTimeout(this.activeTimer);
        this.activeTimer = null;
      }
    };
    this.map.once?.('moveend', complete);
    const duration = typeof options.duration === 'number' ? options.duration : 0.5;
    this.activeTimer = setTimeout(complete, Math.max(1000, duration * 1000 + 500));

    try {
      switch (command.kind) {
        case 'flyTo': this.map.flyTo(command.center, command.zoom, options); break;
        case 'flyToBounds': this.map.flyToBounds(command.bounds, options); break;
        case 'fitBounds': this.map.fitBounds(command.bounds, options); break;
        case 'panTo': this.map.panTo(command.center, options); break;
        case 'panBy': this.map.panBy(command.offset, options); break;
        case 'zoom': command.delta > 0 ? this.map.zoomIn(command.delta) : this.map.zoomOut(Math.abs(command.delta)); break;
      }
      if (command.kind === 'fitBounds' && options.animate === false) complete();
      return true;
    } catch {
      complete();
      return false;
    }
  }

  cancelPending(): void {
    if (!this.active) return;
    this.active = null;
    this.nextId++;
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.activeTimer = null;
    try { this.map.stop?.(); } catch {}
  }

  destroy(): void {
    this.cancelPending();
    this.container?.removeEventListener('pointerdown', this.cancelForGesture, true);
    this.container?.removeEventListener('wheel', this.cancelForGesture, true);
    this.map?.off?.('dragstart', this.cancelForGesture);
    this.container = null;
    this.map = null;
  }
}
