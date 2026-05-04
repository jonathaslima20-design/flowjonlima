export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = src;
  });
}
