// Main UI Editor page - Figma-style design editor
import React, { useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import CanvasEditor from "@/components/editor/CanvasEditor";
import LayersPanel from "@/components/editor/LayersPanel";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import Toolbar from "@/components/editor/Toolbar";
import { EditorErrorBoundary } from "@/components/editor/ErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  exportToFile,
  saveWithFileSystemAccess,
  loadWithFileSystemAccess,
  importFromFile,
  exportCanvas,
  ExportFormat,
} from "@/lib/file-system";
import {
  saveProject as saveProjectToStorage,
  saveAutosave,
  loadAutosave,
  clearAutosave,
  generateThumbnail,
  saveThumbnail,
} from "@/lib/project-storage";
import { useProAccess } from "@/hooks/use-pro-access";
import { useLocation } from "wouter";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Menu,
  X,
  Play,
  File,
  FolderOpen,
  Save,
  Download,
  FileText,
} from "lucide-react";
import Konva from "konva";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function UIEditor() {
  const isMobile = useIsMobile();
  const { isPro, daysRemaining } = useProAccess();
  const [, navigate] = useLocation();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [leftPanelOpen, setLeftPanelOpen] = useState(!isMobile);
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);
  const [stageRef, setStageRef] = useState<Konva.Stage | null>(null);

  const calculateCanvasSize = useCallback(() => {
    // Canvas takes full window size in this new layout
    return {
      width: Math.max(100, window.innerWidth),
      height: Math.max(100, window.innerHeight),
    };
  }, []);

  const [canvasSize, setCanvasSize] = useState(() => {
    return {
      width: Math.max(100, window.innerWidth),
      height: Math.max(100, window.innerHeight),
    };
  });

  const { project, createProject, loadProject, currentPageId, saveProject } =
    useEditorStore();

  // Initialize canvas size
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize(calculateCanvasSize());
    };

    // Initial size
    updateSize();

    // Update on resize
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [calculateCanvasSize]);

  // Load autosaved project on mount
  useEffect(() => {
    if (!project) {
      // Try to load autosave first (unsaved work)
      loadAutosave().then(async (autosave) => {
        if (autosave) {
          await loadProject(autosave, true);
        } else {
          // No autosave, create default project
          createProject("Untitled Project");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup autosave (every 30 seconds) and save on changes
  useEffect(() => {
    if (!project) return;

    // Debounced save function
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = async () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        await saveProject();
        await saveAutosave(project);
        
        // Generate and save thumbnail
        try {
          const thumbnail = await generateThumbnail(project, currentPageId || undefined);
          if (thumbnail) {
            await saveThumbnail(project.id, thumbnail);
          }
        } catch (error) {
          console.error("Failed to generate thumbnail:", error);
        }
      }, 2000); // Save 2 seconds after last change
    };

    const autosaveInterval = setInterval(() => {
      saveAutosave(project);
    }, 30000); // 30 seconds

    // Also save on beforeunload
    const handleBeforeUnload = () => {
      clearTimeout(saveTimeout);
      saveAutosave(project);
      saveProject();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Save on project changes (debounced)
    debouncedSave();

    return () => {
      clearTimeout(saveTimeout);
      clearInterval(autosaveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [project, currentPageId, saveProject]);

  // Allow access to editor (no pro requirement for now)
  // Users can access the editor from the home page

  const handleNewProject = async () => {
    createProject(projectName);
    setShowNewProjectDialog(false);
    setProjectName("Untitled Project");
    
    // Save the new project
    await saveProject();
  };

  // File operations
  const handleSave = async () => {
    if (!project) return;
    try {
      // Save to IndexedDB via store (which also saves session)
      await saveProject();
      
      // Also save to file system if supported
      await saveWithFileSystemAccess(project);
      
      // Clear autosave since we've saved
      await clearAutosave();
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleSaveAs = async () => {
    if (!project) return;
    try {
      // Save to IndexedDB via store
      await saveProject();
      
      // Export to file
      exportToFile(project);
      
      // Clear autosave since we've saved
      await clearAutosave();
    } catch (error) {
      console.error("Failed to save as:", error);
    }
  };

  const handleOpen = async () => {
    try {
      let loadedProject;

      // Try File System Access API first
      if ("showOpenFilePicker" in window) {
        loadedProject = await loadWithFileSystemAccess();
      }

      // Fallback to file input
      if (!loadedProject) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".uix,application/json";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            try {
              const importedProject = await importFromFile(file);
              // Save the imported project to IndexedDB
              await saveProjectToStorage(importedProject);
              // Load it into the editor with session restore
              await loadProject(importedProject);
            } catch (error) {
              console.error("Failed to load project:", error);
              alert(
                "Failed to load project file. Please make sure it is a valid .uix file."
              );
            }
          }
        };
        input.click();
        return;
      }

      if (loadedProject) {
        // Save the loaded project to IndexedDB
        await saveProjectToStorage(loadedProject);
        // Load it into the editor with session restore
        await loadProject(loadedProject);
      }
    } catch (error) {
      console.error("Failed to open:", error);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!stageRef || !project || !currentPageId) {
      alert("Canvas not ready. Please wait a moment and try again.");
      return;
    }

    try {
      // Export does NOT reset editor state - it just exports the canvas
      await exportCanvas(stageRef, format, project, currentPageId);
      setShowExportDialog(false);

      // Export doesn't affect the project state, so we don't need to save
      // The project remains open and editable
    } catch (error: any) {
      console.error("Export failed:", error);
      if (format === "pdf" && error.message?.includes("jspdf")) {
        alert(
          "PDF export requires jsPDF library. PNG/JPG/SVG export is available."
        );
      } else {
        alert(
          `Failed to export as ${format.toUpperCase()}. ${error.message || ""}`
        );
      }
    }
  };

  // Keyboard shortcuts are handled by useKeyboardShortcuts hook

  // Editor is now accessible to all users

  if (!project && canvasSize.width === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Initializing editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <EditorErrorBoundary>
        <div className="h-screen w-screen bg-background overflow-hidden relative text-foreground">
          {/* Top Floating Bar - Figma Style */}
          <div className="absolute top-0 left-0 right-0 z-50 h-[48px] bg-secondary border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-foreground hover:bg-muted"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              >
                <Menu className="w-4 h-4" />
              </Button>

              {/* File Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-foreground hover:bg-muted text-xs font-medium"
                  >
                    File
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 bg-popover border-border text-popover-foreground"
                >
                  <DropdownMenuItem
                    onClick={() => setShowNewProjectDialog(true)}
                    className="focus:bg-muted cursor-pointer"
                  >
                    <File className="w-4 h-4 mr-2" />
                    New Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleOpen}
                    className="focus:bg-muted cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={handleSave}
                    className="focus:bg-muted cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSaveAs}
                    className="focus:bg-muted cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save As...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="focus:bg-muted cursor-pointer">
                      <Download className="w-4 h-4 mr-2" />
                      Export As
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border-border">
                      <DropdownMenuItem
                        onClick={() => handleExport("png")}
                        className="focus:bg-muted cursor-pointer"
                      >
                        PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport("jpg")}
                        className="focus:bg-muted cursor-pointer"
                      >
                        JPG
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport("svg")}
                        className="focus:bg-muted cursor-pointer"
                      >
                        SVG
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport("pdf")}
                        className="focus:bg-muted cursor-pointer"
                      >
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <h1 className="text-sm font-medium text-foreground">
                {project?.name || "Untitled"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Play button removed per user request */}
              <ThemeToggle />
            </div>
          </div>

          {/* Left Panel - Layers */}
          <div
            className={`absolute top-[49px] left-0 bottom-0 z-40 bg-secondary border-r border-border transition-all duration-300 ${
              leftPanelOpen ? "w-[240px]" : "w-0 overflow-hidden"
            }`}
          >
            <LayersPanel />
          </div>

          {/* Canvas - Full Screen underneath */}
          <div className="absolute inset-0 z-0 pt-[48px]">
            {canvasSize.width > 0 && canvasSize.height > 0 ? (
              <CanvasEditor
                width={canvasSize.width}
                height={canvasSize.height}
                onStageReady={setStageRef}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Loading canvas...
              </div>
            )}
          </div>

          {/* Right Panel - Properties */}
          <div
            className={`absolute top-[49px] right-0 bottom-0 z-40 bg-secondary border-l border-border transition-all duration-300 ${
              rightPanelOpen ? "w-[280px]" : "w-0 overflow-hidden"
            }`}
          >
            <PropertiesPanel />
          </div>

          {/* Floating Toolbar - Bottom Center */}
          <Toolbar />

          {/* New Project Dialog */}
          <Dialog
            open={showNewProjectDialog}
            onOpenChange={setShowNewProjectDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNewProject();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewProjectDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleNewProject}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Dialog (Optional - for future use) */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Project</DialogTitle>
                <DialogDescription>
                  Choose a format to export your design
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button
                  variant="outline"
                  onClick={() => handleExport("png")}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("jpg")}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  JPG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("svg")}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  SVG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </EditorErrorBoundary>
    </DndProvider>
  );
}
