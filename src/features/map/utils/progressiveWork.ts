/** Runs small, cancellable batches between paints with strict <= 3.5ms budget for 60fps; no artificial loading delay. */
export function scheduleProgressiveWork<T>(
  items: T[],
  run: (item: T) => void,
  done: () => void,
  scheduler = { request: (callback: FrameRequestCallback) => requestAnimationFrame(callback), cancel: (id: number) => cancelAnimationFrame(id), now: () => performance.now() },
  maxItemsPerFrame = 4,
  maxMsPerFrame = 3.5
): () => void {
  let index = 0;
  let cancelled = false;
  let frame = 0;
  const step = () => {
    if (cancelled) return;
    const start = scheduler.now();
    let count = 0;
    while (index < items.length && count < maxItemsPerFrame && scheduler.now() - start < maxMsPerFrame) {
      run(items[index++]); count++;
      if (cancelled) return;
    }
    if (index < items.length) frame = scheduler.request(step);
    else done();
  };
  frame = scheduler.request(step);
  return () => { cancelled = true; scheduler.cancel(frame); };
}

