import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_FOLDERS = ["avatars", "covers", "releases"] as const;
export type Folder = (typeof ALLOWED_FOLDERS)[number];

/** Detecta el tipo real del archivo por su firma (no por la extensión ni el MIME declarado). */
export function sniffImage(buf: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (buf.length >= 12 && String.fromCharCode(...buf.slice(0, 4)) === "RIFF" && String.fromCharCode(...buf.slice(8, 12)) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  return null;
}

const root = () => path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./storage");
const FILE_RE = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Guarda una imagen validada. Driver "local" para desarrollo.
 * Para producción, implementar el mismo contrato con Supabase Storage o S3 (ver docs/DEPLOY.md).
 */
export async function saveImage(file: File, folder: Folder): Promise<UploadResult> {
  if (!ALLOWED_FOLDERS.includes(folder)) return { ok: false, error: "Carpeta no permitida" };
  if (file.size === 0) return { ok: false, error: "El archivo está vacío" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "La imagen supera 5 MB" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(buf);
  if (!kind) return { ok: false, error: "Formato no permitido. Usa JPG, PNG o WebP" };
  const name = `${randomUUID()}.${kind.ext}`;
  const dir = path.join(root(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { ok: true, url: `/api/files/${folder}/${name}` };
}

export async function readStoredFile(folder: string, name: string) {
  if (!ALLOWED_FOLDERS.includes(folder as Folder) || !FILE_RE.test(name)) return null;
  try {
    const data = await readFile(path.join(root(), folder, name));
    const mime = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return { data, mime };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(url: string | null | undefined) {
  const m = url?.match(/^\/api\/files\/([a-z]+)\/([^/]+)$/);
  if (!m || !ALLOWED_FOLDERS.includes(m[1] as Folder) || !FILE_RE.test(m[2]!)) return;
  await unlink(path.join(root(), m[1]!, m[2]!)).catch(() => {});
}
