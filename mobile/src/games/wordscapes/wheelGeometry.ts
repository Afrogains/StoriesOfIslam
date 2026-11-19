export type Point = { x: number; y: number };

/** Letter centres evenly spaced on a circle, starting at 12 o'clock and going clockwise. */
export function wheelNodes(count: number, size: number, nodeRadius: number): Point[] {
  const center = size / 2;
  const orbit = center - nodeRadius - 4;
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { x: center + orbit * Math.cos(angle), y: center + orbit * Math.sin(angle) };
  });
}

export function hitNode(point: Point, nodes: readonly Point[], hitRadius: number): number {
  let best = -1;
  let bestDistance = hitRadius;
  nodes.forEach((node, index) => {
    const distance = Math.hypot(point.x - node.x, point.y - node.y);
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * Walks the segment between two pointer samples so a fast swipe still picks up every
 * letter it crosses, even when the platform reports only sparse move events.
 */
export function extendPathAlong(
  path: readonly number[],
  from: Point | null,
  to: Point,
  nodes: readonly Point[],
  hitRadius: number,
): number[] {
  if (!from) return extendPath(path, hitNode(to, nodes, hitRadius));
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (hitRadius / 2)));
  let next = [...path];
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    next = extendPath(next, hitNode({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, nodes, hitRadius));
  }
  return next;
}

/**
 * Extends or rewinds a swipe path. Entering a new letter appends it; sliding back onto
 * the previous letter removes the last one, which is how players fix a wrong turn.
 */
export function extendPath(path: readonly number[], node: number): number[] {
  if (node < 0) return [...path];
  if (path[path.length - 1] === node) return [...path];
  if (path.length >= 2 && path[path.length - 2] === node) return path.slice(0, -1);
  if (path.includes(node)) return [...path];
  return [...path, node];
}
