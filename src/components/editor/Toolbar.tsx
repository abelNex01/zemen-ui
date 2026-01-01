// Bottom toolbar with design tools
import React, { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import {
  MousePointer2,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Ruler,
  Undo2,
  Redo2,
  Save,
  Star,
  Minus,
  ChevronDown,
  Shapes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const shapeTools = [
  { id: "rectangle" as const, icon: Square, label: "Rectangle" },
  { id: "ellipse" as const, icon: Circle, label: "Circle" },
  { id: "star" as const, icon: Star, label: "Star" },
  { id: "line" as const, icon: Minus, label: "Line" },
];

const tools = [
  { id: "select" as const, icon: MousePointer2, label: "Select" },
  { id: "frame" as const, icon: Square, label: "Frame" },
  { id: "text" as const, icon: Type, label: "Text" },
  { id: "image" as const, icon: ImageIcon, label: "Image" },
  { id: "hand" as const, icon: Hand, label: "Hand" },
];

export default function Toolbar() {
  const isMobile = useIsMobile();
  const {
    tool,
    zoom,
    gridVisible,
    rulersVisible,
    setTool,
    setZoom,
    toggleGrid,
    toggleRulers,
    project,
    saveProject,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const currentShapeTool =
    shapeTools.find((st) => st.id === tool) || shapeTools[0];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-secondary/90 backdrop-blur-md rounded-lg border border-border shadow-2xl">
      {/* Tools Group */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        {tools.map((toolItem) => {
          const Icon = toolItem.icon;
          const isActive = tool === toolItem.id;
          return (
            <Button
              key={toolItem.id}
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 w-10 p-0 rounded-lg transition-all hover:bg-white/10",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-muted-foreground"
              )}
              onClick={() => setTool(toolItem.id)}
              title={toolItem.label}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}

        {/* Shape Dropdown */}
        <DropdownMenu
          open={shapeDropdownOpen}
          onOpenChange={setShapeDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 w-10 p-0 rounded-lg transition-all hover:bg-white/10",
                ["rectangle", "ellipse", "star", "line"].includes(tool)
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-muted-foreground"
              )}
              title="Shapes"
            >
              <div className="relative w-5 h-5">
                <currentShapeTool.icon className="w-5 h-5" />
                <ChevronDown className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="bg-popover border-border text-popover-foreground min-w-[140px]"
          >
            {shapeTools.map((shapeTool) => {
              const Icon = shapeTool.icon;
              const isActive = tool === shapeTool.id;
              return (
                <DropdownMenuItem
                  key={shapeTool.id}
                  onClick={() => {
                    setTool(shapeTool.id);
                    setShapeDropdownOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    isActive && "bg-primary/20 text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{shapeTool.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-1 px-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Zoom & View Group */}
      <div className="flex items-center gap-1 pl-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg",
            gridVisible && "bg-muted text-foreground"
          )}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 ml-1 border border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(Math.max(10, zoom - 10))}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[10px] font-medium w-8 text-center text-muted-foreground">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(Math.min(500, zoom + 10))}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
