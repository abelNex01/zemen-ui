import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  Upload,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Maximize2,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Sun,
  Contrast,
  Droplets,
  Type,
  Undo2,
  Redo2,
  Layers,
  Crown,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useProAccess } from "@/hooks/use-pro-access";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { upscaleImageFromBlob, applyNoiseReduction } from "@/lib/upscale";
import { convertImageFormat } from "@/lib/format-converter";
import { addToHistory, getHistory, getHistoryStats } from "@/lib/db";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

type Tool =
  | "compress"
  | "upscale"
  | "convert"
  | "sharpen"
  | "denoise"
  | "crop"
  | "rotate"
  | "brightness"
  | "contrast"
  | "saturation"
  | "watermark"
  | "batch";

interface ToolConfig {
  id: Tool;
  icon: React.ElementType;
  label: string;
  description: string;
}

const tools: ToolConfig[] = [
  {
    id: "compress",
    icon: Maximize2,
    label: "Compress",
    description: "Reduce file size",
  },
  {
    id: "upscale",
    icon: ArrowUpRight,
    label: "Upscale",
    description: "Increase resolution",
  },
  {
    id: "convert",
    icon: RefreshCw,
    label: "Convert",
    description: "Change format",
  },
  {
    id: "sharpen",
    icon: Sparkles,
    label: "Sharpen",
    description: "Enhance details",
  },
  {
    id: "denoise",
    icon: Droplets,
    label: "Denoise",
    description: "Reduce noise",
  },
  { id: "crop", icon: Crop, label: "Crop", description: "Trim image" },
  {
    id: "rotate",
    icon: RotateCw,
    label: "Rotate",
    description: "Rotate image",
  },
  {
    id: "brightness",
    icon: Sun,
    label: "Brightness",
    description: "Adjust light",
  },
  {
    id: "contrast",
    icon: Contrast,
    label: "Contrast",
    description: "Adjust contrast",
  },
  {
    id: "saturation",
    icon: Droplets,
    label: "Saturation",
    description: "Color intensity",
  },
  { id: "watermark", icon: Type, label: "Watermark", description: "Add text" },
  {
    id: "batch",
    icon: Layers,
    label: "Batch",
    description: "Process multiple",
  },
];

