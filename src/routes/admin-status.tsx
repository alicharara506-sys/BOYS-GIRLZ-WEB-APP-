import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "../server/admin-auth.server";
import { whatsappStatus } from "../server/whatsapp.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  return data({ whatsapp: whatsappStatus() }, { headers: user.headers });
}
