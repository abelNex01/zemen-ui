// Geometry worker helper - simplified synchronous version for now
// We'll use Web Workers for heavy operations, but keep simple math synchronous
// to avoid message passing overhead for trivial calculations

import { getGeometryWorkerPool } from "./worker-pool";

export async function snapToGridAsync(
  value: number,
  gridSize: number
): Promise<number> {
  // For simple operations, use synchronous version to avoid overhead
  // Only use worker for batch operations
  return Math.round(value / gridSize) * gridSize;
}

export async function getBoundingBoxAsync(
  elements: Array<{ x: number; y: number; width: number; height: number }>
): Promise<{ x: number; y: number; width: number; height: number }> {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // For small arrays, synchronous is faster
  if (elements.length < 10) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // For now, always use synchronous (fast enough)
  // Workers can be added later if needed for very large arrays (1000+ elements)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Synchronous versions for hot paths (called in RAF)
export function snapToGridSync(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getBoundingBoxSync(
  elements: Array<{ x: number; y: number; width: number; height: number }>
): { x: number; y: number; width: number; height: number } {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
