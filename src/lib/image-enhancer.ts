export async function sharpenImage(file: File | Blob, amount: number = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;


      const output = ctx.createImageData(width, height);
      const outputData = output.data;

      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // R, G, B
            let val = 0;
            for (let ky = 0; ky < 3; ky++) {
              for (let kx = 0; kx < 3; kx++) {
                const pixelIdx = ((y + ky - 1) * width + (x + kx - 1)) * 4 + c;
                val += data[pixelIdx] * kernel[ky * 3 + kx];
              }
            }
            
            // Blend original with sharpened based on 'amount'
            const idx = (y * width + x) * 4 + c;
            outputData[idx] = data[idx] * (1 - amount) + val * amount;
          }
          outputData[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]; // Alpha
        }
      }

      ctx.putImageData(output, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, file.type, 0.95);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
