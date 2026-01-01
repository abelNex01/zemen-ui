import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { upscaleImageFromBlob } from "@/lib/upscale";
import { addToHistory } from "@/lib/db";
import { containerVariants, itemVariants } from "@/lib/animations";

export default function ImageUpscale() {
  const [originalImage, setOriginalImage] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState<2 | 4>(2);
  const [sharpen, setSharpen] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
        if (upscaledImage?.url) URL.revokeObjectURL(upscaledImage.url);

        setOriginalImage({ file, url: URL.createObjectURL(file) });
        setUpscaledImage(null);
      }
    },
    [originalImage, upscaledImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const processUpscale = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const upscaled = await upscaleImageFromBlob(originalImage.file, scale, {
        sharpen,
        noiseReduction,
      });

      await addToHistory({
        filename: originalImage.file.name,
        originalSize: originalImage.file.size,
        compressedSize: upscaled.size,
        format: "image/png",
        action: "upscale",
        timestamp: Date.now(),
      });

      setUpscaledImage({ blob: upscaled, url: URL.createObjectURL(upscaled) });
    } catch (error) {
      console.error("Upscale failed:", error);
    }
    setIsProcessing(false);
  };

  const downloadUpscaled = () => {
    if (!upscaledImage || !originalImage) return;
    const a = document.createElement("a");
    a.href = upscaledImage.url;
    a.download = `upscaled_${scale}x_${originalImage.file.name.replace(
      /\.[^.]+$/,
      ".png"
    )}`;
    a.click();
  };

  const formatBytes = (bytes: number) => {
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Image Upscale</h1>
        <p className="text-muted-foreground">
          Increase image resolution while preserving quality
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-4">
          {!originalImage ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <ArrowUpRight className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium text-lg">Drop image to upscale</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PNG, JPG, WEBP
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Original</Label>
                  <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                    <img
                      src={originalImage.url}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {formatBytes(originalImage.file.size)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Upscaled ({scale}x)
                  </Label>
                  <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                    {upscaledImage ? (
                      <>
                        <img
                          src={upscaledImage.url}
                          alt="Upscaled"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {formatBytes(upscaledImage.blob.size)}
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isProcessing ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click "Upscale" to process
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setOriginalImage(null);
                  setUpscaledImage(null);
                }}
                variant="outline"
                className="w-full"
              >
                Choose Different Image
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">Upscale Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-3 block">Scale Factor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s as 2 | 4)}
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${
                        scale === s
                          ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Smart Sharpening</Label>
                </div>
                <Switch checked={sharpen} onCheckedChange={setSharpen} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {noiseReduction ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Label className="text-sm">Noise Reduction</Label>
                </div>
                <Switch
                  checked={noiseReduction}
                  onCheckedChange={setNoiseReduction}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={processUpscale}
              disabled={!originalImage || isProcessing}
              className="w-full"
              icon={<ArrowUpRight className="w-4 h-4" />}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Upscale ${scale}x`
              )}
            </Button>

            {upscaledImage && (
              <Button
                onClick={downloadUpscaled}
                variant="outline"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
              >
                Download Upscaled
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
