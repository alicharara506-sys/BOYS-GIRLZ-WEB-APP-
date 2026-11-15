import type { ActionFunctionArgs } from "react-router";
import { requireAdminMutation } from "../server/admin-auth.server";
import { mediaFilename, readAdminForm, removeFailedUpload, saveAdminImage } from "../server/admin-media.server";
import { db } from "../server/commerce/db.server";

// Photo uploads for the Add Product modal. Each photo is sent on its own as soon as it is picked,
// so every request stays under the 5 MB limit and the modal can show real upload progress. Answers
// are JSON for the modal's XMLHttpRequest. Owner-only, with the same CSRF check as the admin.
export async function action({ request }: ActionFunctionArgs) {
  const form = await readAdminForm(request);
  const user = await requireAdminMutation(request, form);
  const json = (body: unknown, status = 200) => {
    const headers = new Headers(user.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Cache-Control", "no-store");
    return new Response(JSON.stringify(body), { status, headers });
  };
  const intent = String(form.get("intent") || "");
  try {
    if (intent === "upload") {
      const image = await saveAdminImage(form.get("imageFile"));
      if (!image) return json({ error: "Choose an image to upload." }, 400);
      return json(image);
    }
    // Removes a photo uploaded in the modal but never saved. A photo used by a saved product is
    // never deleted here.
    if (intent === "remove") {
      const file = String(form.get("file") || "");
      if (!mediaFilename.test(file)) return json({ error: "Unknown photo." }, 400);
      const pattern = `%${file}%`;
      const inProducts = await db.product.count({ where: { imageUrl: { contains: file } } });
      const inColors = ((await db.$queryRaw`SELECT count(*)::int AS n FROM public.product_colors WHERE images::text LIKE ${pattern}`) as { n: number }[])[0]?.n || 0;
      if (!inProducts && !inColors) await removeFailedUpload(file);
      return json({ removed: !inProducts && !inColors });
    }
    return json({ error: "Unknown request." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "The photo could not be saved." }, 400);
  }
}
