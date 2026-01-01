// Figma-like project start screen
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  File,
  FolderOpen,
  Plus,
  Clock,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getRecentProjects,
  deleteProject,
  duplicateProject,
  renameProject,
  loadProject,
  loadAutosave,
  clearAutosave,
  ProjectMetadata,
} from "@/lib/project-storage";
import { useEditorStore } from "@/store/editor-store";
import { importFromFile } from "@/lib/file-system";
import { formatDistanceToNow } from "date-fns";

export function ProjectStartScreen() {
  const [, navigate] = useLocation();
  const { createProject, loadProject: loadProjectToStore } = useEditorStore();

  const [recentProjects, setRecentProjects] = useState<ProjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    projectId: string | null;
  }>({
    open: false,
    projectId: null,
  });
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    project: ProjectMetadata | null;
  }>({
    open: false,
    project: null,
  });
  const [newName, setNewName] = useState("");

  // Load recent projects
  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    setIsLoading(true);
    try {
      const projects = await getRecentProjects(20);
      setRecentProjects(projects);
    } catch (error) {
      console.error("Failed to load recent projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for autosave on mount
  useEffect(() => {
    checkAutosave();
  }, []);

  const checkAutosave = async () => {
    try {
      const autosave = await loadAutosave();
      if (autosave) {
        // Show option to recover autosave
        const shouldRecover = window.confirm(
          "Found an unsaved project. Would you like to recover it?"
        );
        if (shouldRecover) {
          await loadProjectToStore(autosave);
          navigate("/pro");
        } else {
          await clearAutosave();
        }
      }
    } catch (error) {
      console.error("Failed to check autosave:", error);
    }
  };

  const handleNewProject = () => {
    createProject(projectName);
    setShowNewDialog(false);
    setProjectName("Untitled Project");
    navigate("/pro");
  };

  const handleOpenProject = async (projectId: string) => {
    try {
      const project = await loadProject(projectId);
      if (project) {
        await loadProjectToStore(project);
        navigate("/pro");
      }
    } catch (error) {
      console.error("Failed to open project:", error);
      alert("Failed to open project. Please try again.");
    }
  };

  const handleImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".uix,application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const project = await importFromFile(file);
          await loadProjectToStore(project);
          navigate("/pro");
        } catch (error) {
          console.error("Failed to import project:", error);
          alert(
            "Failed to import project file. Please make sure it is a valid .uix file."
          );
        }
      }
    };
    input.click();
  };

  const handleDelete = async () => {
    if (!deleteDialog.projectId) return;

    try {
      await deleteProject(deleteDialog.projectId);
      await loadRecentProjects();
      setDeleteDialog({ open: false, projectId: null });
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      const duplicated = await duplicateProject(projectId);
      await loadProjectToStore(duplicated);
      await loadRecentProjects();
      navigate("/pro");
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      alert("Failed to duplicate project. Please try again.");
    }
  };

  const handleRename = async () => {
    if (!renameDialog.project || !newName.trim()) return;

    try {
      await renameProject(renameDialog.project.id, newName.trim());
      await loadRecentProjects();
      setRenameDialog({ open: false, project: null });
      setNewName("");
    } catch (error) {
      console.error("Failed to rename project:", error);
      alert("Failed to rename project. Please try again.");
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="w-full">
      {/* New File Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            onClick={() => setShowNewDialog(true)}
            size="lg"
            className="h-16 text-lg font-semibold"
            icon={<Plus className="w-5 h-5" />}
          >
            New File
          </Button>
          <Button
            onClick={handleImportFile}
            variant="outline"
            size="lg"
            className="h-16 text-lg font-semibold"
            icon={<FolderOpen className="w-5 h-5" />}
          >
            Open File...
          </Button>
        </div>
      </motion.div>

      {/* Recent Files Section */}
      {recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Recent Files</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (confirm("Clear all recent projects from this list?")) {
                  // Note: This doesn't delete projects, just clears the recent list
                  await loadRecentProjects();
                }
              }}
            >
              Clear
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-muted/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted/30 relative overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm truncate flex-1">
                        {project.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(project.id);
                            }}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameDialog({ open: true, project });
                              setNewName(project.name);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(project.id);
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({
                                open: true,
                                projectId: project.id,
                              });
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </div>
                      <div>
                        {project.pageCount} page
                        {project.pageCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && recentProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            No recent projects
          </p>
          <p className="text-sm text-muted-foreground">
            Create a new file to get started
          </p>
        </motion.div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new design project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Project Name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNewProject();
                  }
                }}
                autoFocus
                placeholder="Untitled Project"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleNewProject}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, projectId: deleteDialog.projectId })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog({ open, project: renameDialog.project })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Project Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRenameDialog({ open: false, project: null })}
              >
                Cancel
              </Button>
              <Button onClick={handleRename}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
