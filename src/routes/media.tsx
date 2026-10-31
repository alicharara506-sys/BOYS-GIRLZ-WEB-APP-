import { readAdminImage } from "../server/admin-media.server";
import type { Route } from "./+types/media";

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)) throw new Response("Not found", { status: 404 });
  const filename = params.filename || "";
  const file = await readAdminImage(filename);
  const type = filename.endsWith(".png") ? "image/png" : filename.endsWith(".jpg") ? "image/jpeg" : filename.endsWith(".webp") ? "image/webp" : "image/gif";
  return new Response(new Uint8Array(file), { headers: { "Content-Type": type, "Content-Length": String(file.length), "Cache-Control": "public, max-age=86400, immutable", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" } });
}