export default function ProEditor() {
  const { isPro, daysRemaining, licenseKey } = useProAccess();
  const [, navigate] = useLocation();

  // Image state
  const [originalImage, setOriginalImage] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [processedImage, setProcessedImage] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tool state
  const [activeTool, setActiveTool] = useState<Tool>("compress");
  const [showComparison, setShowComparison] = useState(true);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Tool options
  const [quality, setQuality] = useState(80);
  const [upscaleLevel, setUpscaleLevel] = useState<2 | 4>(2);
  const [outputFormat, setOutputFormat] = useState<
    "image/jpeg" | "image/png" | "image/webp"
  >("image/webp");
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [watermarkText, setWatermarkText] = useState("");
  const [sharpenEnabled, setSharpenEnabled] = useState(false);
  const [denoiseEnabled, setDenoiseEnabled] = useState(false);

  // History - store blobs for proper undo/redo
  const [undoStack, setUndoStack] = useState<{ blob: Blob; url: string }[]>([]);
  const [redoStack, setRedoStack] = useState<{ blob: Blob; url: string }[]>([]);
  const [zoom, setZoom] = useState(100);
  const autoApplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoApplyRef = useRef(false);
  const hasProcessedImageRef = useRef(false);

  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalProcessed: 0, totalSaved: 0 });

  // Mobile drawer states
  const isMobile = useIsMobile();
  const [leftToolbarOpen, setLeftToolbarOpen] = useState(false);

  useEffect(() => {
    if (!isPro) {
      navigate("/");
    }
  }, [isPro, navigate]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Track if we have a processed image (so we know to auto-apply changes)
  useEffect(() => {
    hasProcessedImageRef.current = !!processedImage;
  }, [processedImage]);

  // Auto-apply tool changes with debouncing
  useEffect(() => {
    // Don't auto-apply if no original image, if processing, or if we're skipping (undo/redo)
    if (!originalImage || isProcessing || skipAutoApplyRef.current) {
      skipAutoApplyRef.current = false;
      return;
    }

    // Don't auto-apply for watermark tool until text is entered
    if (activeTool === "watermark" && !watermarkText.trim()) return;

    // Clear existing timeout
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }

    // Debounce auto-apply by 300ms for slider changes
    autoApplyTimeoutRef.current = setTimeout(() => {
      applyTool();
    }, 300);

    // Cleanup
    return () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    quality,
    upscaleLevel,
    outputFormat,
    rotation,
    brightness,
    contrast,
    saturation,
    watermarkText,
    sharpenEnabled,
    denoiseEnabled,
  ]);

  // Auto-apply when tool changes
  useEffect(() => {
    if (!originalImage || isProcessing || skipAutoApplyRef.current) {
      skipAutoApplyRef.current = false;
      return;
    }

    // Don't auto-apply for watermark tool until text is entered
    if (activeTool === "watermark" && !watermarkText.trim()) return;

    // Clear existing timeout
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }

    // Apply immediately on tool change (no debounce needed)
    autoApplyTimeoutRef.current = setTimeout(() => {
      applyTool();
    }, 100);

    return () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  const loadHistory = async () => {
    const items = await getHistory(20);
    const statsData = await getHistoryStats();
    setHistoryItems(items);
    setStats(statsData);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Clean up old URLs
        if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
        if (processedImage?.url) URL.revokeObjectURL(processedImage.url);
        undoStack.forEach((item) => URL.revokeObjectURL(item.url));
        redoStack.forEach((item) => URL.revokeObjectURL(item.url));

        setOriginalImage({ file, url: URL.createObjectURL(file) });
        setProcessedImage(null);
        setUndoStack([]);
        setRedoStack([]);
        hasProcessedImageRef.current = false;
      }
    },
    [originalImage, processedImage, undoStack, redoStack]
  );

  // Auto-apply when image is first uploaded
  useEffect(() => {
    if (originalImage && !processedImage && !isProcessing) {
      // Small delay to ensure state is set
      const timer = setTimeout(() => {
        applyTool();
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const applyTool = async () => {
    if (!originalImage) return;

    setIsProcessing(true);

    try {
      let result: Blob;
      const sourceBlob = processedImage?.blob || originalImage.file;

      switch (activeTool) {
        case "compress":
          result = await imageCompression(originalImage.file, {
            maxSizeMB: quality >= 90 ? 10 : quality >= 70 ? 5 : 2,
            maxWidthOrHeight: 4096,
            useWebWorker: true,
          });
          break;

        case "upscale":
          result = await upscaleImageFromBlob(sourceBlob, upscaleLevel, {
            sharpen: sharpenEnabled,
            noiseReduction: denoiseEnabled,
          });
          // Limit file size to max 10MB by compressing if needed
          if (result.size > 10 * 1024 * 1024) {
            const bitmap = await createImageBitmap(result);
            const file = new File([result], "upscaled.png", {
              type: "image/png",
            });
            result = await imageCompression(file, {
              maxSizeMB: 10,
              maxWidthOrHeight: Math.max(bitmap.width, bitmap.height),
              useWebWorker: true,
            });
          }
          break;

        case "convert":
          result = await convertImageFormat(sourceBlob, outputFormat, {
            quality: quality / 100,
          });
          break;

        case "sharpen":
          result = await upscaleImageFromBlob(sourceBlob, 2, {
            sharpen: true,
            noiseReduction: false,
          });
          // Scale back down to original size
          const img = await createImageBitmap(result);
          const canvas = new OffscreenCanvas(img.width / 2, img.height / 2);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          result = await canvas.convertToBlob({ type: "image/png" });
          break;

        case "denoise": {
          // Apply noise reduction without upscaling
          const bitmap = await createImageBitmap(sourceBlob);
          const tempCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const tempCtx = tempCanvas.getContext("2d")!;
          tempCtx.drawImage(bitmap, 0, 0);
          const imageData = tempCtx.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height
          );
          const denoised = applyNoiseReduction(imageData);
          const resultCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const resultCtx = resultCanvas.getContext("2d")!;
          resultCtx.putImageData(denoised, 0, 0);
          result = await resultCanvas.convertToBlob({ type: "image/png" });
          break;
        }

        case "crop": {
          // Simple center crop (90% of image)
          const bitmap = await createImageBitmap(sourceBlob);
          const cropX = bitmap.width * 0.05;
          const cropY = bitmap.height * 0.05;
          const cropWidth = bitmap.width * 0.9;
          const cropHeight = bitmap.height * 0.9;
          const canvas = new OffscreenCanvas(cropWidth, cropHeight);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(
            bitmap,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );
          result = await canvas.convertToBlob({ type: "image/png" });
          break;
        }

        case "rotate":
          result = await rotateImage(sourceBlob, rotation);
          break;

        case "brightness":
        case "contrast":
        case "saturation":
          result = await applyFilters(sourceBlob, {
            brightness,
            contrast,
            saturation,
          });
          break;

        case "watermark":
          result = await addWatermark(sourceBlob, watermarkText);
          break;

        default:
          result = sourceBlob;
      }

      // Save current state for undo (store blob and URL)
      if (processedImage) {
        setUndoStack((prev) => [
          ...prev,
          { blob: processedImage.blob, url: processedImage.url },
        ]);
        // Clean up redo stack URLs
        redoStack.forEach((item) => URL.revokeObjectURL(item.url));
        setRedoStack([]);
      }

      // Track in history
      await addToHistory({
        filename: originalImage.file.name,
        originalSize: originalImage.file.size,
        compressedSize: result.size,
        format: result.type,
        action: activeTool,
        timestamp: Date.now(),
      });

      setProcessedImage({ blob: result, url: URL.createObjectURL(result) });
      hasProcessedImageRef.current = true;
      loadHistory();
    } catch (error) {
      console.error("Processing failed:", error);
    }

    setIsProcessing(false);
  };

  const rotateImage = async (blob: Blob, degrees: number): Promise<Blob> => {
    const img = await createImageBitmap(blob);
    const radians = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const width = img.width * cos + img.height * sin;
    const height = img.width * sin + img.height * cos;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return canvas.convertToBlob({ type: "image/png" });
  };

  const applyFilters = async (
    blob: Blob,
    filters: { brightness: number; contrast: number; saturation: number }
  ): Promise<Blob> => {
    const img = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d")!;
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    ctx.drawImage(img, 0, 0);
    return canvas.convertToBlob({ type: "image/png" });
  };

  const addWatermark = async (blob: Blob, text: string): Promise<Blob> => {
    const img = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    ctx.font = `${Math.max(24, img.width / 20)}px sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.fillText(text, img.width / 2, img.height - 40);
    return canvas.convertToBlob({ type: "image/png" });
  };

  const downloadImage = () => {
    if (!processedImage || !originalImage) return;
    const a = document.createElement("a");
    a.href = processedImage.url;
    const ext = processedImage.blob.type.split("/")[1];
    a.download = `processed_${originalImage.file.name.replace(
      /\.[^.]+$/,
      ""
    )}.${ext}`;
    a.click();
  };

  const undo = () => {
    if (undoStack.length > 0 && processedImage) {
      skipAutoApplyRef.current = true; // Prevent auto-apply after undo
      const prevState = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));

      // Add current state to redo stack
      setRedoStack((prev) => [
        ...prev,
        { blob: processedImage.blob, url: processedImage.url },
      ]);

      // Restore previous state
      setProcessedImage({
        blob: prevState.blob,
        url: prevState.url,
      });
    }
  };

  const redo = () => {
    if (redoStack.length > 0 && processedImage) {
      skipAutoApplyRef.current = true; // Prevent auto-apply after redo
      const nextState = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));

      // Add current state to undo stack
      setUndoStack((prev) => [
        ...prev,
        { blob: processedImage.blob, url: processedImage.url },
      ]);

      // Restore next state
      setProcessedImage({
        blob: nextState.blob,
        url: nextState.url,
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isPro) return null;

  // Left Toolbar Content
  const LeftToolbarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-border">
        <a href="/" onClick={() => isMobile && setLeftToolbarOpen(false)}>
          <img src={logo} alt="ZemenPix" className="h-6 dark:invert" />
        </a>
      </div>

      {/* Tools */}
      <div className="flex-1 py-2 overflow-y-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (isMobile) {
                  setLeftToolbarOpen(false);
                }
              }}
              className={cn(
                "w-full h-10 flex items-center justify-center transition-all group relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip - only show on desktop */}
              {!isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  {tool.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );

  // Right Panel Content (Bottom Adjustment Bar)
  const RightPanelContent = () => (
    <>
      <div className="p-3 md:p-4 border-b border-border flex-shrink-0">
        <div>
          <h3 className="font-bold text-sm md:text-base">
            {tools.find((t) => t.id === activeTool)?.label}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tools.find((t) => t.id === activeTool)?.description}
          </p>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
        {/* Tool-specific options */}
        {(activeTool === "compress" || activeTool === "convert") && (
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Quality: {quality}%
            </label>
            <Slider
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              min={10}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {activeTool === "upscale" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Scale Factor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setUpscaleLevel(s as 2 | 4)}
                    className={cn(
                      "p-3 rounded-lg font-bold text-sm transition-all",
                      upscaleLevel === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Enable Sharpening
              </span>
              <button
                onClick={() => setSharpenEnabled(!sharpenEnabled)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  sharpenEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-background",
                    sharpenEnabled ? "right-0.5" : "left-0.5"
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Enable Noise Reduction
              </span>
              <button
                onClick={() => setDenoiseEnabled(!denoiseEnabled)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  denoiseEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-background",
                    denoiseEnabled ? "right-0.5" : "left-0.5"
                  )}
                />
              </button>
            </div>
          </>
        )}

        {activeTool === "convert" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["image/jpeg", "image/png", "image/webp"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setOutputFormat(f)}
                  className={cn(
                    "p-2 rounded-lg text-xs font-bold transition-all",
                    outputFormat === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {f.split("/")[1].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTool === "rotate" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Rotation: {rotation}°
            </label>
            <Slider
              value={[rotation]}
              onValueChange={([v]) => setRotation(v)}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setRotation((rotation - 90 + 360) % 360)}
                className="flex-1 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="flex-1 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <RotateCw className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        )}

        {(activeTool === "brightness" ||
          activeTool === "contrast" ||
          activeTool === "saturation") && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Brightness: {brightness}%
              </label>
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Contrast: {contrast}%
              </label>
              <Slider
                value={[contrast]}
                onValueChange={([v]) => setContrast(v)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Saturation: {saturation}%
              </label>
              <Slider
                value={[saturation]}
                onValueChange={([v]) => setSaturation(v)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          </>
        )}

        {activeTool === "watermark" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter text..."
              className="w-full p-3 bg-background border border-input rounded-lg text-sm focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        )}

        {activeTool === "denoise" && (
          <div className="text-xs text-muted-foreground">
            Noise reduction will be applied to your image
          </div>
        )}

        {activeTool === "crop" && (
          <div className="text-xs text-muted-foreground">
            Center crop applied (90% of image)
          </div>
        )}

        {activeTool === "sharpen" && (
          <div className="text-xs text-muted-foreground">
            Sharpening will be applied to your image
          </div>
        )}
      </div>

      {/* Download Button - Apply is now automatic */}
      {processedImage && (
        <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
          <Button onClick={downloadImage} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Toolbar - Desktop fixed, Mobile Sheet */}
      {isMobile ? (
        <Sheet open={leftToolbarOpen} onOpenChange={setLeftToolbarOpen}>
          <SheetContent
            side="left"
            className="w-14 p-0 bg-background border-border [&>button]:hidden"
          >
            <div className="flex flex-col h-full">
              <LeftToolbarContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-14 bg-card border-r border-border flex flex-col hidden md:flex">
          <LeftToolbarContent />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-12 bg-card border-b border-border flex items-center justify-between px-2 md:px-4 gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile menu buttons */}
            {isMobile && (
              <>
                <button
                  onClick={() => setLeftToolbarOpen(true)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Tools"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="h-6 w-px bg-border" />
              </>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground w-12 text-center hidden sm:inline">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Crown className="w-3 h-3 text-amber-500" />
              <span>Pro</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{daysRemaining}d</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas */}
          <div className="flex-1 relative bg-background flex items-center justify-center overflow-auto min-w-0">
            {!originalImage ? (
              <div
                {...getRootProps()}
                className={cn(
                  "w-full h-full flex items-center justify-center cursor-pointer transition-colors",
                  isDragActive ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="text-center px-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                  </div>
                  <p className="text-foreground/70 font-medium text-sm md:text-base">
                    Drop image here or click to upload
                  </p>
                  <p className="text-muted-foreground text-xs md:text-sm mt-1">
                    PNG, JPG, WEBP supported
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {/* Before/After Comparison Slider */}
                {processedImage && showComparison ? (
                  <div className="relative max-w-full max-h-full">
                    <div className="relative overflow-hidden rounded-lg shadow-2xl">
                      {/* Processed Image (Right) */}
                      <img
                        src={processedImage.url}
                        alt="Processed"
                        className="max-w-full max-h-[70vh] object-contain"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />

                      {/* Original Image (Left - clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={originalImage.url}
                          alt="Original"
                          className="max-w-full max-h-[70vh] object-contain"
                          style={{
                            width: `${100 / (sliderPosition / 100)}%`,
                            maxWidth: "none",
                            transform: `rotate(${rotation}deg)`,
                          }}
                        />
                      </div>

                      {/* Slider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                        style={{ left: `${sliderPosition}%` }}
                        onMouseDown={(e) => {
                          const rect =
                            e.currentTarget.parentElement!.getBoundingClientRect();
                          const handleMove = (moveEvent: MouseEvent) => {
                            const x = moveEvent.clientX - rect.left;
                            const percent = Math.max(
                              0,
                              Math.min(100, (x / rect.width) * 100)
                            );
                            setSliderPosition(percent);
                          };
                          const handleUp = () => {
                            document.removeEventListener(
                              "mousemove",
                              handleMove
                            );
                            document.removeEventListener("mouseup", handleUp);
                          };
                          document.addEventListener("mousemove", handleMove);
                          document.addEventListener("mouseup", handleUp);
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <ChevronLeft className="w-3 h-3 text-black" />
                          <ChevronRight className="w-3 h-3 text-black" />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-2 left-2 md:top-4 md:left-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        Original • {formatBytes(originalImage.file.size)}
                      </div>
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        Processed • {formatBytes(processedImage.blob.size)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={originalImage.url}
                    alt="Original"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                )}

                {/* Close/Reset Button */}
                <button
                  onClick={() => {
                    setOriginalImage(null);
                    setProcessedImage(null);
                  }}
                  className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-card border border-border rounded-full hover:bg-muted transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tool Panel - Always visible, CapCut style */}
        <div className="h-[40vh] md:h-64 border-t border-border bg-card overflow-hidden flex-shrink-0">
          <div className="max-w-4xl mx-auto h-full flex flex-col w-full">
            <RightPanelContent />
          </div>
        </div>
      </div>
    </div>
  );
}
