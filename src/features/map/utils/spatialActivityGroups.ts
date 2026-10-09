export function activityCardScale(zoom: number): number {
  return Math.max(0.78, Math.min(1, 0.78 + (zoom - 14) * 0.055));
}

export function groupNearbyActivities<T extends { id: string; lat: number; lng: number }>(
  items: T[], project: (item: T) => { x: number; y: number }, radius: number, maxMeters = 100
): T[][] {
  const groups: Array<{ seed: T; x: number; y: number; items: T[] }> = [];
  const grid = new Map<string, typeof groups>();
  for (const item of [...items].sort((a,b) => a.id.localeCompare(b.id))) {
    const point = project(item);
    const gx = Math.floor(point.x / radius), gy = Math.floor(point.y / radius);
    let match: typeof groups[number] | undefined;
    for (let x = gx - 1; x <= gx + 1 && !match; x++) {
      for (let y = gy - 1; y <= gy + 1 && !match; y++) {
        match = grid.get(`${x}:${y}`)?.find(g => {
          const north = (item.lat - g.seed.lat) * 111320;
          const east = (item.lng - g.seed.lng) * 111320 * Math.cos(item.lat * Math.PI / 180);
          return Math.hypot(point.x-g.x, point.y-g.y) <= radius && Math.hypot(north,east) <= maxMeters;
        });
      }
    }
    if (match) match.items.push(item);
    else {
      const group = { seed: item, ...point, items: [item] };
      groups.push(group);
      const key = `${gx}:${gy}`;
      grid.set(key, [...(grid.get(key) || []), group]);
    }
  }
  return groups.map(g => g.items);
}
