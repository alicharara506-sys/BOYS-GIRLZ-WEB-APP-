import { data, isRouteErrorResponse, Link, redirect, useActionData, useLoaderData, useRouteError } from "react-router";
import { ZodError } from "zod";
import AdminPanel, { AdminLogin, type AdminPageData } from "../admin/AdminPanel";
import { adminHeaders, getLoginState, loginAdmin, logoutAdmin, requireAdmin, requireAdminMutation } from "../server/admin-auth.server";
import { AdminDataError, archiveProduct, getAdminOverview, getOrder, getProduct, listCustomers, listOrders, listProducts, listPromos, saveProduct, savePromo, setPromoActive, updateInventory, updateOrderStatus } from "../server/admin-data.server";
import { readAdminForm, removeFailedUpload, saveAdminImage } from "../server/admin-media.server";
import type { AdminOrderStatus } from "../admin/types";
import type { Route } from "./+types/admin";
import CommerceApp from "../admin/commerce/CommerceApp";
import { commerceEnabled } from "../server/commerce/db.server";
import { commerceSnapshot } from "../server/commerce/queries.server";
import { runCommand } from "../server/commerce/operations.server";
import { CommerceError } from "../server/commerce/rules";
import { commerceExport } from "../server/commerce/export.server";

export const meta: Route.MetaFunction = () => [{ title: "Store Admin | Boys & Girlz" }, { name: "robots", content: "noindex, nofollow, noarchive" }];
export const headers: Route.HeadersFunction = () => adminHeaders;
const value = (form: FormData, key: string) => String(form.get(key) || "").trim();

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (path === "/admin/login") {
    const state = await getLoginState(request);
    if (state.email) throw redirect("/admin", { headers: adminHeaders });
    return data({ login: true as const, csrfToken: state.csrfToken, configured: state.configured, localEmail: process.env.BNG_ADMIN_EMAIL || "owner@boysandgirlz.local" }, { headers: state.headers });
  }
  const user = await requireAdmin(request);
  if (commerceEnabled()) {
    if (path === "/admin/export") return commerceExport(url);
    const section = path.split("/")[2] || "";
    if (!["", "pos", "products", "inventory", "orders", "returns", "customers", "marketing", "suppliers", "purchases", "accounting", "reports", "cash", "rewards", "discounts", "settings"].includes(section)) throw new Response("Admin page not found", { status: 404, headers: adminHeaders });
    return data({ login: false as const, commerce: true as const, snapshot: await commerceSnapshot(url.searchParams.get("from") || undefined, url.searchParams.get("to") || undefined), csrfToken: user.csrfToken, email: user.email }, { headers: adminHeaders });
  }
  const query = url.searchParams.get("q")?.trim().slice(0, 100) || "";
  const result: AdminPageData = { section: "overview", csrfToken: user.csrfToken, user: { email: user.email }, mode: "local", query };
  if (path === "/admin") result.overview = getAdminOverview();
  else if (path === "/admin/products") { result.section = "products"; result.products = listProducts({ search: query, archived: true }); }
  else if (path === "/admin/products/new") { result.section = "product"; result.product = null; }
  else if (path.startsWith("/admin/products/")) {
    result.section = "product"; result.product = getProduct(path.slice("/admin/products/".length));
    if (!result.product) throw new Response("Product not found", { status: 404, headers: adminHeaders });
  } else if (path === "/admin/inventory") { result.section = "inventory"; result.products = listProducts(query); }
  else if (path === "/admin/orders") { result.section = "orders"; result.orders = listOrders().filter(order => !query || `${order.orderNumber} ${order.customer.fullName} ${order.customer.mobile}`.toLowerCase().includes(query.toLowerCase())); }
  else if (path.startsWith("/admin/orders/")) {
    result.section = "order"; result.order = getOrder(path.slice("/admin/orders/".length));
    if (!result.order) throw new Response("Order not found", { status: 404, headers: adminHeaders });
  } else if (path === "/admin/customers") { result.section = "customers"; result.customers = listCustomers().filter(customer => !query || `${customer.fullName} ${customer.mobile} ${customer.email}`.toLowerCase().includes(query.toLowerCase())); }
  else if (path === "/admin/discounts") { result.section = "discounts"; result.promos = listPromos(); }
  else throw new Response("Admin page not found", { status: 404, headers: adminHeaders });
  return data({ login: false as const, commerce: false as const, ...result }, { headers: adminHeaders });
}

