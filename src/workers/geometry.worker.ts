// Web Worker for geometry calculations
// Handles snapping, alignment, bounding box calculations off the main thread

export interface SnapToGridRequest {
  type: "snapToGrid";
  value: number;
  gridSize: number;
}

export interface SnapToGridResponse {
  snapped: number;
}

export interface GetBoundingBoxRequest {
  type: "getBoundingBox";
  elements: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface GetBoundingBoxResponse {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapToGuidesRequest {
  type: "snapToGuides";
  position: { x: number; y: number };
  guides: Array<{ x?: number; y?: number }>;
  threshold: number;
}

export interface SnapToGuidesResponse {
  snapped: { x: number; y: number };
  snappedX: boolean;
  snappedY: boolean;
}

type WorkerRequest =
  | SnapToGridRequest
  | GetBoundingBoxRequest
  | SnapToGuidesRequest;

type WorkerResponse =
  | SnapToGridResponse
  | GetBoundingBoxResponse
  | SnapToGuidesResponse;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;
  let response: WorkerResponse;

  switch (request.type) {
    case "snapToGrid": {
      const snapped =
        Math.round(request.value / request.gridSize) * request.gridSize;
      response = { snapped };
      break;
    }

    case "getBoundingBox": {
      if (request.elements.length === 0) {
        response = { x: 0, y: 0, width: 0, height: 0 };
        break;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const el of request.elements) {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }

      response = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
      break;
    }

    case "snapToGuides": {
      let snappedX = request.position.x;
      let snappedY = request.position.y;
      let hasSnappedX = false;
      let hasSnappedY = false;

      for (const guide of request.guides) {
        if (guide.x !== undefined) {
          const dist = Math.abs(request.position.x - guide.x);
          if (dist < request.threshold) {
            snappedX = guide.x;
            hasSnappedX = true;
          }
        }
        if (guide.y !== undefined) {
          const dist = Math.abs(request.position.y - guide.y);
          if (dist < request.threshold) {
            snappedY = guide.y;
            hasSnappedY = true;
          }
        }
      }

      response = {
        snapped: { x: snappedX, y: snappedY },
        snappedX: hasSnappedX,
        snappedY: hasSnappedY,
      };
      break;
    }

    default:
      return;
  }

  self.postMessage(response);
};
