import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

export function useKeyboardShortcuts() {
  const {
    setTool,
    undo,
    redo,
    deleteElement,
    selectedElementIds,
    updateElement,
    _getCurrentPage,
    tool,
    duplicateElement,
    selectAll,
    clearSelection,
  } = useEditorStore();

  const previousToolRef = useRef<string | null>(null);
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Space key - Temporary hand tool (pan) while held
      if (e.key === " " && !isSpacePressedRef.current) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        previousToolRef.current = tool;
        setTool("hand");
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Duplicate - Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedElementIds.length > 0) {
          selectedElementIds.forEach((id) => duplicateElement(id));
        }
        return;
      }

      // Select All - Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Copy - Ctrl/Cmd + C (placeholder for future clipboard support)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // Future: Implement clipboard copy
        return;
      }

      // Paste - Ctrl/Cmd + V (placeholder for future clipboard support)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Future: Implement clipboard paste
        return;
      }

      // Tools - Only switch if not holding modifier keys
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            e.preventDefault();
            setTool("select");
            break;
          case "f":
            e.preventDefault();
            setTool("frame");
            break;
          case "r":
            e.preventDefault();
            setTool("rectangle");
            break;
          case "o":
          case "e": // Support 'e' for ellipse as well
            e.preventDefault();
            setTool("ellipse");
            break;
          case "t":
            e.preventDefault();
            setTool("text");
            break;
          case "i":
            e.preventDefault();
            setTool("image");
            break;
          case "h":
            e.preventDefault();
            setTool("hand");
            break;
        }
      }

      // Escape - Clear selection and switch to select tool
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        setTool("select");
        return;
      }

      // Deletion
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          selectedElementIds.forEach((id) => deleteElement(id));
        }
        return;
      }

      // Nudge (Arrow Keys)
      if (
        selectedElementIds.length > 0 &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const page = _getCurrentPage();

        selectedElementIds.forEach((id) => {
          const element = page?.elements.find((el) => el.id === id);
          if (element) {
            const { x, y } = element.transform;
            let newX = x;
            let newY = y;

            switch (e.key) {
              case "ArrowUp":
                newY -= step;
                break;
              case "ArrowDown":
                newY += step;
                break;
              case "ArrowLeft":
                newX -= step;
                break;
              case "ArrowRight":
                newX += step;
                break;
            }

            updateElement(
              id,
              { transform: { ...element.transform, x: newX, y: newY } },
              true
            );
          }
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release Space key - restore previous tool
      if (e.key === " " && isSpacePressedRef.current) {
        e.preventDefault();
        isSpacePressedRef.current = false;
        if (previousToolRef.current && tool === "hand") {
          setTool(previousToolRef.current as any);
          previousToolRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    setTool,
    undo,
    redo,
    deleteElement,
    selectedElementIds,
    updateElement,
    _getCurrentPage,
    tool,
    duplicateElement,
    selectAll,
    clearSelection,
  ]);
}