export async function action({ request }: Route.ActionArgs) {
  const path = new URL(request.url).pathname.replace(/\/$/, "");
  if (path === "/admin/logout") return logoutAdmin(request);
  const form = await readAdminForm(request);
  if (path === "/admin/login") return loginAdmin(request, form);
  await requireAdminMutation(request, form);
  let uploaded: Awaited<ReturnType<typeof saveAdminImage>> = null;
  try {
    const intent = value(form, "intent");
    if (commerceEnabled()) {
      let payload;
      try { payload = JSON.parse(value(form, "payload")); } catch { throw new CommerceError("The submitted details could not be read."); }
      if (intent === "product") {
        uploaded = await saveAdminImage(form.get("imageFile"));
        if (uploaded) payload.imageUrl = uploaded.url;
      }
      const result = await runCommand(intent, payload);
      return data({ success: "Saved successfully.", result }, { headers: adminHeaders });
    }
    if (intent === "save-product") {
      uploaded = await saveAdminImage(form.get("imageFile"));
      const product = saveProduct({
        slug: value(form, "slug"), name: value(form, "name"), description: value(form, "description"),
        category: value(form, "category"), gender: value(form, "gender") || null,
        condition: value(form, "condition"), productType: value(form, "productType") || "clothing",
        price: value(form, "price"), originalPrice: value(form, "originalPrice"),
        sizes: value(form, "sizes"), colors: value(form, "colors") || "Default", image: value(form, "image") || "0",
        model: value(form, "model") || "romper", brand: value(form, "brand") || undefined,
        imageUrl: uploaded?.url || value(form, "imageUrl") || null,
        isNew: form.get("isNew") === "on", published: form.get("published") === "on",
      }, value(form, "productId") || undefined);
      return redirect(`/admin/products/${encodeURIComponent(product.id)}?saved=1`, { status: 303, headers: adminHeaders });
    }
    if (intent === "save-stock") updateInventory([{ variantId: value(form, "variantId"), stock: Number(value(form, "stock")) }]);
    else if (intent === "archive-product" || intent === "restore-product") {
      archiveProduct(value(form, "productId"), intent === "archive-product");
      return redirect("/admin/products", { status: 303, headers: adminHeaders });
    } else if (intent === "save-promo") {
      const type = value(form, "discountType");
      const amount = Number(value(form, "amount"));
      const minimum = Number(value(form, "minSubtotal"));
      if (!Number.isFinite(amount) || !Number.isFinite(minimum) || Math.abs(minimum * 100 - Math.round(minimum * 100)) > 0.000001 || (type === "fixed" && Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001)) throw new AdminDataError("Use a valid amount with at most two decimal places.");
      savePromo({ code: value(form, "code"), discountType: type, amount: type === "fixed" ? Math.round(amount * 100) : amount, minSubtotalCents: Math.round(minimum * 100), usageLimit: value(form, "usageLimit") || null, expiresAt: value(form, "expiresAt") ? `${value(form, "expiresAt")}T23:59:59Z` : null, active: form.get("active") === "on" });
    } else if (intent === "toggle-promo") setPromoActive(value(form, "code"), value(form, "active") === "true");
    else if (intent === "update-order") updateOrderStatus(value(form, "orderId"), value(form, "status") as AdminOrderStatus);
    else if (intent !== "save-stock") throw new AdminDataError("This action is not supported.");
    return data({ success: "Your changes have been saved." }, { headers: adminHeaders });
  } catch (error) {
    if (uploaded) await removeFailedUpload(uploaded.file);
    const isDuplicate = error && typeof error === "object" && "code" in error && error.code === "P2002";
    const message = isDuplicate ? "That product URL, phone number, SKU, or barcode already exists." : error instanceof ZodError ? error.issues.map(issue => `${issue.path.join(" ")}: ${issue.message}`).slice(0, 3).join(". ") : error instanceof CommerceError || error instanceof AdminDataError ? error.message : "Your changes could not be saved. Check the details and try again.";
    return data({ error: message }, { status: error instanceof AdminDataError || error instanceof CommerceError ? error.status : 400, headers: adminHeaders });
  }
}

export default function AdminRoute() {
  const state = useLoaderData<typeof loader>();
  const action = useActionData<{ csrfToken?: string }>();
  if (state.login) return <AdminLogin csrfToken={action?.csrfToken || state.csrfToken} configured={state.configured} localEmail={state.localEmail} />;
  if (state.commerce) return <CommerceApp snapshot={state.snapshot} csrfToken={state.csrfToken} email={state.email} />;
  return <AdminPanel data={state} />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return <main className="bg-admin bg-admin-error"><h1>{status === 404 ? "This admin page was not found." : status === 403 ? "Admin access is available on this computer." : "This page could not be opened."}</h1><p>{status === 403 ? "Use the local preview to manage the store. Live admin hosting has not been configured." : "Return to the admin panel and try again."}</p><Link to="/admin">Back to admin</Link> · <Link to="/">Storefront</Link></main>;
}
