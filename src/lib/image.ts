// Képek tömörítése a böngészőben feltöltés előtt: a hosszabbik oldal legfeljebb
// `maxSide` pixel, JPEG formátum. Ha nem kép (pl. PDF), vagy a tömörített nem
// kisebb, az eredetit adja vissza.
export async function compressImage(file: File, { maxSide = 2000, quality = 0.82, square = false } = {}) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const side = square ? Math.min(bitmap.width, bitmap.height) : 0;
    const srcW = square ? side : bitmap.width;
    const srcH = square ? side : bitmap.height;
    const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Négyzetes kivágásnál a kép közepét tartjuk meg.
    const sx = square ? (bitmap.width - side) / 2 : 0;
    const sy = square ? (bitmap.height - side) / 2 : 0;
    ctx.drawImage(bitmap, sx, sy, srcW, srcH, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || (!square && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
