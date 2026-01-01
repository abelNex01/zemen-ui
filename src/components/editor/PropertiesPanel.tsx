import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";
import { ScrubbableInput } from "@/components/ui/scrubbable-input";
import {
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  RotateCw,
  Minus,
  Plus,
  ChevronDown,
  Play,
  Grid,
  Grid3x3,
  Copy,
  LayoutTemplate,
  Maximize,
  FlipHorizontal,
  FlipVertical,
  Moon,
  Square,
  Lock,
  Eye,
  Droplet,
  MoreVertical,
  HelpCircle,
  RefreshCw,
  Move,
  EyeOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PropertiesPanel() {
  const {
    project,
    selectedElementIds,
    updateElement,
    currentPageId,
    alignElements,
    duplicateElement,
  } = useEditorStore();

  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showStroke, setShowStroke] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const strokeColorInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = project?.pages
    .find((p) => p.id === currentPageId)
    ?.elements.find((e) => e.id === selectedElementIds[0]);

  const updateTransform = (key: string, value: number, commit = false) => {
    if (!selectedElement) return;

    // Handle aspect ratio locking
    if (aspectRatioLocked && (key === "width" || key === "height")) {
      const ratio =
        selectedElement.transform.width / selectedElement.transform.height;
      if (key === "width") {
        updateElement(
          selectedElement.id,
          {
            transform: {
              ...selectedElement.transform,
              width: value,
              height: value / ratio,
            },
          },
          commit
        );
      } else {
        updateElement(
          selectedElement.id,
          {
            transform: {
              ...selectedElement.transform,
              height: value,
              width: value * ratio,
            },
          },
          commit
        );
      }
    } else {
      updateElement(
        selectedElement.id,
        {
          transform: { ...selectedElement.transform, [key]: value },
        },
        commit
      );
    }
  };

  const handleFlipHorizontal = () => {
    if (!selectedElement) return;
    // Flip horizontally using scaleX
    const currentScaleX = selectedElement.transform.scaleX || 1;
    const newScaleX = currentScaleX === -1 ? 1 : -1;
    updateElement(
      selectedElement.id,
      {
        transform: {
          ...selectedElement.transform,
          scaleX: newScaleX,
        },
      },
      true
    );
  };

  const handleFlipVertical = () => {
    if (!selectedElement) return;
    // Flip vertically using scaleY
    const currentScaleY = selectedElement.transform.scaleY || 1;
    const newScaleY = currentScaleY === -1 ? 1 : -1;
    updateElement(
      selectedElement.id,
      {
        transform: {
          ...selectedElement.transform,
          scaleY: newScaleY,
        },
      },
      true
    );
  };

  const handleColorChange = (color: string) => {
    if (!selectedElement) return;
    updateElement(
      selectedElement.id,
      {
        fill: { ...selectedElement.fill, color },
      },
      true
    );
  };

  const handleVisibilityToggle = () => {
    if (!selectedElement) return;
    updateElement(
      selectedElement.id,
      { visible: !selectedElement.visible },
      true
    );
  };

  const handleStrokeToggle = () => {
    if (!selectedElement) return;
    if (showStroke && selectedElement.stroke) {
      updateElement(
        selectedElement.id,
        { stroke: { ...selectedElement.stroke, width: 0 } },
        true
      );
      setShowStroke(false);
    } else {
      updateElement(
        selectedElement.id,
        {
          stroke: selectedElement.stroke || { color: "#000000", width: 1 },
        },
        true
      );
      setShowStroke(true);
    }
  };

  const handleStrokeColorChange = (color: string) => {
    if (!selectedElement) return;
    updateElement(
      selectedElement.id,
      {
        stroke: {
          ...(selectedElement.stroke || { color: "#000000", width: 1 }),
          color,
        },
      },
      true
    );
  };

  const handleStrokeWidthChange = (width: number) => {
    if (!selectedElement) return;
    updateElement(
      selectedElement.id,
      {
        stroke: {
          ...(selectedElement.stroke || { color: "#000000", width: 1 }),
          width: Math.max(0, width),
        },
      },
      true
    );
  };

  const handleShadowToggle = () => {
    if (!selectedElement) return;
    const shadow = selectedElement.shadow || {
      enabled: false,
      color: "#000000",
      blur: 0,
      offsetX: 0,
      offsetY: 0,
    };
    updateElement(
      selectedElement.id,
      {
        shadow: { ...shadow, enabled: !shadow.enabled },
      },
      true
    );
    setShowEffects(shadow.enabled);
  };

  // Initialize showStroke and showEffects based on element state
  useEffect(() => {
    if (selectedElement) {
      setShowStroke(
        selectedElement.stroke ? selectedElement.stroke.width > 0 : false
      );
      setShowEffects(
        selectedElement.shadow ? selectedElement.shadow.enabled : false
      );
    }
  }, [selectedElement]);

  const handleResetRotation = () => {
    if (!selectedElement) return;
    updateTransform("rotation", 0, true);
  };

  if (!selectedElement) {
    return (
      <div className="w-[280px] bg-secondary border-l border-border flex flex-col h-full text-muted-foreground">
        <TopHeader />
        <div className="flex-1 flex items-center justify-center flex-col gap-2 p-4 text-center">
          <LayoutTemplate className="w-10 h-10 opacity-20" />
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-secondary border-l border-border flex flex-col h-full text-foreground font-sans shrink-0">
      <TopHeader />

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-3 py-4 flex flex-col gap-6">
            {/* Group Header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer">
                {selectedElement.name || "Group"}{" "}
                <ChevronDown className="w-3 h-3" />
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Toggle grid snap
                    useEditorStore.getState().toggleSnapToGrid();
                  }}
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer",
                    useEditorStore.getState().snapToGrid && "text-foreground"
                  )}
                  title="Snap to Grid"
                >
                  <Grid3x3 className="w-full h-full" />
                </button>
                <button
                  onClick={() => duplicateElement(selectedElement.id)}
                  className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Duplicate"
                >
                  <Grid className="w-full h-full" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    // Lock/unlock element
                    updateElement(
                      selectedElement.id,
                      { locked: !selectedElement.locked },
                      true
                    );
                  }}
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer",
                    selectedElement.locked && "text-foreground"
                  )}
                  title={selectedElement.locked ? "Unlock" : "Lock"}
                >
                  <Lock
                    className={cn(
                      "w-full h-full",
                      selectedElement.locked && "fill-current"
                    )}
                  />
                </button>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Position Section */}
            <div className="flex flex-col gap-3">
              <SectionLabel label="Position" />

              {/* Alignment */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Alignment
                </span>
                <div className="flex items-center justify-between">
                  <IconButton
                    icon={AlignLeft}
                    onClick={() => alignElements("left")}
                  />
                  <IconButton
                    icon={AlignCenterHorizontal}
                    onClick={() => alignElements("center")}
                  />
                  <IconButton
                    icon={AlignRight}
                    onClick={() => alignElements("right")}
                  />
                  <IconButton
                    icon={AlignStartVertical}
                    onClick={() => alignElements("top")}
                  />
                  <IconButton
                    icon={AlignCenterVertical}
                    onClick={() => alignElements("middle")}
                  />
                  <IconButton
                    icon={AlignEndVertical}
                    onClick={() => alignElements("bottom")}
                  />
                </div>
              </div>

              {/* Position X/Y */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Position
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PropInput
                      prefix="X"
                      value={Number(selectedElement.transform.x.toFixed(2))}
                      onChange={(v) => updateTransform("x", v)}
                      onCommit={(v) => updateTransform("x", v, true)}
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <PropInput
                      prefix="Y"
                      value={Number(selectedElement.transform.y.toFixed(2))}
                      onChange={(v) => updateTransform("y", v)}
                      onCommit={(v) => updateTransform("y", v, true)}
                    />
                    <button className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer shrink-0">
                      <Move className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Rotation
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <PropInput
                      icon={<RotateCw className="w-3 h-3" />}
                      value={Number(
                        selectedElement.transform.rotation.toFixed(2)
                      )}
                      suffix="°"
                      onChange={(v) => updateTransform("rotation", v)}
                      onCommit={(v) => updateTransform("rotation", v, true)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleResetRotation}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleFlipVertical}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FlipVertical className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleFlipHorizontal}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Layout Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel label="Layout" />
              </div>

              {/* Flow - Auto Layout (simplified for now) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Flow
                </span>
                <div className="flex items-center gap-1">
                  <div className="flex-1 flex bg-muted rounded-md p-0.5 gap-0.5">
                    <FlowButton
                      active
                      onClick={() => {
                        // Auto layout: horizontal
                        // This is a placeholder for future auto-layout functionality
                      }}
                    />
                    <FlowButton
                      onClick={() => {
                        // Auto layout: vertical
                      }}
                    />
                    <FlowButton
                      onClick={() => {
                        // Auto layout: wrap
                      }}
                    />
                    <FlowButton
                      onClick={() => {
                        // Auto layout: none
                      }}
                    />
                  </div>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Add constraint"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dimensions */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Dimensions
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PropInput
                      prefix="W"
                      value={Number(selectedElement.transform.width.toFixed(2))}
                      onChange={(v) => updateTransform("width", v)}
                      onCommit={(v) => updateTransform("width", v, true)}
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <PropInput
                      prefix="H"
                      value={Number(
                        selectedElement.transform.height.toFixed(2)
                      )}
                      onChange={(v) => updateTransform("height", v)}
                      onCommit={(v) => updateTransform("height", v, true)}
                    />
                    <button
                      onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                      className={cn(
                        "w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer shrink-0 transition-colors",
                        aspectRatioLocked && "text-white"
                      )}
                    >
                      <Lock
                        className={cn(
                          "w-3.5 h-3.5",
                          aspectRatioLocked && "fill-current"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Text Section - Only show for text elements */}
            {selectedElement.type === "text" && (
              <>
                <div className="flex flex-col gap-3">
                  <SectionLabel label="Text" />

                  {/* Font Family */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Font family
                    </span>
                    <select
                      value={
                        (selectedElement as any).style?.fontFamily ||
                        "Inter, sans-serif"
                      }
                      onChange={(e) =>
                        updateElement(
                          selectedElement.id,
                          {
                            style: {
                              ...(selectedElement as any).style,
                              fontFamily: e.target.value,
                            },
                          } as any,
                          true
                        )
                      }
                      className="w-full h-7 px-2 text-xs bg-muted border border-transparent hover:border-border focus:border-primary rounded text-foreground focus:outline-none"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Times New Roman, serif">
                        Times New Roman
                      </option>
                      <option value="Courier New, monospace">
                        Courier New
                      </option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Font size
                    </span>
                    <PropInput
                      prefix="S"
                      value={Number(
                        (
                          (selectedElement as any).style?.fontSize || 16
                        ).toFixed(0)
                      )}
                      onChange={(v) =>
                        updateElement(selectedElement.id, {
                          style: {
                            ...(selectedElement as any).style,
                            fontSize: Math.max(1, v),
                          },
                        } as any)
                      }
                      onCommit={(v) =>
                        updateElement(
                          selectedElement.id,
                          {
                            style: {
                              ...(selectedElement as any).style,
                              fontSize: Math.max(1, v),
                            },
                          } as any,
                          true
                        )
                      }
                    />
                  </div>

                  {/* Font Weight */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Font weight
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 flex bg-muted rounded-md p-0.5 gap-0.5">
                        <button
                          onClick={() =>
                            updateElement(
                              selectedElement.id,
                              {
                                style: {
                                  ...(selectedElement as any).style,
                                  fontWeight: 400,
                                },
                              } as any,
                              true
                            )
                          }
                          className={cn(
                            "flex-1 h-6 rounded text-[10px] transition-colors",
                            (selectedElement as any).style?.fontWeight === 400
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          Regular
                        </button>
                        <button
                          onClick={() =>
                            updateElement(
                              selectedElement.id,
                              {
                                style: {
                                  ...(selectedElement as any).style,
                                  fontWeight: 600,
                                },
                              } as any,
                              true
                            )
                          }
                          className={cn(
                            "flex-1 h-6 rounded text-[10px] transition-colors",
                            (selectedElement as any).style?.fontWeight === 600
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          Semibold
                        </button>
                        <button
                          onClick={() =>
                            updateElement(
                              selectedElement.id,
                              {
                                style: {
                                  ...(selectedElement as any).style,
                                  fontWeight: 700,
                                },
                              } as any,
                              true
                            )
                          }
                          className={cn(
                            "flex-1 h-6 rounded text-[10px] transition-colors",
                            (selectedElement as any).style?.fontWeight === 700
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          Bold
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Text Align */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Text align
                    </span>
                    <div className="flex items-center justify-between">
                      <IconButton
                        icon={AlignLeft}
                        onClick={() =>
                          updateElement(
                            selectedElement.id,
                            {
                              style: {
                                ...(selectedElement as any).style,
                                textAlign: "left",
                              },
                            } as any,
                            true
                          )
                        }
                      />
                      <IconButton
                        icon={AlignCenterHorizontal}
                        onClick={() =>
                          updateElement(
                            selectedElement.id,
                            {
                              style: {
                                ...(selectedElement as any).style,
                                textAlign: "center",
                              },
                            } as any,
                            true
                          )
                        }
                      />
                      <IconButton
                        icon={AlignRight}
                        onClick={() =>
                          updateElement(
                            selectedElement.id,
                            {
                              style: {
                                ...(selectedElement as any).style,
                                textAlign: "right",
                              },
                            } as any,
                            true
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Line height
                    </span>
                    <PropInput
                      prefix="L"
                      value={Number(
                        (
                          ((selectedElement as any).style?.lineHeight || 1.5) *
                          100
                        ).toFixed(0)
                      )}
                      suffix="%"
                      onChange={(v) =>
                        updateElement(selectedElement.id, {
                          style: {
                            ...(selectedElement as any).style,
                            lineHeight: v / 100,
                          },
                        } as any)
                      }
                      onCommit={(v) =>
                        updateElement(
                          selectedElement.id,
                          {
                            style: {
                              ...(selectedElement as any).style,
                              lineHeight: v / 100,
                            },
                          } as any,
                          true
                        )
                      }
                    />
                  </div>

                  {/* Letter Spacing */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Letter spacing
                    </span>
                    <PropInput
                      prefix="LS"
                      value={Number(
                        (
                          ((selectedElement as any).style?.letterSpacing || 0) *
                          100
                        ).toFixed(0)
                      )}
                      suffix="%"
                      onChange={(v) =>
                        updateElement(selectedElement.id, {
                          style: {
                            ...(selectedElement as any).style,
                            letterSpacing: v / 100,
                          },
                        } as any)
                      }
                      onCommit={(v) =>
                        updateElement(
                          selectedElement.id,
                          {
                            style: {
                              ...(selectedElement as any).style,
                              letterSpacing: v / 100,
                            },
                          } as any,
                          true
                        )
                      }
                    />
                  </div>
                </div>
                <Separator className="bg-border" />
              </>
            )}

            {/* Appearance Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel label="Appearance" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleVisibilityToggle}
                    className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer"
                    title={selectedElement.visible ? "Hide" : "Show"}
                  >
                    {selectedElement.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer"
                    title="Fill color"
                  >
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Opacity */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Opacity
                  </span>
                  <PropInput
                    icon={<Square className="w-3 h-3 opacity-50" />}
                    value={Number(
                      (selectedElement.transform.opacity * 100).toFixed(0)
                    )}
                    suffix="%"
                    onChange={(v) => updateTransform("opacity", v / 100)}
                    onCommit={(v) => updateTransform("opacity", v / 100, true)}
                  />
                </div>

                {/* Corner radius */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Corner radius
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
                      <PropInput
                        icon={
                          <Square
                            className="w-3 h-3"
                            style={{ borderRadius: "2px" }}
                          />
                        }
                        value={Number(
                          (selectedElement.borderRadius || 0).toFixed(2)
                        )}
                        onChange={(v) =>
                          updateElement(selectedElement.id, { borderRadius: v })
                        }
                        onCommit={(v) =>
                          updateElement(
                            selectedElement.id,
                            { borderRadius: v },
                            true
                          )
                        }
                      />
                    </div>
                    <button className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer shrink-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Fill Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between group">
                <SectionLabel label="Fill" />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer">
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 group cursor-pointer hover:bg-muted p-1 -mx-1 rounded">
                    <div
                      className="w-4 h-4 rounded-sm border border-white/20 shrink-0"
                      style={{ backgroundColor: selectedElement.fill.color }}
                    />
                    <span className="text-xs text-zinc-300 flex-1">
                      {selectedElement.fill.color.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                      <span className="text-xs text-zinc-500">100%</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorChange("#00000000");
                        }}
                        className="w-3.5 h-3.5 flex items-center justify-center text-zinc-500 hover:text-white"
                        title="Remove fill"
                      >
                        <X className="w-full h-full" />
                      </button>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-popover border-border">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={selectedElement.fill.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-8 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.fill.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full mt-2 px-2 py-1 text-xs bg-background border border-border rounded text-foreground"
                    placeholder="#000000"
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedElement.fill.type === "solid"}
                  onChange={(e) => {
                    updateElement(
                      selectedElement.id,
                      {
                        fill: {
                          type: e.target.checked ? "solid" : "gradient",
                          color: selectedElement.fill.color,
                        },
                      },
                      true
                    );
                  }}
                  className="w-3.5 h-3.5 rounded-sm bg-muted border-border checked:bg-primary cursor-pointer"
                />
                <span className="text-xs text-zinc-400">Show in exports</span>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Stroke Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 group cursor-pointer hover:bg-muted -mx-1 px-1 rounded">
                <SectionLabel label="Stroke" />
                <button
                  onClick={handleStrokeToggle}
                  className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title={showStroke ? "Remove stroke" : "Add stroke"}
                >
                  {showStroke ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {showStroke && selectedElement.stroke && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Popover
                      open={showStrokeColorPicker}
                      onOpenChange={setShowStrokeColorPicker}
                    >
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                          <div
                            className="w-4 h-4 rounded-sm border border-white/20 shrink-0"
                            style={{
                              backgroundColor:
                                selectedElement.stroke?.color || "#000000",
                            }}
                          />
                          <span className="text-xs text-zinc-300">
                            {selectedElement.stroke?.color.toUpperCase() ||
                              "#000000"}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 bg-popover border-border">
                        <input
                          ref={strokeColorInputRef}
                          type="color"
                          value={selectedElement.stroke?.color || "#000000"}
                          onChange={(e) =>
                            handleStrokeColorChange(e.target.value)
                          }
                          className="w-full h-8 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedElement.stroke?.color || "#000000"}
                          onChange={(e) =>
                            handleStrokeColorChange(e.target.value)
                          }
                          className="w-full mt-2 px-2 py-1 text-xs bg-background border border-border rounded text-foreground"
                          placeholder="#000000"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <PropInput
                    prefix="W"
                    value={Number(
                      (selectedElement.stroke?.width || 0).toFixed(2)
                    )}
                    onChange={(v) => handleStrokeWidthChange(v)}
                    onCommit={(v) => handleStrokeWidthChange(v)}
                  />
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* Effects Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 group cursor-pointer hover:bg-muted -mx-1 px-1 rounded">
                <div className="flex items-center gap-1">
                  <SectionLabel label="Effects" />
                  <button
                    className="w-3 h-3 flex items-center justify-center text-zinc-500 hover:text-white"
                    title="Effects help"
                  >
                    <HelpCircle className="w-full h-full" />
                  </button>
                </div>
                <button
                  onClick={handleShadowToggle}
                  className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title={showEffects ? "Remove shadow" : "Add shadow"}
                >
                  {showEffects ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {showEffects && selectedElement.shadow && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.shadow.color || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          shadow: {
                            ...selectedElement.shadow!,
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-6 cursor-pointer rounded border border-border"
                    />
                    <span className="text-xs text-zinc-400">Shadow color</span>
                  </div>
                  <PropInput
                    prefix="B"
                    value={Number(
                      (selectedElement.shadow?.blur || 0).toFixed(2)
                    )}
                    onChange={(v) =>
                      updateElement(selectedElement.id, {
                        shadow: {
                          ...selectedElement.shadow!,
                          blur: Math.max(0, v),
                        },
                      })
                    }
                    onCommit={(v) =>
                      updateElement(
                        selectedElement.id,
                        {
                          shadow: {
                            ...selectedElement.shadow!,
                            blur: Math.max(0, v),
                          },
                        },
                        true
                      )
                    }
                  />
                  <div className="flex items-center gap-2">
                    <PropInput
                      prefix="X"
                      value={Number(
                        (selectedElement.shadow?.offsetX || 0).toFixed(2)
                      )}
                      onChange={(v) =>
                        updateElement(selectedElement.id, {
                          shadow: {
                            ...selectedElement.shadow!,
                            offsetX: v,
                          },
                        })
                      }
                      onCommit={(v) =>
                        updateElement(
                          selectedElement.id,
                          {
                            shadow: {
                              ...selectedElement.shadow!,
                              offsetX: v,
                            },
                          },
                          true
                        )
                      }
                    />
                    <PropInput
                      prefix="Y"
                      value={Number(
                        (selectedElement.shadow?.offsetY || 0).toFixed(2)
                      )}
                      onChange={(v) =>
                        updateElement(selectedElement.id, {
                          shadow: {
                            ...selectedElement.shadow!,
                            offsetY: v,
                          },
                        })
                      }
                      onCommit={(v) =>
                        updateElement(
                          selectedElement.id,
                          {
                            shadow: {
                              ...selectedElement.shadow!,
                              offsetY: v,
                            },
                          },
                          true
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* Export Section */}
            <div className="flex items-center justify-between py-1 group cursor-pointer hover:bg-muted -mx-1 px-1 rounded">
              <SectionLabel label="Export" />
              <button className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function TopHeader() {
  const { zoom } = useEditorStore();

  return (
    <div className="flex flex-col bg-secondary shrink-0">
      {/* Top Bar: User, Play, Share */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border border-white/10 shrink-0" />
          <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          <button className="w-3.5 h-3.5 text-zinc-400 hover:text-white cursor-pointer fill-current shrink-0">
            <Play className="w-full h-full" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 pb-2 gap-2 border-b border-border">
        <div className="flex-1 flex bg-muted p-0.5 rounded-md">
          <button className="flex-1 text-[11px] font-medium bg-primary text-primary-foreground rounded-sm py-1 shadow-sm">
            Design
          </button>
          <button className="flex-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 py-1">
            Prototype
          </button>
        </div>
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-zinc-400 font-medium">
            {Math.round(zoom)}%
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <span className="text-xs font-semibold text-white">{label}</span>;
}

function IconButton({
  icon: Icon,
  onClick,
}: {
  icon: any;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#333] text-zinc-400 hover:text-white transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function FlowButton({
  active,
  onClick,
}: {
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-6 rounded flex items-center justify-center transition-colors",
        active
          ? "bg-[#444] text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-[#333]"
      )}
    >
      <Grid3x3 className="w-3.5 h-3.5" />
    </button>
  );
}

function PropInput({
  value,
  onChange,
  onCommit,
  prefix,
  suffix,
  icon,
}: {
  value: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  const label = icon ? (
    <div className="text-zinc-500 group-hover:text-zinc-400 w-5 flex justify-center opacity-80 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
  ) : prefix ? (
    <div className="text-xs font-medium text-zinc-500 group-hover:text-zinc-400 w-5 text-center cursor-ew-resize select-none">
      {prefix}
    </div>
  ) : null;

  return (
    <ScrubbableInput
      value={value}
      onChange={(v, commit) => {
        onChange(v);
        if (commit && onCommit) onCommit(v);
      }}
      label={label}
      suffix={suffix}
      className="bg-muted rounded-md border border-transparent hover:border-border focus-within:border-primary transition-colors"
      inputClassName="bg-transparent border-none p-0 h-7 text-xs text-foreground placeholder:text-muted-foreground focus:ring-0 text-right w-full selection:bg-primary selection:text-primary-foreground"
    />
  );
}
