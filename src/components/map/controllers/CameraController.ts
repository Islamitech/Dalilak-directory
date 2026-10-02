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
    const options = 'options' in command ? command.options || {} : {};
    this.active = { id, priority };
    const complete = () => {
      if (this.active?.id === id) {
        this.active = null;
        if (this.activeTimer) clearTimeout(this.activeTimer);
        this.activeTimer = null;
      }
    };
    this.map.once?.('moveend', complete);
    const duration = typeof (options as any).duration === 'number' ? (options as any).duration : 0.5;
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
      if (command.kind === 'fitBounds' && (options as any).animate === false) complete();
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
