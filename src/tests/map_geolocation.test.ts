import assert from 'node:assert/strict';
import React from 'react';
import { useMapGeolocation, UseMapGeolocationProps } from '../components/map/hooks/useMapGeolocation';

// Minimal deterministic hook runner
function createHookHarness(props: UseMapGeolocationProps) {
  let hookIndex = 0;
  const stateSlots: any[] = [];
  const refSlots: any[] = [];
  const cleanups: Function[] = [];

  const dispatcher = {
    useState(initial: any) {
      const idx = hookIndex++;
      if (stateSlots[idx] === undefined) {
        stateSlots[idx] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (next: any) => {
        stateSlots[idx] = typeof next === 'function' ? next(stateSlots[idx]) : next;
        reRender();
      };
      return [stateSlots[idx], setState];
    },
    useRef(initial: any) {
      const idx = hookIndex++;
      if (refSlots[idx] === undefined) {
        refSlots[idx] = { current: initial };
      }
      return refSlots[idx];
    },
    useCallback(fn: Function) {
      const idx = hookIndex++;
      return fn;
    },
    useEffect(effectFn: () => (() => void) | void) {
      const idx = hookIndex++;
      const cleanup = effectFn();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    },
  };

  let hookResult: any;
  function reRender() {
    hookIndex = 0;
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = dispatcher;
    hookResult = useMapGeolocation(props);
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = null;
    return hookResult;
  }

  reRender();
  return {
    get: () => hookResult,
    reRender,
    cleanup: () => cleanups.forEach((c) => c()),
  };
}

// Controllable virtual clock for timer testing
class VirtualClock {
  currentTime = 0;
  timerSeq = 0;
  timers = new Map<number, { due: number; fn: Function }>();
  origSetTimeout: any;
  origClearTimeout: any;

  install() {
    this.currentTime = 0;
    this.timers.clear();
    this.origSetTimeout = globalThis.setTimeout;
    this.origClearTimeout = globalThis.clearTimeout;

    (globalThis as any).setTimeout = (fn: Function, delay: number = 0) => {
      const id = ++this.timerSeq;
      this.timers.set(id, { due: this.currentTime + delay, fn });
      return id as any;
    };

    (globalThis as any).clearTimeout = (id: any) => {
      this.timers.delete(Number(id));
    };
  }

  uninstall() {
    globalThis.setTimeout = this.origSetTimeout;
    globalThis.clearTimeout = this.origClearTimeout;
  }

  tick(ms: number) {
    const target = this.currentTime + ms;
    while (this.currentTime < target) {
      let nextId: number | null = null;
      let nextDue = Infinity;
      for (const [id, t] of this.timers) {
        if (t.due <= target && t.due < nextDue) {
          nextDue = t.due;
          nextId = id;
        }
      }
      if (nextId === null) {
        this.currentTime = target;
        break;
      }
      this.currentTime = nextDue;
      const t = this.timers.get(nextId);
      this.timers.delete(nextId);
      if (t) t.fn();
    }
  }
}

console.log('--- Running useMapGeolocation GPS Timer Tests (ITEM B) ---');

const clock = new VirtualClock();
clock.install();

try {
  // Test 1: Fake navigator delays first fix by 6s
  // Expected: At 4.5s (4500ms), must NOT report a timeout error.
  // At 6s (6000ms), fix arrives and updates position successfully.
  {
    console.log('Test 1: GPS fix delayed by 6s (testing 4.5s safety timer race condition)...');
    let watchSuccess: Function | null = null;
    let selectedPos: any = null;
    let recordedAcc: any = null;

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          watchPosition(success: Function, error: Function, options: any) {
            watchSuccess = success;
            return 101;
          },
          clearWatch(id: number) {},
        },
      },
      configurable: true,
      writable: true,
    });

    const harness = createHookHarness({
      updateSelectedPosition: async (lat, lng, flyTo, zoom) => {
        selectedPos = { lat, lng, flyTo, zoom };
      },
      setGpsAccuracy: (acc) => {
        recordedAcc = acc;
      },
    });

    harness.get().handleGetLocation();
    assert.equal(harness.get().isLocating, true, 'isLocating should be true when started');
    assert.equal(harness.get().geoError, null, 'geoError should be null initially');

    // Advance to 4.5s (4500ms)
    clock.tick(4500);
    assert.equal(
      harness.get().geoError,
      null,
      'Hook must NOT report a timeout error at 4.5s when GPS takes 6s to resolve'
    );
    assert.equal(harness.get().isLocating, true, 'Hook should still be locating at 4.5s');

    // Advance to 6.0s (6000ms) and trigger first fix
    clock.tick(1500);
    assert.ok(watchSuccess, 'watchPosition success callback must be registered');
    watchSuccess!({
      coords: {
        latitude: 29.979184,
        longitude: 31.106863,
        accuracy: 6,
      },
    });

    assert.equal(harness.get().isLocating, false, 'isLocating should be false after position finalized');
    assert.equal(harness.get().geoError, null, 'geoError should remain null on success');
    assert.deepEqual(selectedPos, { lat: 29.979184, lng: 31.106863, flyTo: true, zoom: 17 });
    assert.equal(recordedAcc, 6);
    console.log('✓ Test 1 passed: 6s delayed fix succeeded without 4.5s premature timeout');
  }

  // Test 2: Fake navigator never answers
  // Expected: Hook reports timeout error after the final timeout.
  {
    console.log('Test 2: GPS never answers (testing final timeout behavior)...');
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          watchPosition(success: Function, error: Function, options: any) {
            // Never answers
            return 102;
          },
          clearWatch(id: number) {},
        },
      },
      configurable: true,
      writable: true,
    });

    const harness = createHookHarness({
      updateSelectedPosition: async () => {},
      setGpsAccuracy: () => {},
    });

    harness.get().handleGetLocation();
    assert.equal(harness.get().isLocating, true);

    // Up to 12s (watchPosition timeout), still locating
    clock.tick(12000);
    assert.equal(harness.get().isLocating, true, 'Still locating at 12s');
    // Safety timer fires after final combined timeout (12s watch + 8s fallback = 20s)
    clock.tick(9500); // 21.5s total

    assert.equal(harness.get().isLocating, false, 'isLocating must be false after final timeout');
    assert.ok(
      typeof harness.get().geoError === 'string' && harness.get().geoError.includes('مهلة'),
      `Final timeout must report Arabic timeout error message, got: ${harness.get().geoError}`
    );
    console.log('✓ Test 2 passed: Final timeout reported error after timeout expired');
  }

  // Test 3: Fake navigator errors
  // Expected: Error message is shown without alert().
  {
    console.log('Test 3: GPS errors (testing error message handling without alert)...');
    let alertCalled = false;
    (globalThis as any).alert = () => {
      alertCalled = true;
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          watchPosition(success: Function, error: Function, options: any) {
            // Immediately fail watchPosition
            error({ code: 1, message: 'Permission denied' });
            return 103;
          },
          getCurrentPosition(success: Function, error: Function, options: any) {
            // Immediately fail fallback
            error({ code: 1, message: 'Permission denied' });
          },
          clearWatch(id: number) {},
        },
      },
      configurable: true,
      writable: true,
    });

    const harness = createHookHarness({
      updateSelectedPosition: async () => {},
      setGpsAccuracy: () => {},
    });

    harness.get().handleGetLocation();
    assert.equal(alertCalled, false, 'Must NOT call alert()');
    assert.equal(harness.get().isLocating, false, 'isLocating must be false after error');
    assert.ok(
      typeof harness.get().geoError === 'string' && harness.get().geoError.length > 0,
      'geoError message must be shown when geolocation fails'
    );
    console.log('✓ Test 3 passed: Error message shown and alert() was not called');
  }

  // Test 4: Fallback getCurrentPosition (8s) starts after 12s watch timeout, resolves at 17s (5s in)
  // Expected: 14s safety timer must NOT cut it off at 14s.
  {
    console.log('Test 4: Fallback getCurrentPosition (8s) started at 12s, resolving at 17s...');
    let watchError: Function | null = null;
    let fallbackSuccess: Function | null = null;
    let selectedPos: any = null;

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          watchPosition(success: Function, error: Function, options: any) {
            watchError = error;
            return 104;
          },
          getCurrentPosition(success: Function, error: Function, options: any) {
            fallbackSuccess = success;
          },
          clearWatch(id: number) {},
        },
      },
      configurable: true,
      writable: true,
    });

    const harness = createHookHarness({
      updateSelectedPosition: async (lat, lng, flyTo, zoom) => {
        selectedPos = { lat, lng, flyTo, zoom };
      },
      setGpsAccuracy: () => {},
    });

    harness.get().handleGetLocation();
    assert.equal(harness.get().isLocating, true);

    // At 12s, watchPosition times out / errors
    clock.tick(12000);
    assert.ok(watchError, 'watchPosition error callback registered');
    watchError!({ code: 3, message: 'Timeout' });

    assert.ok(fallbackSuccess, 'getCurrentPosition fallback must be invoked after watchPosition failure');
    assert.equal(harness.get().isLocating, true, 'Hook must still be locating during fallback');

    // Advance to 14.5s (past the old 14s cutoff)
    clock.tick(2500);
    assert.equal(
      harness.get().geoError,
      null,
      'Fallback getCurrentPosition must NOT be cut off at 14s by premature safety timer'
    );
    assert.equal(harness.get().isLocating, true, 'Hook should still be locating at 14.5s');

    // Advance to 17s (5s into 8s fallback) and resolve position
    clock.tick(2500);
    fallbackSuccess!({
      coords: {
        latitude: 29.979184,
        longitude: 31.106863,
        accuracy: 9,
      },
    });

    assert.equal(harness.get().isLocating, false, 'isLocating must be false after fallback succeeds');
    assert.equal(harness.get().geoError, null, 'geoError must be null after fallback succeeds');
    assert.deepEqual(selectedPos, { lat: 29.979184, lng: 31.106863, flyTo: true, zoom: 17 });
    console.log('✓ Test 4 passed: Fallback successfully resolved at 17s without being cut off at 14s');
  }
} finally {
  clock.uninstall();
}
