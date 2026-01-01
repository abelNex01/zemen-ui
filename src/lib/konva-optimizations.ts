// Konva rendering optimizations
// Utilities for caching, batching, and efficient rendering

import Konva from "konva";

/**
 * Cache a Konva node to improve rendering performance
 * Call this on static or rarely-changing nodes
 */
export function cacheNode(
  node: Konva.Node,
  pixelRatio = window.devicePixelRatio || 1
) {
  if (!node) return;

  try {
    // Calculate cache size with padding for shadows/blurs
    const padding = 10;
    const width = node.width() * node.scaleX() + padding * 2;
    const height = node.height() * node.scaleY() + padding * 2;

    node.cache({
      width,
      height,
      pixelRatio,
      offset: padding,
    });
  } catch (e) {
    // Cache failed, continue without caching
    console.warn("Failed to cache node:", e);
  }
}

/**
 * Batch multiple operations into a single draw
 */
export function batchDraw(layer: Konva.Layer | null) {
  if (!layer) return;
  layer.batchDraw();
}

/**
 * Enable hit graph optimization for better performance with many nodes
 */
export function optimizeStage(stage: Konva.Stage) {
  // Use hit graph for better performance
  stage.listening(true);

  // Optimize layer rendering
  stage.getLayers().forEach((layer) => {
    layer.listening(true);
    layer.hitGraphEnabled(true);
  });
}

/**
 * Create an optimized layer for static content
 */
export function createOptimizedLayer(stage: Konva.Stage, name = "optimized") {
  const layer = new Konva.Layer({ name });
  stage.add(layer);
  return layer;
}

/**
 * Clear cache on a node (call when node changes significantly)
 */
export function clearNodeCache(node: Konva.Node) {
  if (node && node.isCached()) {
    node.clearCache();
  }
}

/**
 * Use OffscreenCanvas for heavy rendering if supported
 */
export function useOffscreenCanvasIfSupported(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}
