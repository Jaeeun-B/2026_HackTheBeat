export function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;
      
      const MAX = 800;
      if (width > height) {
        if (width > MAX) {
          height = Math.round(height * (MAX / width));
          width = MAX;
        }
      } else {
        if (height > MAX) {
          width = Math.round(width * (MAX / height));
          height = MAX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("No canvas ctx"));
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}
