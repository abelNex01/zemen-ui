// Optimized tool interaction hook using RAF for smooth interactions
// NO React/Zustand state updates during pointermove - only on pointerup

import { useState, useCallback, useRef } from "react";
import Konva from "konva";
import { useEditorStore } from "@/store/editor-store";
import { snapToGridSync, getBoundingBoxSync } from "@/lib/geometry-worker";
import { ElementType } from "@/types/editor";
import { useRAFInteraction } from "./useRAFInteraction";

const GRID_SIZE = 20;

export function useToolInteraction(
  stageRef: React.RefObject<Konva.Stage>,
  currentPageId: string | null
) {
  const {
    tool,
    pan,
    zoom,
    snapToGrid: snapEnabled,
    updateElement,
    addElement,
    selectElement,
    clearSelection,
    setPan,
    setTool,
    _getCurrentPage,
    selectedElementIds,
  } = useEditorStore();

  const rafInteraction = useRAFInteraction();

  // Local state for UI (selection rect, dragging state)
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Refs for mutable values (not React state)
  const dragStateRef = useRef<{
    startPos: { x: number; y: number } | null;
    currentDrawingId: string | null;
    activeNode: Konva.Node | null;
    initialTransform: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    isPanning: boolean;
  }>({
    startPos: null,
    currentDrawingId: null,
    activeNode: null,
    initialTransform: null,
    isPanning: false,
  });

  // RAF callback for panning
  const handlePanRAF = useCallback(() => {
    const state = rafInteraction.getState();
    const dragState = dragStateRef.current;

    if (
      !state.isActive ||
      !dragState.isPanning ||
      !state.lastPointerPos ||
      !dragState.startPos
    ) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    // Calculate new pan position
    const newPan = {
      x: state.lastPointerPos.x - dragState.startPos.x,
      y: state.lastPointerPos.y - dragState.startPos.y,
    };

    // Update pan directly (this will be committed to Zustand on mouseup)
    // For now, we update it synchronously but could batch this
    setPan(newPan);
  }, [rafInteraction, stageRef, setPan]);

  // RAF callback for drawing
  const handleDrawRAF = useCallback(() => {
    const state = rafInteraction.getState();
    const dragState = dragStateRef.current;

    if (
      !state.isActive ||
      !dragState.currentDrawingId ||
      !state.lastPointerPos ||
      !dragState.startPos
    ) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getRelativePointerPosition();
    if (!point) return;

    const { x: currentX, y: currentY } = point;
    const { x: startX, y: startY } = dragState.startPos;

    const newX = Math.min(startX, currentX);
    const newY = Math.min(startY, currentY);
    let width = Math.abs(currentX - startX);
    let height = Math.abs(currentY - startY);

    // Update Konva node directly (no React state)
    const node = stage.findOne(`#${dragState.currentDrawingId}`) as Konva.Node;
    if (node) {
      node.x(newX);
      node.y(newY);
      node.width(Math.max(1, width));
      node.height(Math.max(1, height));
      node.getLayer()?.batchDraw();
    }
  }, [rafInteraction, stageRef]);

  // RAF callback for element dragging
  const handleElementDragRAF = useCallback(() => {
    const state = rafInteraction.getState();
    const dragState = dragStateRef.current;

    if (
      !dragState.activeNode ||
      !dragState.initialTransform ||
      !state.lastPointerPos
    ) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position in stage coordinates
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert to relative coordinates (accounting for zoom/pan)
    const scale = zoom / 100;
    const relativeX = (pointerPos.x - pan.x) / scale;
    const relativeY = (pointerPos.y - pan.y) / scale;

    // Calculate offset from initial position
    const offsetX = relativeX - dragState.initialTransform.x;
    const offsetY = relativeY - dragState.initialTransform.y;

    let newX = dragState.initialTransform.x + offsetX;
    let newY = dragState.initialTransform.y + offsetY;

    // Apply snapping if enabled (synchronous for RAF)
    if (snapEnabled) {
      const snapThreshold = GRID_SIZE / 8;
      const snappedX = snapToGridSync(newX, GRID_SIZE);
      const snappedY = snapToGridSync(newY, GRID_SIZE);

      if (Math.abs(newX - snappedX) < snapThreshold) {
        newX = snappedX;
      }
      if (Math.abs(newY - snappedY) < snapThreshold) {
        newY = snappedY;
      }
    }

    // Update Konva node directly (no React/Zustand updates)
    dragState.activeNode.x(newX);
    dragState.activeNode.y(newY);
    dragState.activeNode.getLayer()?.batchDraw();
  }, [rafInteraction, stageRef, snapEnabled, zoom, pan]);

  // RAF callback for selection rect
  const handleSelectionRectRAF = useCallback(() => {
    const state = rafInteraction.getState();
    const dragState = dragStateRef.current;

    if (!state.isActive || !state.lastPointerPos || !dragState.startPos) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getRelativePointerPosition();
    if (!point) return;

    // Update selection rect (this is just visual, so React state is OK)
    setSelectionRect({
      x: Math.min(dragState.startPos.x, point.x),
      y: Math.min(dragState.startPos.y, point.y),
      width: Math.abs(point.x - dragState.startPos.x),
      height: Math.abs(point.y - dragState.startPos.y),
    });
  }, [rafInteraction, stageRef]);

  // Main RAF callback dispatcher
  const rafCallback = useCallback(() => {
    const dragState = dragStateRef.current;

    if (dragState.isPanning) {
      handlePanRAF();
    } else if (dragState.currentDrawingId) {
      handleDrawRAF();
    } else if (dragState.activeNode) {
      handleElementDragRAF();
    } else if (tool === "select") {
      handleSelectionRectRAF();
    }
  }, [
    handlePanRAF,
    handleDrawRAF,
    handleElementDragRAF,
    handleSelectionRectRAF,
    tool,
  ]);

  // --- Handlers ---

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Don't interfere with element dragging - if clicking on an element, let Konva handle it
      const target = e.target;
      const stage = target.getStage();
      if (!stage) return;

      // If clicking on an element (not stage or layer), let Konva's draggable handle it
      if (
        target !== stage &&
        target.getType() !== "Stage" &&
        target.getType() !== "Layer" &&
        target.getType() !== "Group"
      ) {
        // Check if it's actually an element (has an id that matches an element)
        const elementId = target.id();
        if (elementId && tool === "select") {
          // Let Konva's draggable handle element dragging
          return;
        }
      }

      // 1. Hand Tool / Pan
      if (
        tool === "hand" ||
        e.evt.button === 1 ||
        (e.evt.button === 0 && e.evt.ctrlKey)
      ) {
        const dragState = dragStateRef.current;
        dragState.isPanning = true;
        dragState.startPos = {
          x: e.evt.clientX - pan.x,
          y: e.evt.clientY - pan.y,
        };
        setIsDragging(true);
        rafInteraction.setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
        rafInteraction.startRAF(rafCallback);
        return;
      }

      const point = stage.getRelativePointerPosition();
      if (!point) return;

      let { x, y } = point;

      // 2. Drawing
      if (["rectangle", "ellipse", "frame", "text"].includes(tool)) {
        setIsDrawing(true);
        const dragState = dragStateRef.current;
        dragState.startPos = { x, y };

        const id = addElement({
          type: tool as ElementType,
          name: tool.charAt(0).toUpperCase() + tool.slice(1),
          visible: true,
          locked: false,
          transform: {
            x,
            y,
            width: 1,
            height: 1,
            rotation: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
          },
          fill: { type: "solid", color: "#D9D9D9" },
          stroke:
            tool === "line"
              ? { color: "#000000", width: 2 }
              : { color: "#000000", width: 0 },
          borderRadius: 0,
          ...(tool === "text" && {
            content: "Text",
            style: {
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: 0,
              textAlign: "left",
            },
            transform: {
              x,
              y,
              width: 100,
              height: 24,
              rotation: 0,
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
            },
          }),
        });

        dragState.currentDrawingId = id;
        clearSelection();

        // Start RAF for drawing
        rafInteraction.setDragStart({ x, y });
        rafInteraction.startRAF(rafCallback);
        return;
      }

      // 3. Selection Box
      if (tool === "select") {
        if (e.target === stage) {
          clearSelection();
          setIsDragging(true);
          const dragState = dragStateRef.current;
          dragState.startPos = { x, y };
          rafInteraction.setDragStart({ x, y });
          rafInteraction.startRAF(rafCallback);
        }
      }
    },
    [tool, pan, addElement, clearSelection, rafInteraction, rafCallback]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only update pointer position for RAF loop
      // NO state updates here!
      const stage = e.target.getStage();
      if (!stage) return;
      const point = stage.getRelativePointerPosition();
      if (!point) return;

      // Update pointer position in RAF state
      rafInteraction.updatePointerPos({ x: e.evt.clientX, y: e.evt.clientY });
    },
    [rafInteraction]
  );

  const handleMouseUp = useCallback(() => {
    const dragState = dragStateRef.current;
    const page = _getCurrentPage();

    // Stop RAF loop
    rafInteraction.stopRAF();

    if (isDrawing && dragState.currentDrawingId) {
      // Commit drawing to state
      if (tool !== "text") {
        const element = page?.elements.find(
          (e) => e.id === dragState.currentDrawingId
        );
        if (element) {
          if (element.transform.width < 5 || element.transform.height < 5) {
            updateElement(
              dragState.currentDrawingId,
              {
                transform: { ...element.transform, width: 100, height: 100 },
              },
              true
            );
          } else {
            // Get final position from Konva node
            const stage = stageRef.current;
            if (stage) {
              const node = stage.findOne(
                `#${dragState.currentDrawingId}`
              ) as Konva.Node;
              if (node) {
                updateElement(
                  dragState.currentDrawingId,
                  {
                    transform: {
                      x: node.x(),
                      y: node.y(),
                      width: node.width(),
                      height: node.height(),
                      rotation: 0,
                      opacity: 1,
                      scaleX: 1,
                      scaleY: 1,
                    },
                  },
                  true
                );
              }
            }
          }
        }
        selectElement(dragState.currentDrawingId);
      }
      setIsDrawing(false);
      dragState.currentDrawingId = null;
      dragState.startPos = null;
      setTool("select");
    }

    if (tool === "select" && selectionRect) {
      // Commit selection
      const selected: string[] = [];
      page?.elements.forEach((element) => {
        const bounds = getBoundingBoxSync([element.transform]);
        if (
          bounds.x < selectionRect.x + selectionRect.width &&
          bounds.x + bounds.width > selectionRect.x &&
          bounds.y < selectionRect.y + selectionRect.height &&
          bounds.y + bounds.height > selectionRect.y
        ) {
          selected.push(element.id);
        }
      });
      clearSelection();
      selected.forEach((id) => selectElement(id, true));
    }

    // Reset drag state
    setIsDragging(false);
    dragState.startPos = null;

    // Reset element drag state if active
    if (dragState.activeNode) {
      // Get final position from node and commit to state
      const finalX = dragState.activeNode.x();
      const finalY = dragState.activeNode.y();
      const elementId = dragState.activeNode.id();

      const element = page?.elements.find((e) => e.id === elementId);
      if (element) {
        updateElement(
          elementId,
          {
            transform: {
              ...element.transform,
              x: finalX,
              y: finalY,
            },
          },
          true
        );
      }

      dragState.activeNode = null;
      dragState.initialTransform = null;
    }

    dragState.isPanning = false;
    setSelectionRect(null);
  }, [
    isDrawing,
    tool,
    selectionRect,
    _getCurrentPage,
    selectElement,
    updateElement,
    setTool,
    clearSelection,
    rafInteraction,
    stageRef,
  ]);

  // Expose setActiveNode for element dragging
  const setActiveNode = useCallback(
    (
      node: Konva.Node | null,
      initialTransform?: { x: number; y: number; width: number; height: number }
    ) => {
      const dragState = dragStateRef.current;
      dragState.activeNode = node;
      if (initialTransform) {
        dragState.initialTransform = initialTransform;
      }
      if (node) {
        rafInteraction.setActiveNode(node, initialTransform);
        rafInteraction.startRAF(rafCallback);
      } else {
        rafInteraction.stopRAF();
      }
    },
    [rafInteraction, rafCallback]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    selectionRect,
    isDragging: isDragging || isDrawing,
    setActiveNode,
  };
}
