import ProductDetail from "../pages/ProductDetail";
import { productById } from "../data/products";
import { languageFromMatches, managedProductMeta, pageMeta } from "../config/meta";
import { getStorefrontCatalog } from "../server/admin-data.server";
import type { Route } from "./+types/product";
export function loader({ params, request }: Route.LoaderArgs) {
  const hostname = new URL(request.url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
  // This SSR build exposes review data only on the local computer.
  const catalog = ["localhost", "127.0.0.1", "::1"].includes(hostname) ? getStorefrontCatalog() : null;
  const managed = catalog?.enabled === true;
  const product = managed ? catalog.products.find((item) => item.id === params.id) : productById(params.id || "");
  if (!product) throw new Response("Product not found", { status: 404 });
  return { name: product.name, description: product.description, id: product.id, category: product.category, managed };
}
export const meta: Route.MetaFunction = ({ data, matches }) =>
  data?.managed
    ? managedProductMeta(data, languageFromMatches(matches))
    : pageMeta(data?.name || "Product", data?.description || "Shop children's clothing and accessories at Boys & Girlz.", `/product/${data?.id || ""}`, languageFromMatches(matches));
export default ProductDetail;
