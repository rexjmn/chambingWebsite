/**
 * Redimensiona y comprime una imagen en el cliente (JPEG) antes de subir a S3.
 * @param {File} file
 * @param {number} maxEdge
 * @param {number} quality 0-1
 * @returns {Promise<File>}
 */
export async function compressImageToJpeg(file, maxEdge = 1920, quality = 0.82) {
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  let nw = w;
  let nh = h;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  nw = Math.round(w * scale);
  nh = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, nw, nh);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality,
    );
  });

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
