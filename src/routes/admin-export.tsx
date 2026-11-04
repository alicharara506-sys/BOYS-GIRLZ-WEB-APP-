import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin, adminHeaders } from "../server/admin-auth.server";
import { commerceEnabled } from "../server/commerce/db.server";
import { commerceExport } from "../server/commerce/export.server";
export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  if (!commerceEnabled())
    return new Response(
      "Exports require the connected admin. Start with npm start.",
      { status: 404, headers: adminHeaders },
    );
  return commerceExport(new URL(request.url));
}
