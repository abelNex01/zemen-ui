import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  Upload,
  X,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createZipFromBlobs, downloadBlob } from "@/lib/zip-utils";
import { addToHistory } from "@/lib/db";
import { containerVariants, itemVariants } from "@/lib/animations";

interface ProcessingFile {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  error?: string;
}

export default function BatchOptimization() {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [preserveAspect, setPreserveAspect] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: ProcessingFile[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending" as const,
      progress: 0,
      originalSize: file.size,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => setFiles([]);

  const processFiles = async () => {
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "processing" as const } : f
        )
      );

      try {
        const options = {
          maxSizeMB: quality >= 90 ? 10 : quality >= 70 ? 5 : 2,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          fileType: file.file.type as any,
          onProgress: (progress: number) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
            );
          },
        };

        const compressed = await imageCompression(file.file, options);

        await addToHistory({
          filename: file.file.name,
          originalSize: file.originalSize,
          compressedSize: compressed.size,
          format: file.file.type,
          action: "compress",
          timestamp: Date.now(),
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "done" as const,
                  progress: 100,
                  compressedSize: compressed.size,
                  compressedBlob: compressed,
                }
              : f
          )
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "error" as const, error: error.message }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const completedFiles = files.filter(
      (f) => f.status === "done" && f.compressedBlob
    );
    if (completedFiles.length === 0) return;

    const entries = completedFiles.map((f) => ({
      name: `optimized_${f.file.name}`,
      data: f.compressedBlob!,
    }));

    const zip = await createZipFromBlobs(entries);
    downloadBlob(zip, "zemenpix_batch.zip");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalOriginal = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressed = files.reduce(
    (acc, f) => acc + (f.compressedSize || 0),
    0
  );
  const completedCount = files.filter((f) => f.status === "done").length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Batch Optimization</h1>
        <p className="text-muted-foreground">
          Process multiple images at once with advanced settings
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium">Drop images here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports PNG, JPG, WEBP • Up to 100+ images
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      {file.status === "processing" && (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      )}
                      {file.status === "done" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {file.status === "pending" && (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(file.originalSize)}</span>
                        {file.compressedSize && (
                          <>
                            <span>→</span>
                            <span className="text-green-500">
                              {formatBytes(file.compressedSize)}
                            </span>
                            <span className="text-green-500">
                              (-
                              {Math.round(
                                (1 - file.compressedSize / file.originalSize) *
                                  100
                              )}
                              %)
                            </span>
                          </>
                        )}
                      </div>
                      {file.status === "processing" && (
                        <div className="mt-2 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5" />
              <h3 className="font-bold">Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm">Quality: {quality}%</Label>
                <Slider
                  value={[quality]}
                  onValueChange={([v]) => setQuality(v)}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm">Max Width: {maxWidth}px</Label>
                <Slider
                  value={[maxWidth]}
                  onValueChange={([v]) => setMaxWidth(v)}
                  min={480}
                  max={4096}
                  step={160}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Preserve Aspect Ratio</Label>
                <Switch
                  checked={preserveAspect}
                  onCheckedChange={setPreserveAspect}
                />
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Files</span>
                <span className="font-medium">{files.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Size</span>
                <span className="font-medium">
                  {formatBytes(totalOriginal)}
                </span>
              </div>
              {totalCompressed > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compressed Size</span>
                  <span className="font-medium text-green-500">
                    {formatBytes(totalCompressed)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Start Optimization"
              )}
            </Button>

            {completedCount > 0 && (
              <Button
                onClick={downloadAll}
                variant="outline"
                className="w-full"
                icon={<Archive className="w-4 h-4" />}
              >
                Download All ({completedCount})
              </Button>
            )}

            {files.length > 0 && (
              <Button onClick={clearAll} variant="ghost" className="w-full">
                Clear All
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
