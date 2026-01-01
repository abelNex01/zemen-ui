// Optimized Zustand selectors to minimize re-renders
// Use these instead of direct store access to prevent unnecessary re-renders

import { useEditorStore } from "@/store/editor-store";

// Select only the properties we need
export function useEditorTool() {
  return useEditorStore((state) => state.tool);
}

export function useEditorZoom() {
  return useEditorStore((state) => state.zoom);
}

export function useEditorPan() {
  return useEditorStore((state) => state.pan);
}

export function useEditorGridVisible() {
  return useEditorStore((state) => state.gridVisible);
}

export function useEditorSnapToGrid() {
  return useEditorStore((state) => state.snapToGrid);
}

export function useEditorSelectedIds() {
  return useEditorStore((state) => state.selectedElementIds);
}

export function useEditorCurrentPage() {
  return useEditorStore((state) => state._getCurrentPage());
}

export function useEditorProject() {
  return useEditorStore((state) => state.project);
}

export function useEditorCurrentPageId() {
  return useEditorStore((state) => state.currentPageId);
}

// Select multiple values (Zustand v5 does shallow comparison automatically)
export function useEditorViewState() {
  return useEditorStore((state) => ({
    zoom: state.zoom,
    pan: state.pan,
    gridVisible: state.gridVisible,
    snapToGrid: state.snapToGrid,
  }));
}

export function useEditorSelection() {
  return useEditorStore((state) => ({
    selectedElementIds: state.selectedElementIds,
    currentPageId: state.currentPageId,
  }));
}
