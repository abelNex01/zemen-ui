// Main canvas editor component using Konva
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Text,
  Image,
  Group,
  Transformer,
  Line,
  Star,
} from "react-konva";
import { useEditorStore } from "@/store/editor-store";
import { Element } from "@/types/editor";
import { snapToGrid } from "@/lib/editor-utils";
import Konva from "konva";
import { useToolInteraction } from "@/hooks/useToolInteraction";
import { useTheme } from "@/hooks/use-theme";
import { cacheNode, batchDraw } from "@/lib/konva-optimizations";
import { getPerformanceMonitor } from "@/lib/performance-monitor";

// --- Memoized Element Components ---

const ShapeRect = React.memo(
  ({ element, ...props }: { element: Element } & any) => (
    <Rect {...props} cornerRadius={element.borderRadius} />
  ),
  (prev, next) => {
    // Custom comparison for better memoization
    return (
      prev.element.id === next.element.id &&
      prev.element.transform.x === next.element.transform.x &&
      prev.element.transform.y === next.element.transform.y &&
      prev.element.transform.width === next.element.transform.width &&
      prev.element.transform.height === next.element.transform.height &&
      prev.element.transform.rotation === next.element.transform.rotation &&
      prev.element.transform.opacity === next.element.transform.opacity &&
      prev.element.fill.color === next.element.fill.color &&
      prev.element.borderRadius === next.element.borderRadius
    );
  }
);

const ShapeEllipse = React.memo(
  ({ element, ...props }: { element: Element } & any) => (
    <Ellipse
      {...props}
      radiusX={element.transform.width / 2}
      radiusY={element.transform.height / 2}
      x={element.transform.x + element.transform.width / 2}
      y={element.transform.y + element.transform.height / 2}
      width={undefined}
      height={undefined}
    />
  ),
  (prev, next) => {
    return (
      prev.element.id === next.element.id &&
      prev.element.transform.x === next.element.transform.x &&
      prev.element.transform.y === next.element.transform.y &&
      prev.element.transform.width === next.element.transform.width &&
      prev.element.transform.height === next.element.transform.height &&
      prev.element.transform.rotation === next.element.transform.rotation &&
      prev.element.transform.opacity === next.element.transform.opacity &&
      prev.element.fill.color === next.element.fill.color
    );
  }
);

const ShapeText = React.memo(
  ({
    element,
    onDoubleClick,
    ...props
  }: { element: Element; onDoubleClick?: () => void } & any) => (
    <Text
      {...props}
      text={(element as any).content}
      fontFamily={(element as any).style.fontFamily}
      fontSize={(element as any).style.fontSize}
      fontStyle={(element as any).style.fontWeight >= 700 ? "bold" : "normal"}
      align={(element as any).style.textAlign}
      verticalAlign="middle"
      fill={element.fill.type === "solid" ? element.fill.color : "#000000"}
      onDblClick={onDoubleClick}
    />
  )
);

const ShapeImage = React.memo(
  ({ element, ...props }: { element: Element } & any) => {
    const [imageObj, setImageObj] = React.useState<HTMLImageElement | null>(
      null
    );
    const src = (element as any).imageStyle?.src;

    useEffect(() => {
      if (src) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setImageObj(img);
        img.onerror = () => setImageObj(null);
        img.src = src;
      }
    }, [src]);

    if (!imageObj) return <Rect {...props} fill="#ccc" />;
    return <Image {...props} image={imageObj} />;
  }
);

const ShapeStar = React.memo(
  ({ element, ...props }: { element: Element } & any) => {
    const numPoints = 5;
    const innerRadius =
      Math.min(element.transform.width, element.transform.height) * 0.4;
    const outerRadius =
      Math.min(element.transform.width, element.transform.height) * 0.5;
    return (
      <Star
        {...props}
        x={element.transform.x + element.transform.width / 2}
        y={element.transform.y + element.transform.height / 2}
        numPoints={numPoints}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
      />
    );
  }
);

