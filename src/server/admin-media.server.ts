import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const MAX_UPLOAD = 5 * 1024 * 1024;
export const mediaDirectory = () => resolve(process.env.BNG_ADMIN_DATA_DIR || ".data", "uploads");
export const mediaFilename = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp|gif)$/;

export async function readAdminForm(request: Request): Promise<FormData> {
  const limit = MAX_UPLOAD + 1024 * 1024;
  if (Number(request.headers.get("content-length") || 0) > limit) throw new Response("The submitted form is too large.", { status: 413 });
  const reader = request.body?.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > limit) { await reader.cancel(); throw new Response("The submitted form is too large.", { status: 413 }); }
      parts.push(chunk.value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { return await new Response(bytes, { headers: { "Content-Type": request.headers.get("Content-Type") || "application/x-www-form-urlencoded" } }).formData(); }
  catch { throw new Response("The submitted form could not be read.", { status: 400 }); }
}

export async function saveAdminImage(file: FormDataEntryValue | null): Promise<{ url: string; file: string } | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_UPLOAD) throw new Error("Images must be 5 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  let extension = "";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = "png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) extension = "jpg";
  else if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") extension = "webp";
  else if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) extension = "gif";
  if (!extension) throw new Error("Choose a valid JPG, PNG, WebP or GIF image.");
  const filename = `${randomUUID()}.${extension}`;
  const path = resolve(mediaDirectory(), filename);
  await mkdir(mediaDirectory(), { recursive: true });
  await writeFile(path, bytes, { flag: "wx" });
  return { url: `/media/${filename}`, file: path };
}

export async function removeFailedUpload(path: string) { await unlink(path).catch(() => undefined); }
export async function readAdminImage(filename: string) {
  if (!mediaFilename.test(filename)) throw new Response("Not found", { status: 404 });
  try { return await readFile(resolve(mediaDirectory(), filename)); }
  catch { throw new Response("Not found", { status: 404 }); }
}
