import {
  data,
  isRouteErrorResponse,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useRouteError,
} from "react-router";
import { ZodError } from "zod";
import { AdminLogin } from "../admin/AdminLogin";
import CommerceApp from "../admin/commerce/CommerceApp";
import {
  adminHeaders,
  getLoginState,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
  requireAdminMutation,
} from "../server/admin-auth.server";
import { commerceSnapshot } from "../server/commerce/queries.server";
import { runCommand } from "../server/commerce/operations.server";
import {
  readAdminForm,
  saveAdminImage,
  removeFailedUpload,
} from "../server/admin-media.server";
import { CommerceError } from "../server/commerce/rules";
import { whatsappCommand, whatsappStatus } from "../server/whatsapp.server";
import type { Route } from "./+types/admin";
export const meta: Route.MetaFunction = () => [
  { title: "Store Admin | Boys & Girlz" },
  { name: "robots", content: "noindex,nofollow" },
];
export const headers: Route.HeadersFunction = ({
  loaderHeaders,
  actionHeaders,
}) => {
  const h = new Headers(adminHeaders);
  for (const source of [loaderHeaders, actionHeaders])
    for (const cookie of source.getSetCookie()) h.append("Set-Cookie", cookie);
  return h;
};
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  if (url.pathname === "/admin/login") {
    const state = await getLoginState(request);
    if (state.email) throw redirect("/admin", { headers: state.headers });
    return data(
      {
        login: true as const,
        ...state,
        headers: undefined,
        localEmail: process.env.BNG_ADMIN_EMAIL || "",
      },
      { headers: state.headers },
    );
  }
  const user = await requireAdmin(request);
  return data(
    {
      login: false as const,
      snapshot: await commerceSnapshot(
        url.searchParams.get("from") || undefined,
        url.searchParams.get("to") || undefined,
      ),
      csrfToken: user.csrfToken,
      email: user.email,
      whatsapp: whatsappStatus(),
    },
    { headers: user.headers },
  );
}
export async function action({ request }: Route.ActionArgs) {
  if (new URL(request.url).pathname === "/admin/logout")
    return logoutAdmin(request);
  const form = await readAdminForm(request);
  if (new URL(request.url).pathname === "/admin/login")
    return loginAdmin(request, form);
  const user = await requireAdminMutation(request, form);
  let uploaded: Awaited<ReturnType<typeof saveAdminImage>> = null;
  try {
    const intent = String(form.get("intent") || "");
    const payload = JSON.parse(String(form.get("payload") || "{}"));
    if (intent === "product" || intent === "whatsapp-campaign") {
      uploaded = await saveAdminImage(form.get("imageFile"));
      if (uploaded) payload.imageUrl = uploaded.url;
    }
    const result = intent.startsWith("whatsapp-")
      ? await whatsappCommand(intent, payload)
      : await runCommand(intent, payload);
    return data(
      { success: "Saved successfully.", result },
      { headers: user.headers },
    );
  } catch (error) {
    if (uploaded) await removeFailedUpload(uploaded.file);
    return data(
      {
        error:
          error instanceof CommerceError
            ? error.message
            : error instanceof ZodError
              ? error.issues
                  .map((i) => i.message)
                  .slice(0, 3)
                  .join(". ")
              : "Could not save. Check your details and try again.",
      },
      { status: 400, headers: user.headers },
    );
  }
}
export default function AdminRoute() {
  const state = useLoaderData<typeof loader>();
  const result = useActionData<{ csrfToken?: string }>();
  return state.login ? (
    <AdminLogin
      csrfToken={result?.csrfToken || state.csrfToken}
      configured={state.configured}
      localEmail={state.localEmail}
    />
  ) : (
    <CommerceApp
      snapshot={state.snapshot}
      csrfToken={state.csrfToken}
      email={state.email}
      whatsapp={state.whatsapp}
    />
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <main className="bg-admin bg-admin-error">
      <h1>
        {isRouteErrorResponse(error) && error.status === 403
          ? "Please refresh and sign in again."
          : "The admin page could not be loaded."}
      </h1>
      <p>Check your Supabase connection and sign-in details.</p>
      <Link to="/admin/login">Return to sign in</Link>
    </main>
  );
}
