import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { 
  Upload, 
  Download, 
  Loader2, 
  Wrench,
  FileText,
  Palette,
  Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addToHistory } from '@/lib/db';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function AdvancedTools() {
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [processedImage, setProcessedImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [compressionType, setCompressionType] = useState<'smart' | 'lossless'>('smart');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [preserveColorProfile, setPreserveColorProfile] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [useCustomSize, setUseCustomSize] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
      if (processedImage?.url) URL.revokeObjectURL(processedImage.url);
      
      setOriginalImage({ file, url: URL.createObjectURL(file) });
      setProcessedImage(null);
    }
  }, [originalImage, processedImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false
  });

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const options: any = {
        useWebWorker: true,
        fileType: originalImage.file.type,
      };

      if (compressionType === 'lossless') {
        options.maxSizeMB = 50;
        options.initialQuality = 1;
      } else {
        options.maxSizeMB = 2;
      }

      if (useCustomSize) {
        options.maxWidthOrHeight = Math.max(customWidth, customHeight);
      }

      const compressed = await imageCompression(originalImage.file, options);

      await addToHistory({
        filename: originalImage.file.name,
        originalSize: originalImage.file.size,
        compressedSize: compressed.size,
        format: originalImage.file.type,
        action: 'compress',
        timestamp: Date.now()
      });

      setProcessedImage({ blob: compressed, url: URL.createObjectURL(compressed) });
    } catch (error) {
      console.error('Processing failed:', error);
    }
    setIsProcessing(false);
  };

  const downloadProcessed = () => {
    if (!processedImage || !originalImage) return;
    const a = document.createElement('a');
    a.href = processedImage.url;
    a.download = `advanced_${originalImage.file.name}`;
    a.click();
  };

  const formatBytes = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Advanced Tools</h1>
        <p className="text-muted-foreground">Fine-tune compression with professional controls</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!originalImage ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Wrench className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium text-lg">Drop image for advanced processing</p>
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
                  <Label className="text-sm font-medium">Processed</Label>
                  <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-video">
                    {processedImage ? (
                      <>
                        <img 
                          src={processedImage.url} 
                          alt="Processed" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {formatBytes(processedImage.blob.size)}
                          <span className="ml-2 text-green-400">
                            (-{Math.round((1 - processedImage.blob.size / originalImage.file.size) * 100)}%)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isProcessing ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                          <p className="text-sm text-muted-foreground">Click "Process" to start</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => {
                  setOriginalImage(null);
                  setProcessedImage(null);
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
            <h3 className="font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Advanced Settings
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Compression Type</Label>
                <Select value={compressionType} onValueChange={(v) => setCompressionType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smart">Smart Compression</SelectItem>
                    <SelectItem value="lossless">Lossless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Strip Metadata</Label>
                </div>
                <Switch 
                  checked={stripMetadata} 
                  onCheckedChange={setStripMetadata}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Preserve Color Profile</Label>
                </div>
                <Switch 
                  checked={preserveColorProfile} 
                  onCheckedChange={setPreserveColorProfile}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm">Custom Resolution</Label>
                </div>
                <Switch 
                  checked={useCustomSize} 
                  onCheckedChange={setUseCustomSize}
                />
              </div>

              {useCustomSize && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Width: {customWidth}px</Label>
                    <Slider
                      value={[customWidth]}
                      onValueChange={([v]) => setCustomWidth(v)}
                      min={480}
                      max={4096}
                      step={80}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height: {customHeight}px</Label>
                    <Slider
                      value={[customHeight]}
                      onValueChange={([v]) => setCustomHeight(v)}
                      min={480}
                      max={4096}
                      step={80}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={processImage}
              disabled={!originalImage || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Image'
              )}
            </Button>

            {processedImage && (
              <Button 
                onClick={downloadProcessed}
                variant="outline"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
              >
                Download Processed
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
