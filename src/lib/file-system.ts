// File system utilities for saving/loading .uix projects
import { get, set, del, clear } from "idb-keyval";
import { Project } from "@/types/editor";

const STORAGE_KEY = "uix-editor-autosave";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Save project to IndexedDB (autosave)
export async function saveToIndexedDB(project: Project): Promise<void> {
  try {
    await set(STORAGE_KEY, project);
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
  }
}

// Load project from IndexedDB
export async function loadFromIndexedDB(): Promise<Project | null> {
  try {
    const project = await get<Project>(STORAGE_KEY);
    return project || null;
  } catch (error) {
    console.error("Failed to load from IndexedDB:", error);
    return null;
  }
}

// Clear autosave
export async function clearAutosave(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear autosave:", error);
  }
}

// Export project to .uix file
export function exportToFile(project: Project, filename?: string): void {
  const dataStr = JSON.stringify(project, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${project.name || "project"}.uix`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import project from .uix file
export function importFromFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string) as Project;
        // Validate project structure
        if (!project.id || !project.pages || !Array.isArray(project.pages)) {
          throw new Error("Invalid project file format");
        }
        resolve(project);
      } catch (error) {
        reject(new Error("Failed to parse project file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// File System Access API (when supported)
export async function saveWithFileSystemAccess(
  project: Project
): Promise<void> {
  if (!("showSaveFilePicker" in window)) {
    // Fallback to download
    exportToFile(project);
    return;
  }

  try {
    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: `${project.name || "project"}.uix`,
      types: [
        {
          description: "UIX Project Files",
          accept: { "application/json": [".uix"] },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    const dataStr = JSON.stringify(project, null, 2);
    await writable.write(dataStr);
    await writable.close();
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Failed to save with File System Access API:", error);
      // Fallback to download
      exportToFile(project);
    }
  }
}

export async function loadWithFileSystemAccess(): Promise<Project | null> {
  if (!("showOpenFilePicker" in window)) {
    return null;
  }

  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: "UIX Project Files",
          accept: { "application/json": [".uix"] },
        },
      ],
    });

    const file = await fileHandle.getFile();
    return await importFromFile(file);
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Failed to load with File System Access API:", error);
    }
    return null;
  }
}

// Setup autosave interval
let autosaveTimer: NodeJS.Timeout | null = null;

export function setupAutosave(getProject: () => Project | null): void {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
  }

  autosaveTimer = setInterval(() => {
    const project = getProject();
    if (project) {
      saveToIndexedDB(project);
    }
  }, AUTOSAVE_INTERVAL);
}

export function clearAutosaveTimer(): void {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}

// Export types
export type ExportFormat = "png" | "jpg" | "svg" | "pdf";

// Helper to calculate bounds of visible elements
function calculateElementBounds(project: Project, currentPageId: string) {
  const page = project.pages.find((p) => p.id === currentPageId);
  if (!page) return null;

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

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Export canvas to PNG - only elements, no background
export function exportCanvasToPNG(
  stage: any,
  project: Project,
  currentPageId: string,
  filename?: string
): void {
  try {
    const bounds = calculateElementBounds(project, currentPageId);
    if (!bounds) {
      throw new Error("No visible elements to export");
    }

    // Export only the region containing elements
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    downloadDataURL(dataURL, filename || "export.png", "image/png");
  } catch (error) {
    console.error("Failed to export PNG:", error);
    throw error;
  }
}

// Export canvas to JPG - only elements, no background
export function exportCanvasToJPG(
  stage: any,
  project: Project,
  currentPageId: string,
  filename?: string,
  quality: number = 0.9
): void {
  try {
    const bounds = calculateElementBounds(project, currentPageId);
    if (!bounds) {
      throw new Error("No visible elements to export");
    }

    // Export only the region containing elements
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: "image/jpeg",
      quality,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    downloadDataURL(dataURL, filename || "export.jpg", "image/jpeg");
  } catch (error) {
    console.error("Failed to export JPG:", error);
    throw error;
  }
}

// Export canvas to SVG (requires generating SVG from elements)
export async function exportCanvasToSVG(
  project: Project,
  currentPageId: string,
  filename?: string
): Promise<void> {
  try {
    const page = project.pages.find((p) => p.id === currentPageId);
    if (!page) throw new Error("Page not found");

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

    const width = maxX > minX ? maxX - minX : 800;
    const height = maxY > minY ? maxY - minY : 600;
    const offsetX = minX !== Infinity ? -minX : 0;
    const offsetY = minY !== Infinity ? -minY : 0;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;

    page.elements.forEach((el) => {
      if (!el.visible) return;

      const x = el.transform.x + offsetX;
      const y = el.transform.y + offsetY;
      const transform = el.transform.rotation
        ? `transform="rotate(${el.transform.rotation} ${
            x + el.transform.width / 2
          } ${y + el.transform.height / 2})"`
        : "";
      const opacity =
        el.transform.opacity !== 1 ? `opacity="${el.transform.opacity}"` : "";

      if (el.type === "rectangle" || el.type === "frame") {
        const rx = el.borderRadius || 0;
        svg += `  <rect x="${x}" y="${y}" width="${el.transform.width}" height="${el.transform.height}" rx="${rx}" fill="${el.fill.color}" ${opacity} ${transform}/>\n`;
      } else if (el.type === "ellipse") {
        const cx = x + el.transform.width / 2;
        const cy = y + el.transform.height / 2;
        const rx = el.transform.width / 2;
        const ry = el.transform.height / 2;
        svg += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${el.fill.color}" ${opacity} ${transform}/>\n`;
      } else if (el.type === "text") {
        const textEl = el as any;
        const fontSize = textEl.style?.fontSize || 16;
        const fontFamily = textEl.style?.fontFamily || "sans-serif";
        const fontWeight = textEl.style?.fontWeight || 400;
        const textAlign = textEl.style?.textAlign || "left";
        const textAnchor =
          textAlign === "center"
            ? "middle"
            : textAlign === "right"
            ? "end"
            : "start";
        const textX =
          textAlign === "center"
            ? x + el.transform.width / 2
            : textAlign === "right"
            ? x + el.transform.width
            : x;
        svg += `  <text x="${textX}" y="${
          y + fontSize
        }" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${textAnchor}" fill="${
          el.fill.color
        }" ${opacity} ${transform}>${escapeXml(textEl.content || "")}</text>\n`;
      } else if (el.type === "image") {
        const imageEl = el as any;
        if (imageEl.imageStyle?.src) {
          svg += `  <image x="${x}" y="${y}" width="${el.transform.width}" height="${el.transform.height}" href="${imageEl.imageStyle.src}" ${opacity} ${transform}/>\n`;
        }
      }
    });

    svg += "</svg>";

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "export.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export SVG:", error);
    throw error;
  }
}

