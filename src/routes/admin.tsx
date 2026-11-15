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
import { clearSiteCache } from "../server/site.server";
import {
  readAdminForm,
  saveAdminImage,
  removeFailedUpload,
} from "../server/admin-media.server";
import { CommerceError } from "../server/commerce/rules";
import type { Route } from "./+types/admin";
import type { ShouldRevalidateFunctionArgs } from "react-router";
export const meta: Route.MetaFunction = () => [
  { title: "Store Admin | Boys & Girlz" },
  { name: "robots", content: "noindex,nofollow" },
];
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // The admin shell shares one snapshot across all modules. Keep it while
  // navigating between modules; mutations, filters, and explicit refreshes
  // still follow React Router's normal revalidation behavior.
  if (
    currentUrl.pathname !== nextUrl.pathname &&
    currentUrl.search === nextUrl.search &&
    !formMethod
  )
    return false;
  return defaultShouldRevalidate;
}
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
        // Prefills the email on a local copy only; the live sign-in page never shows it.
        localEmail: process.env.NODE_ENV === "production" ? "" : process.env.BNG_ADMIN_EMAIL || "",
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
    if (intent === "product") {
      uploaded = await saveAdminImage(form.get("imageFile"));
      if (uploaded) payload.imageUrl = uploaded.url;
    }
    const result = await runCommand(intent, payload);
    // Settings, categories and the menu show on the website: refresh them right away.
    clearSiteCache();
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
