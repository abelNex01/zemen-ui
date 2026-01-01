// Enhanced project storage system with versioning and session restore
import { get, set, del, keys, clear } from "idb-keyval";
import { Project } from "@/types/editor";

const DB_VERSION = 2;
const PROJECTS_STORE = "uix-projects";
const SESSION_STORE = "uix-session";
const RECENT_STORE = "uix-recent";
const AUTOSAVE_KEY = "uix-autosave";

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  pageCount: number;
  thumbnail?: string; // Base64 thumbnail
}

export interface EditorSession {
  projectId: string | null;
  currentPageId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  selectedElementIds: string[];
  tool: string;
  gridVisible: boolean;
  rulersVisible: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
}

// Save project to IndexedDB
export async function saveProject(project: Project): Promise<void> {
  try {
    // Save full project
    await set(`${PROJECTS_STORE}-${project.id}`, project);

    // Update metadata
    const metadata: ProjectMetadata = {
      id: project.id,
      name: project.name,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
      pageCount: project.pages.length,
    };

    await set(`${PROJECTS_STORE}-meta-${project.id}`, metadata);

    // Update recent projects list
    await addToRecent(project.id);
  } catch (error) {
    console.error("Failed to save project:", error);
    throw error;
  }
}

// Load project from IndexedDB
export async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const project = await get<Project>(`${PROJECTS_STORE}-${projectId}`);
    return project || null;
  } catch (error) {
    console.error("Failed to load project:", error);
    return null;
  }
}

