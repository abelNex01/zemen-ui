export function upscaleImage(
  imageData: ImageData,
  scale: 2 | 4,
  options: { sharpen?: boolean; noiseReduction?: boolean } = {}
): ImageData {
  const { width, height, data } = imageData;
  const newWidth = width * scale;
  const newHeight = height * scale;

  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext("2d")!;

  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(imageData, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

  let result = ctx.getImageData(0, 0, newWidth, newHeight);

  if (options.noiseReduction) {
    result = applyNoiseReduction(result);
  }

  if (options.sharpen) {
    result = applySharpenFilter(result);
  }

  return result;
}

export function applyNoiseReduction(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
            sum += data[idx];
            count++;
          }
        }

        const idx = (y * width + x) * 4 + c;
        const avg = sum / count;
        const diff = Math.abs(data[idx] - avg);

        if (diff < 20) {
          output[idx] = Math.round(data[idx] * 0.7 + avg * 0.3);
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

function applySharpenFilter(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
            sum += data[idx] * kernel[ki++];
          }
        }

        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.max(0, Math.min(255, Math.round(sum)));
      }
    }
  }

  return new ImageData(output, width, height);
}

export async function upscaleImageFromBlob(
  blob: Blob,
  scale: 2 | 4,
  options: {
    sharpen?: boolean;
    noiseReduction?: boolean;
    maxSizeMB?: number;
  } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const upscaled = upscaleImage(imageData, scale, options);

  const resultCanvas = new OffscreenCanvas(upscaled.width, upscaled.height);
  const resultCtx = resultCanvas.getContext("2d")!;
  resultCtx.putImageData(upscaled, 0, 0);

  let resultBlob = await resultCanvas.convertToBlob({
    type: "image/png",
    quality: 1,
  });

  // Limit file size if maxSizeMB is specified (default to 10MB for upscaled images)
  const maxSize = options.maxSizeMB || 10;
  if (resultBlob.size > maxSize * 1024 * 1024) {
    // Will be handled in ProEditor with imageCompression
  }

  return resultBlob;
}
