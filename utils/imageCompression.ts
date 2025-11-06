/**
 * Comprime un'immagine data URL riducendola a una dimensione massima
 * @param dataUrl - Data URL dell'immagine (base64)
 * @param maxWidth - Larghezza massima (default: 1200px)
 * @param maxHeight - Altezza massima (default: 1200px)
 * @param quality - Qualità JPEG 0-1 (default: 0.8)
 * @returns Promise con il data URL compresso
 */
export const compressImage = async (
  dataUrl: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calcola le nuove dimensioni mantenendo l'aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Crea un canvas per comprimere
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Disegna l'immagine ridimensionata
      ctx.drawImage(img, 0, 0, width, height);

      // Converti a JPEG compresso
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      console.log(`🗜️ Compressione:
        - Dimensioni: ${img.width}x${img.height} → ${width}x${height}
        - Size originale: ${(dataUrl.length / 1024 / 1024).toFixed(2)} MB
        - Size compressa: ${(compressedDataUrl.length / 1024 / 1024).toFixed(2)} MB
        - Risparmio: ${(((dataUrl.length - compressedDataUrl.length) / dataUrl.length) * 100).toFixed(1)}%`
      );

      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
};