// Export canvas to PDF (requires jsPDF - we'll install it) - only elements, no background
export async function exportCanvasToPDF(
  stage: any,
  project: Project,
  currentPageId: string,
  filename?: string
): Promise<void> {
  try {
    const bounds = calculateElementBounds(project, currentPageId);
    if (!bounds) {
      throw new Error("No visible elements to export");
    }

    // Export only the region containing elements
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });

    // Dynamic import of jsPDF to avoid bundling if not needed
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? "landscape" : "portrait",
            unit: "px",
            format: [img.width, img.height],
          });

          pdf.addImage(dataURL, "PNG", 0, 0, img.width, img.height);
          pdf.save(filename || "export.pdf");
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  } catch (error) {
    console.error("Failed to export PDF:", error);
    // If jsPDF is not installed, show helpful error
    if (
      error instanceof Error &&
      (error.message.includes("jspdf") ||
        error.message.includes("Cannot find module"))
    ) {
      throw new Error(
        "PDF export requires jsPDF library. Please install it: npm install jspdf"
      );
    }
    throw error;
  }
}

// Helper function to download data URL
function downloadDataURL(
  dataURL: string,
  filename: string,
  mimeType: string
): void {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to escape XML
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

// Generic export function
export async function exportCanvas(
  stage: any,
  format: ExportFormat,
  project: Project,
  currentPageId: string,
  filename?: string,
  options?: { quality?: number }
): Promise<void> {
  const baseFilename = filename || project.name || "export";

  switch (format) {
    case "png":
      exportCanvasToPNG(stage, project, currentPageId, `${baseFilename}.png`);
      break;
    case "jpg":
      exportCanvasToJPG(
        stage,
        project,
        currentPageId,
        `${baseFilename}.jpg`,
        options?.quality || 0.9
      );
      break;
    case "svg":
      await exportCanvasToSVG(project, currentPageId, `${baseFilename}.svg`);
      break;
    case "pdf":
      await exportCanvasToPDF(
        stage,
        project,
        currentPageId,
        `${baseFilename}.pdf`
      );
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
