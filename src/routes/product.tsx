import ProductDetail from "../pages/ProductDetail";
import { productById } from "../data/products";
import { languageFromMatches, pageMeta } from "../config/meta";
import type { Route } from "./+types/product";
export function loader({ params }: Route.LoaderArgs) {
  const product = productById(params.id || "");
  if (!product) throw new Response("Product not found", { status: 404 });
  return { name: product.name, description: product.description, id: product.id };
}
export const meta: Route.MetaFunction = ({ data, matches }) =>
  pageMeta(data?.name || "Product", data?.description || "Shop children's clothing and accessories at Boys & Girlz.", `/product/${data?.id || ""}`, languageFromMatches(matches));
export default ProductDetail;
