export function cropImageToSquare(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const img = new Image();
      img.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D context.'));
          return;
        }
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to Blob.'));
          }
        }, 'image/jpeg');
      });
      img.addEventListener('error', () => reject(new Error('Failed to load image.')));
      img.src = typeof event.target?.result === 'string' ? event.target.result : '';
    });
    reader.readAsDataURL(file);
  });
}
