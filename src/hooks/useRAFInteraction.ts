// RAF-based interaction loop for smooth pointer interactions
// This hook handles all pointer interactions using requestAnimationFrame
// to avoid blocking the main thread and prevent React re-renders during drag

import { useRef, useCallback, useEffect } from "react";
import Konva from "konva";

interface RAFInteractionState {
  isActive: boolean;
  rafId: number | null;
  lastPointerPos: { x: number; y: number } | null;
  dragStart: { x: number; y: number } | null;
  activeNode: Konva.Node | null;
  initialTransform: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function useRAFInteraction() {
  const stateRef = useRef<RAFInteractionState>({
    isActive: false,
    rafId: null,
    lastPointerPos: null,
    dragStart: null,
    activeNode: null,
    initialTransform: null,
  });

  // Start RAF loop
  const startRAF = useCallback((callback: () => void) => {
    const state = stateRef.current;
    if (state.rafId !== null) return;

    const rafLoop = () => {
      if (state.isActive) {
        callback();
        state.rafId = requestAnimationFrame(rafLoop);
      } else {
        state.rafId = null;
      }
    };

    state.rafId = requestAnimationFrame(rafLoop);
  }, []);

  // Stop RAF loop
  const stopRAF = useCallback(() => {
    const state = stateRef.current;
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.isActive = false;
    state.lastPointerPos = null;
    state.dragStart = null;
    state.activeNode = null;
    state.initialTransform = null;
  }, []);

  // Update pointer position (called from pointermove)
  const updatePointerPos = useCallback((pos: { x: number; y: number }) => {
    stateRef.current.lastPointerPos = pos;
  }, []);

  // Set active node for dragging
  const setActiveNode = useCallback(
    (
      node: Konva.Node | null,
      initialTransform?: { x: number; y: number; width: number; height: number }
    ) => {
      const state = stateRef.current;
      state.activeNode = node;
      if (initialTransform) {
        state.initialTransform = initialTransform;
      }
    },
    []
  );

  // Set drag start position
  const setDragStart = useCallback((pos: { x: number; y: number }) => {
    stateRef.current.dragStart = pos;
    stateRef.current.isActive = true;
  }, []);

  // Get current state (for reading in RAF callbacks)
  const getState = useCallback(() => stateRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRAF();
    };
  }, [stopRAF]);

  return {
    startRAF,
    stopRAF,
    updatePointerPos,
    setActiveNode,
    setDragStart,
    getState,
  };
}
