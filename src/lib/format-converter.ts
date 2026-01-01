type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

interface ConversionOptions {
  quality?: number;
  preserveTransparency?: boolean;
}

export async function convertImageFormat(
  blob: Blob,
  targetFormat: OutputFormat,
  options: ConversionOptions = {}
): Promise<Blob> {
  const { quality = 0.9, preserveTransparency = true } = options;
  
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  
  if (!preserveTransparency && (targetFormat === 'image/jpeg')) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.drawImage(bitmap, 0, 0);
  
  try {
    return await canvas.convertToBlob({ type: targetFormat, quality });
  } catch (e) {
    if (targetFormat === 'image/avif' || targetFormat === 'image/webp') {
      return await canvas.convertToBlob({ type: 'image/png', quality: 1 });
    }
    throw e;
  }
}

export function getFormatFromMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'image/avif': 'AVIF',
    'image/gif': 'GIF'
  };
  return formats[mimeType] || 'Unknown';
}

export function getMimeTypeFromExtension(ext: string): OutputFormat {
  const types: Record<string, OutputFormat> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'avif': 'image/avif'
  };
  return types[ext.toLowerCase()] || 'image/png';
}

export function isFormatSupported(format: OutputFormat): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(format);
    return dataUrl.startsWith(`data:${format}`);
  } catch {
    return false;
  }
}

export async function convertBatch(
  files: File[],
  targetFormat: OutputFormat,
  options: ConversionOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<{ file: File; converted: Blob }[]> {
  const results: { file: File; converted: Blob }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const converted = await convertImageFormat(file, targetFormat, options);
    results.push({ file, converted });
    onProgress?.(i + 1, files.length);
  }
  
  return results;
}
