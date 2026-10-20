export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export function validatePhoto(file: Pick<File, "size" | "type">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Chọn ảnh JPG, PNG hoặc WebP.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Ảnh tối đa 8 MB.");
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("trantrinh-portraits", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Không mở được bộ nhớ ảnh."));
  });
}
export async function savePortrait(file: File): Promise<string> {
  validatePhoto(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("Không xử lý được ảnh."); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Không lưu được ảnh.")), "image/jpeg", .85));
  const id = crypto.randomUUID(); const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite"); tx.objectStore("photos").put(blob, id);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error("Không lưu được ảnh; bộ nhớ có thể đầy."));
  }).finally(() => db.close());
  return id;
}
export async function loadPortrait(id: string): Promise<Blob | null> {
  const db = await database();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction("photos", "readonly"); const request = tx.objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(new Error("Không tải được ảnh."));
    tx.oncomplete = () => db.close();
  });
}
