import ProductDetail from "../pages/ProductDetail";

import {
  languageFromMatches,
  managedProductMeta,
  pageMeta,
} from "../config/meta";

import type { Route } from "./+types/product";

import { storefrontCatalog } from "../server/commerce/queries.server";
export async function loader({ params }: Route.LoaderArgs) {
  const catalog = await storefrontCatalog();
  const managed = true;
  const product = managed
    ? catalog.products.find((item) => item.id === params.id)
    : undefined;
  if (!product) throw new Response("Product not found", { status: 404 });
  return {
    name: product.name,
    description: product.description,
    id: product.id,
    category: product.category,
    managed,
  };
}
export const meta: Route.MetaFunction = ({ data, matches }) =>
  data?.managed
    ? managedProductMeta(data, languageFromMatches(matches))
    : pageMeta(
        data?.name || "Product",
        data?.description ||
          "Shop children's clothing and accessories at Boys & Girlz.",
        `/product/${data?.id || ""}`,
        languageFromMatches(matches),
      );
export default ProductDetail;
