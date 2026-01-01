import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle2,
  X,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertImageFormat, isFormatSupported } from "@/lib/format-converter";
import { createZipFromBlobs, downloadBlob } from "@/lib/zip-utils";
import { addToHistory } from "@/lib/db";
import { containerVariants, itemVariants } from "@/lib/animations";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

interface ConversionFile {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  convertedBlob?: Blob;
}

export default function FormatConverter() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);

  const formats = [
    { value: "image/jpeg", label: "JPEG", ext: "jpg" },
    { value: "image/png", label: "PNG", ext: "png" },
    { value: "image/webp", label: "WebP", ext: "webp" },
    { value: "image/avif", label: "AVIF", ext: "avif", beta: true },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: ConversionFile[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => setFiles([]);

  const convertFiles = async () => {
    setIsProcessing(true);

    for (const file of files) {
      if (file.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "processing" as const } : f
        )
      );

      try {
        const converted = await convertImageFormat(file.file, targetFormat, {
          quality: quality / 100,
        });

        await addToHistory({
          filename: file.file.name,
          originalSize: file.file.size,
          compressedSize: converted.size,
          format: targetFormat,
          action: "convert",
          timestamp: Date.now(),
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "done" as const, convertedBlob: converted }
              : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "error" as const } : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const downloadSingle = (file: ConversionFile) => {
    if (!file.convertedBlob) return;
    const format = formats.find((f) => f.value === targetFormat);
    const newName = file.file.name.replace(
      /\.[^.]+$/,
      `.${format?.ext || "png"}`
    );
    downloadBlob(file.convertedBlob, newName);
  };

  const downloadAll = async () => {
    const completedFiles = files.filter(
      (f) => f.status === "done" && f.convertedBlob
    );
    if (completedFiles.length === 0) return;

    const format = formats.find((f) => f.value === targetFormat);
    const entries = completedFiles.map((f) => ({
      name: f.file.name.replace(/\.[^.]+$/, `.${format?.ext || "png"}`),
      data: f.convertedBlob!,
    }));

    const zip = await createZipFromBlobs(entries);
    downloadBlob(zip, `converted_${format?.ext || "images"}.zip`);
  };

  const completedCount = files.filter((f) => f.status === "done").length;
  const avifSupported = isFormatSupported("image/avif");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Format Converter</h1>
        <p className="text-muted-foreground">
          Convert images between different formats with quality control
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
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium">Drop images to convert</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports PNG, JPG, WEBP, GIF
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
                      {file.status === "pending" && (
                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.file.type.split("/")[1].toUpperCase()} →{" "}
                        {formats.find((f) => f.value === targetFormat)?.label}
                      </p>
                    </div>

                    {file.status === "done" && (
                      <Button
                        onClick={() => downloadSingle(file)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}

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
            <h3 className="font-bold">Conversion Settings</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Output Format</Label>
                <Select
                  value={targetFormat}
                  onValueChange={(v) => setTargetFormat(v as OutputFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem
                        key={format.value}
                        value={format.value}
                        disabled={
                          format.value === "image/avif" && !avifSupported
                        }
                      >
                        {format.label}
                        {format.beta && " (Beta)"}
                        {format.value === "image/avif" &&
                          !avifSupported &&
                          " - Not Supported"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetFormat !== "image/png" && (
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
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={convertFiles}
              disabled={files.length === 0 || isProcessing}
              className="w-full"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert All"
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
