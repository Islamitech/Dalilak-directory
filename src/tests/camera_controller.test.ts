import { describe, expect, it } from 'vitest';
import { CameraController } from '../components/map/controllers/CameraController';

describe('CameraController', () => {
  it('enforces camera priority and cancels a pending flight on user pointer input', () => {
    const listeners = new Map<string, (event?: unknown) => void>();
    const moveEndHandlers: Array<() => void> = [];
    const calls: string[] = [];
    const container = {
      addEventListener: (name: string, listener: (event?: unknown) => void) => listeners.set(name, listener),
      removeEventListener: (name: string) => listeners.delete(name),
    };
    const map: any = {
      getContainer: () => container,
      on: () => {}, off: () => {},
      once: (_name: string, callback: () => void) => moveEndHandlers.push(callback),
      stop: () => { calls.push('stop'); moveEndHandlers.splice(0).forEach(callback => callback()); },
      flyTo: () => calls.push('flyTo'),
    };
    const camera = new CameraController(map);
    expect(camera.request({ kind: 'flyTo', center: [29, 31], zoom: 15 }, 'zone')).toBe(true);
    expect(camera.request({ kind: 'flyTo', center: [29.1, 31.1], zoom: 17 }, 'selection')).toBe(true);
    expect(camera.request({ kind: 'flyTo', center: [29.2, 31.2], zoom: 16 }, 'zone')).toBe(false);
    expect(calls).toEqual(['flyTo', 'stop', 'flyTo']);
    listeners.get('pointerdown')?.();
    expect(calls.at(-1)).toBe('stop');
    expect(camera.request({ kind: 'flyTo', center: [29.3, 31.3], zoom: 16 }, 'zone')).toBe(true);
    camera.destroy();
  });
});
