// Left sidebar - Layers and Pages panel
import React, { useState } from "react";
import { useEditorStore } from "@/store/editor-store";
import { Element } from "@/types/editor";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Layers as LayersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDrag, useDrop } from "react-dnd";

interface LayerItemProps {
  element: Element;
  index: number; // Global index in page.elements
  level: number;
  isSelected: boolean;
  onSelect: (id: string, addToSelection?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  moveLayer: (dragIndex: number, hoverIndex: number) => void;
}

function LayerItem({
  element,
  index,
  level,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDelete,
  onDuplicate,
  moveLayer,
}: LayerItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: "LAYER",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveLayer(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "LAYER",
    item: () => ({ id: element.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(element.name);

  const handleRename = () => {
    if (renameValue.trim()) {
      onRename(element.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const getIcon = () => {
    switch (element.type) {
      case "frame":
        return "📐";
      case "rectangle":
        return "▭";
      case "ellipse":
        return "○";
      case "text":
        return "T";
      case "image":
        return "🖼";
      case "group":
        return "📁";
      default:
        return "•";
    }
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
    >
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary"
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(element.id)}
        onDoubleClick={() => setIsRenaming(true)}
      >
        <button
          className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {element.type === "group" ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        <button
          className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleVisibility(element.id);
          }}
        >
          {element.visible ? (
            <Eye className="w-3 h-3 text-current" />
          ) : (
            <EyeOff className="w-3 h-3 text-current opacity-50" />
          )}
        </button>

        <button
          className="w-4 h-4 flex items-center justify-center hover:bg-white/10 rounded"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleLock(element.id);
          }}
        >
          {element.locked ? (
            <Lock className="w-3 h-3 text-current" />
          ) : (
            <Unlock className="w-3 h-3 text-current opacity-30" />
          )}
        </button>

        {isRenaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenameValue(element.name);
                setIsRenaming(false);
              }
            }}
            className="h-5 text-xs px-1 flex-1 bg-background border-border text-foreground focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="text-xs mr-1 opacity-70">{getIcon()}</span>
            <span className="text-xs flex-1 truncate">{element.name}</span>
          </>
        )}

        <div className="flex items-center gap-0.5">
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 rounded text-red-400/70"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LayersPanel() {
  const {
    project,
    currentPageId,
    selectedElementIds,
    _getCurrentPage,
    selectElement,
    updateElement,
    deleteElement,
    duplicateElement,
    createPage,
    deletePage,
    setCurrentPage,
    reorderElement,
    renamePage,
  } = useEditorStore();

  const currentPage = _getCurrentPage();

  const moveLayer = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      // We need to find the element ID at dragIndex in the store's list
      // But dragIndex/hoverIndex passed here are indices in the *full* list if we map 1:1
      // Ideally, we pass the ID.
      // But reorderElement takes (id, newIndex).
      // If we pass global indices, we need to map them back to IDs if needed, or just use indices.

      // Let's rely on the store action taking (id, newIndex).
      // We need the ID of the dragged item.
      // `item` in useDrag has `id` and `index`.
      // Wait, inside `hover` callback in LayerItem, we call `moveLayer(dragIndex, hoverIndex)`.
      // We don't have dragId easily there unless we pass it.
      // Let's assume we can get it from the store using index? No, store updates might lag?
      // Actually, for immediate UI feedback with DnD, we interact with the store.

      const dragId = currentPage?.elements[dragIndex]?.id;
      if (dragId) {
        reorderElement(dragId, hoverIndex);
      }
    },
    [currentPage, reorderElement]
  );
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set([currentPageId || ""])
  );

  const handleToggleVisibility = (id: string) => {
    const element = currentPage?.elements.find((e) => e.id === id);
    if (element) {
      updateElement(id, { visible: !element.visible });
    }
  };

  const handleToggleLock = (id: string) => {
    const element = currentPage?.elements.find((e) => e.id === id);
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  };

  const handleRenameElement = (id: string, name: string) => {
    updateElement(id, { name });
  };

  const renderElements = (
    elements: Element[],
    parentId?: string,
    level = 0
  ): React.ReactNode => {
    // Note: This filtering might mess up index calculation if we used filtered index.
    // We MUST pass the GLOBAL index from the main elements array.

    // Simplification: We iterate over the main array and check parentId to preserve order?
    // No, we want to render strictly hierarchically.
    // If we use reorderElement with global indices, we need to know the global index of each item.

    // Let's create a map of id -> globalIndex first?
    // Or just findIndex inside.

    const filtered = elements.filter((e) => e.parentId === parentId);
    // Reverse to show top layers at top? Usually layers panel shows top-most at top (index 0 or last?).
    // Konva renders 0..N (0 is bottom).
    // Layers Panel usually shows N..0 (top is top).
    // If we reverse, we need to handle indices carefully.
    // For now, let's keep it simple: 0 is top in list = 0 is bottom in Z-index?
    // Standard: Top of list = Top Z-index (last in array).
    // Let's reverse the filtered list for display.

    const displayList = [...filtered].reverse();

    return displayList.map((element) => {
      const globalIndex = elements.findIndex((e) => e.id === element.id);

      return (
        <React.Fragment key={element.id}>
          <LayerItem
            element={element}
            index={globalIndex}
            level={level}
            isSelected={selectedElementIds.includes(element.id)}
            onSelect={selectElement}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onRename={handleRenameElement}
            onDelete={deleteElement}
            onDuplicate={duplicateElement}
            moveLayer={moveLayer}
          />
          {element.type === "group" &&
            renderElements(elements, element.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  if (!project) {
    return (
      <div className="w-full h-full flex flex-col text-zinc-400">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
            <LayersIcon className="w-4 h-4" />
            Layers
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs">
          No project loaded
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col text-muted-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold flex items-center gap-2 text-foreground uppercase tracking-wider">
          Layers
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => createPage(`Page ${project.pages.length + 1}`)}
          title="New Page"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Pages */}
      <div className="border-b border-border bg-muted">
        <ScrollArea className="h-auto max-h-32">
          {project.pages.map((page) => (
            <div
              key={page.id}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                currentPageId === page.id && "bg-muted text-foreground"
              )}
              onClick={() => setCurrentPage(page.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{page.name}</span>
                {project.pages.length > 1 && (
                  <button
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Layers */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {currentPage && currentPage.elements.length > 0 ? (
            renderElements(currentPage.elements)
          ) : (
            <div className="text-center text-xs text-zinc-500 py-8">
              No layers yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