// Get all project metadata
export async function getAllProjects(): Promise<ProjectMetadata[]> {
  try {
    const allKeys = await keys();
    const projectKeys = allKeys.filter(
      (key) =>
        typeof key === "string" && key.startsWith(`${PROJECTS_STORE}-meta-`)
    ) as string[];

    const projects = await Promise.all(
      projectKeys.map(async (key) => {
        const metadata = await get<ProjectMetadata>(key);
        return metadata;
      })
    );

    return projects
      .filter((p): p is ProjectMetadata => p !== undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to get all projects:", error);
    return [];
  }
}

// Get recent projects (last 20)
export async function getRecentProjects(
  limit: number = 20
): Promise<ProjectMetadata[]> {
  try {
    const recentIds = (await get<string[]>(RECENT_STORE)) || [];
    const projects: ProjectMetadata[] = [];

    for (const id of recentIds.slice(0, limit)) {
      const metadata = await get<ProjectMetadata>(
        `${PROJECTS_STORE}-meta-${id}`
      );
      if (metadata) {
        projects.push(metadata);
      }
    }

    return projects;
  } catch (error) {
    console.error("Failed to get recent projects:", error);
    return [];
  }
}

// Add project to recent list
async function addToRecent(projectId: string): Promise<void> {
  try {
    const recentIds = (await get<string[]>(RECENT_STORE)) || [];
    // Remove if already exists
    const filtered = recentIds.filter((id) => id !== projectId);
    // Add to front
    filtered.unshift(projectId);
    // Keep only last 50
    await set(RECENT_STORE, filtered.slice(0, 50));
  } catch (error) {
    console.error("Failed to add to recent:", error);
  }
}

// Delete project
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await del(`${PROJECTS_STORE}-${projectId}`);
    await del(`${PROJECTS_STORE}-meta-${projectId}`);

    // Remove from recent
    const recentIds = (await get<string[]>(RECENT_STORE)) || [];
    await set(
      RECENT_STORE,
      recentIds.filter((id) => id !== projectId)
    );
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

// Duplicate project
export async function duplicateProject(
  projectId: string,
  newName?: string
): Promise<Project> {
  try {
    const project = await loadProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const duplicated: Project = {
      ...project,
      id: generateId(),
      name: newName || `${project.name} Copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(duplicated);
    return duplicated;
  } catch (error) {
    console.error("Failed to duplicate project:", error);
    throw error;
  }
}

// Rename project
export async function renameProject(
  projectId: string,
  newName: string
): Promise<void> {
  try {
    const project = await loadProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    project.name = newName;
    project.updatedAt = Date.now();

    await saveProject(project);
  } catch (error) {
    console.error("Failed to rename project:", error);
    throw error;
  }
}

// Save session state
export async function saveSession(session: EditorSession): Promise<void> {
  try {
    await set(SESSION_STORE, session);
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

// Load session state
export async function loadSession(): Promise<EditorSession | null> {
  try {
    return (await get<EditorSession>(SESSION_STORE)) || null;
  } catch (error) {
    console.error("Failed to load session:", error);
    return null;
  }
}

// Save autosave (temporary backup)
export async function saveAutosave(project: Project): Promise<void> {
  try {
    await set(AUTOSAVE_KEY, project);
  } catch (error) {
    console.error("Failed to save autosave:", error);
  }
}

// Load autosave
export async function loadAutosave(): Promise<Project | null> {
  try {
    return (await get<Project>(AUTOSAVE_KEY)) || null;
  } catch (error) {
    console.error("Failed to load autosave:", error);
    return null;
  }
}

// Clear autosave
export async function clearAutosave(): Promise<void> {
  try {
    await del(AUTOSAVE_KEY);
  } catch (error) {
    console.error("Failed to clear autosave:", error);
  }
}

// Generate thumbnail from project (simple canvas-based preview)
export async function generateThumbnail(
  project: Project,
  currentPageId?: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve("");
      return;
    }

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const page = project.pages.find(
      (p) => p.id === (currentPageId || project.pages[0]?.id)
    );
    if (!page || page.elements.length === 0) {
      // Empty project thumbnail
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#999";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Empty Project", canvas.width / 2, canvas.height / 2);
      resolve(canvas.toDataURL("image/png"));
      return;
    }

    // Calculate bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    page.elements.forEach((el) => {
      if (!el.visible) return;
      minX = Math.min(minX, el.transform.x);
      minY = Math.min(minY, el.transform.y);
      maxX = Math.max(maxX, el.transform.x + el.transform.width);
      maxY = Math.max(maxY, el.transform.y + el.transform.height);
    });

    if (minX === Infinity) {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
      return;
    }

    const width = maxX - minX || 800;
    const height = maxY - minY || 600;
    const scale = Math.min(canvas.width / width, canvas.height / height, 1);
    const offsetX = -minX * scale;
    const offsetY = -minY * scale;

    // Draw elements (simplified)
    page.elements.forEach((el) => {
      if (!el.visible) return;

      const x = el.transform.x * scale + offsetX;
      const y = el.transform.y * scale + offsetY;
      const w = el.transform.width * scale;
      const h = el.transform.height * scale;

      ctx.save();
      ctx.globalAlpha = el.transform.opacity || 1;

      if (el.type === "rectangle" || el.type === "frame") {
        ctx.fillStyle = el.fill.color || "#cccccc";
        ctx.fillRect(x, y, w, h);
        if (el.stroke && el.stroke.width > 0) {
          ctx.strokeStyle = el.stroke.color;
          ctx.lineWidth = el.stroke.width * scale;
          ctx.strokeRect(x, y, w, h);
        }
      } else if (el.type === "ellipse") {
        ctx.fillStyle = el.fill.color || "#cccccc";
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === "text") {
        const textEl = el as any;
        ctx.fillStyle = el.fill.color || "#000000";
        ctx.font = `${(textEl.style?.fontSize || 16) * scale}px ${
          textEl.style?.fontFamily || "sans-serif"
        }`;
        ctx.fillText(
          textEl.content || "Text",
          x,
          y + (textEl.style?.fontSize || 16) * scale
        );
      }

      ctx.restore();
    });

    resolve(canvas.toDataURL("image/png"));
  });
}

// Save thumbnail
export async function saveThumbnail(
  projectId: string,
  thumbnail: string
): Promise<void> {
  try {
    const metadata = await get<ProjectMetadata>(
      `${PROJECTS_STORE}-meta-${projectId}`
    );
    if (metadata) {
      metadata.thumbnail = thumbnail;
      await set(`${PROJECTS_STORE}-meta-${projectId}`, metadata);
    }
  } catch (error) {
    console.error("Failed to save thumbnail:", error);
  }
}

// Clear all recent projects
export async function clearRecentProjects(): Promise<void> {
  try {
    await del(RECENT_STORE);
  } catch (error) {
    console.error("Failed to clear recent projects:", error);
  }
}

// Helper to generate ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
