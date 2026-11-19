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