const ShapeLine = React.memo(
  ({ element, ...props }: { element: Element } & any) => {
    return (
      <Line
        {...props}
        points={[
          element.transform.x,
          element.transform.y,
          element.transform.x + element.transform.width,
          element.transform.y + element.transform.height,
        ]}
        stroke={element.stroke?.color || element.fill.color}
        strokeWidth={element.stroke?.width || 2}
        fill={undefined}
      />
    );
  }
);

// --- Main Canvas Component ---

const GRID_SIZE = 20;

const getCursorStyle = (tool: string, isDragging: boolean) => {
  if (tool === "hand") return isDragging ? "grabbing" : "grab";
  if (tool === "select") return "default";
  return "crosshair";
};

interface CanvasEditorProps {
  width: number;
  height: number;
  onStageReady?: (stage: Konva.Stage) => void;
}

export default function CanvasEditor({
  width,
  height,
  onStageReady,
}: CanvasEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [editingTextId, setEditingTextId] = React.useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = React.useState("");
  const textInputRef = React.useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  // Get theme-aware colors
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const canvasBg = isDark ? "#1e1e1e" : "#ffffff";
  const gridDotColor = isDark ? "#333" : "#e5e5e5";

  // Expose stage ref to parent when it's ready
  useEffect(() => {
    if (stageRef.current && onStageReady) {
      onStageReady(stageRef.current);

      // Start performance monitoring in dev
      if (process.env.NODE_ENV === "development") {
        getPerformanceMonitor().start();
      }
    }
  }, [onStageReady, width, height]); // Update when stage dimensions change
  const transformerRef = useRef<Konva.Transformer>(null);

  // Use optimized selectors to minimize re-renders
  const tool = useEditorStore((state) => state.tool);
  const zoom = useEditorStore((state) => state.zoom);
  const pan = useEditorStore((state) => state.pan);
  const gridVisible = useEditorStore((state) => state.gridVisible);
  const snapEnabled = useEditorStore((state) => state.snapToGrid);
  const selectedElementIds = useEditorStore(
    (state) => state.selectedElementIds
  );
  const currentPage = useEditorStore((state) => state._getCurrentPage());
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElement = useEditorStore((state) => state.updateElement);

  const selectedElements = useMemo(
    () =>
      currentPage?.elements.filter((e) => selectedElementIds.includes(e.id)) ||
      [],
    [currentPage, selectedElementIds]
  );

  // Use the new RAF-based interaction hook
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    selectionRect,
    isDragging,
    setActiveNode,
  } = useToolInteraction(stageRef, currentPage?.id || null);

  // Update transformer (optimized with batching)
  useEffect(() => {
    if (transformerRef.current && selectedElements.length > 0) {
      const nodes = selectedElements
        .map((el) => {
          const node = stageRef.current?.findOne(`#${el.id}`);
          return node as Konva.Node;
        })
        .filter(Boolean) as Konva.Node[];

      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        const layer = transformerRef.current.getLayer();
        if (layer) {
          batchDraw(layer);
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementIds, selectedElements]);

  // Handle element interaction (Select / Drag)
  const handleElementClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, elementId: string) => {
      e.cancelBubble = true;
      if (tool === "select") {
        selectElement(elementId, e.evt.shiftKey);
      }
    },
    [tool, selectElement]
  );

  const handleElementDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
      const node = e.target;
      // Get final position from node
      let newX = node.x();
      let newY = node.y();

      // Apply snapping if enabled (final snap on commit)
      if (snapEnabled) {
        const snapThreshold = GRID_SIZE / 8;
        const snappedX = snapToGrid(newX, GRID_SIZE);
        const snappedY = snapToGrid(newY, GRID_SIZE);

        if (Math.abs(newX - snappedX) < snapThreshold) {
          newX = snappedX;
        }
        if (Math.abs(newY - snappedY) < snapThreshold) {
          newY = snappedY;
        }
        node.x(newX);
        node.y(newY);
      }

      const oldTransform = currentPage?.elements.find(
        (el) => el.id === elementId
      )?.transform;
      if (!oldTransform) return;

      // Commit final state to Zustand (only once on drag end)
      updateElement(
        elementId,
        {
          transform: {
            ...oldTransform,
            x: newX,
            y: newY,
          },
        },
        true
      );

      // Clear active node
      setActiveNode(null);
    },
    [snapEnabled, updateElement, currentPage, setActiveNode]
  );

  const handleTransformEnd = useCallback(() => {
    if (!transformerRef.current) return;
    const node = transformerRef.current.nodes()[0];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const oldTransform = currentPage?.elements.find(
      (el) => el.id === node.id()
    )?.transform;
    if (!oldTransform) return;

    updateElement(
      node.id(),
      {
        transform: {
          ...oldTransform,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
          opacity: oldTransform.opacity, // Explicitly keep opacity
        },
      },
      true
    );
  }, [updateElement, currentPage]);

  const handleTextDoubleClick = useCallback(
    (elementId: string) => {
      const element = currentPage?.elements.find((e) => e.id === elementId);
      if (element && element.type === "text") {
        setEditingTextId(elementId);
        setEditingTextValue((element as any).content || "");
        setTimeout(() => {
          textInputRef.current?.focus();
          textInputRef.current?.select();
        }, 0);
      }
    },
    [currentPage]
  );

  const handleTextEditComplete = useCallback(() => {
    if (editingTextId && editingTextValue !== undefined) {
      updateElement(editingTextId, { content: editingTextValue } as any, true);
    }
    setEditingTextId(null);
    setEditingTextValue("");
  }, [editingTextId, editingTextValue, updateElement]);

  // Handle image tool - trigger file input on canvas click
  useEffect(() => {
    if (tool === "image" && stageRef.current) {
      let clickPosition: { x: number; y: number } | null = null;

      const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only trigger if clicking on the stage background, not on an element
        if (e.target === e.target.getStage()) {
          // Store click position
          const stage = e.target.getStage();
          if (stage) {
            const pos = stage.getPointerPosition();
            if (pos) {
              clickPosition = { x: pos.x, y: pos.y };
            }
          }

          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && clickPosition) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const { addElement, setTool } = useEditorStore.getState();

                // Load image to get natural dimensions
                const img = new window.Image();
                img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  const defaultWidth = 200;
                  const defaultHeight = defaultWidth / aspectRatio;

                  // Use stored click position - getPointerPosition returns stage coordinates
                  // Account for zoom and pan
                  const scale = zoom / 100;
                  const adjustedX = (clickPosition!.x - pan.x) / scale;
                  const adjustedY = (clickPosition!.y - pan.y) / scale;

                  addElement({
                    type: "image",
                    name: "Image",
                    visible: true,
                    locked: false,
                    transform: {
                      x: adjustedX - defaultWidth / 2,
                      y: adjustedY - defaultHeight / 2,
                      width: defaultWidth,
                      height: defaultHeight,
                      rotation: 0,
                      opacity: 1,
                      scaleX: 1,
                      scaleY: 1,
                    },
                    fill: { type: "solid", color: "#ffffff" },
                    stroke: { color: "#000000", width: 0 },
                    borderRadius: 0,
                    imageStyle: { src: dataUrl, fit: "contain" },
                  } as any);

                  // Switch back to select tool after adding image
                  setTool("select");
                  clickPosition = null;
                };
                img.onerror = () => {
                  console.error("Failed to load image");
                  useEditorStore.getState().setTool("select");
                  clickPosition = null;
                };
                img.src = dataUrl;
              };
              reader.onerror = () => {
                console.error("Failed to read file");
                useEditorStore.getState().setTool("select");
                clickPosition = null;
              };
              reader.readAsDataURL(file);
            } else {
              // If user cancels, switch back to select tool
              useEditorStore.getState().setTool("select");
              clickPosition = null;
            }
          };
          input.click();
        }
      };

      const stage = stageRef.current;
      stage.on("click", handleClick);
      return () => {
        stage.off("click", handleClick);
      };
    }
  }, [tool, zoom, pan]);

  if (!currentPage) return null;

  return (
    <div className="w-full h-full relative bg-background overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: getCursorStyle(tool, isDragging) }}
      >
        <Layer>
          {gridVisible && (
            <Group scaleX={zoom / 100} scaleY={zoom / 100} x={pan.x} y={pan.y}>
              <Rect
                width={width * 10}
                height={height * 10}
                x={-width * 5}
                y={-height * 5}
                fill={canvasBg}
                listening={false}
              />
              {/* Dot Grid */}
              {Array.from({ length: Math.ceil(width / GRID_SIZE) }).map(
                (_, i) =>
                  Array.from({ length: Math.ceil(height / GRID_SIZE) }).map(
                    (_, j) => (
                      <Rect
                        key={`${i}-${j}`}
                        x={
                          i * GRID_SIZE -
                          ((Math.floor(pan.x / GRID_SIZE) * GRID_SIZE) %
                            GRID_SIZE)
                        }
                        y={
                          j * GRID_SIZE -
                          ((Math.floor(pan.y / GRID_SIZE) * GRID_SIZE) %
                            GRID_SIZE)
                        }
                        width={1}
                        height={1}
                        fill={gridDotColor}
                      />
                    )
                  )
              )}
            </Group>
          )}

          <Group scaleX={zoom / 100} scaleY={zoom / 100} x={pan.x} y={pan.y}>
            {currentPage.elements.map((element) => {
              if (!element.visible) return null;

              const commonProps = {
                key: element.id,
                id: element.id,
                x: element.transform.x,
                y: element.transform.y,
                width: element.transform.width,
                height: element.transform.height,
                rotation: element.transform.rotation,
                opacity: element.transform.opacity,
                scaleX: element.transform.scaleX || 1,
                scaleY: element.transform.scaleY || 1,
                draggable: tool === "select" && !element.locked,
                onClick: (e: any) => handleElementClick(e, element.id),
                onDragStart:
                  tool === "select" && !element.locked
                    ? (e: any) => {
                        // Prevent event bubbling
                        e.cancelBubble = true;
                      }
                    : undefined,
                onDragMove:
                  tool === "select" && !element.locked
                    ? (e: any) => {
                        // Konva handles the visual update automatically
                        // We don't update React/Zustand state here - only on dragEnd
                        // This prevents re-renders during drag for smooth performance
                      }
                    : undefined,
                onDragEnd:
                  tool === "select" && !element.locked
                    ? (e: any) => handleElementDragEnd(e, element.id)
                    : undefined,
                fill:
                  element.fill.type === "solid"
                    ? element.fill.color
                    : undefined,
                stroke: element.stroke?.color,
                strokeWidth: element.stroke?.width || 0,
                shadowEnabled: element.shadow?.enabled,
                shadowColor: element.shadow?.color,
                shadowBlur: element.shadow?.blur,
                shadowOffsetX: element.shadow?.offsetX,
                shadowOffsetY: element.shadow?.offsetY,
              };

              if (element.type === "rectangle" || element.type === "frame")
                return <ShapeRect {...commonProps} element={element} />;
              if (element.type === "ellipse")
                return <ShapeEllipse {...commonProps} element={element} />;
              if (element.type === "star")
                return <ShapeStar {...commonProps} element={element} />;
              if (element.type === "line")
                return <ShapeLine {...commonProps} element={element} />;
              if (element.type === "text")
                return (
                  <ShapeText
                    {...commonProps}
                    element={element}
                    onDoubleClick={() => handleTextDoubleClick(element.id)}
                  />
                );
              if (element.type === "image")
                return <ShapeImage {...commonProps} element={element} />;
              return null;
            })}

            {selectionRect && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(13, 153, 255, 0.1)"
                stroke="#0D99FF"
                strokeWidth={1}
                listening={false}
              />
            )}
          </Group>

          <Transformer
            ref={transformerRef}
            onTransformEnd={handleTransformEnd}
            anchorSize={8}
            anchorCornerRadius={4}
            borderStroke="#0D99FF"
            anchorStroke="#0D99FF"
            anchorFill="#FFFFFF"
          />
        </Layer>
      </Stage>

      {/* Text Editing Overlay */}
      {editingTextId && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleTextEditComplete();
            }
          }}
        >
          <div
            className="bg-popover border border-border rounded-lg p-4 min-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={textInputRef}
              type="text"
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onBlur={handleTextEditComplete}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextEditComplete();
                }
                if (e.key === "Escape") {
                  setEditingTextId(null);
                  setEditingTextValue("");
                }
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              placeholder="Enter text..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
