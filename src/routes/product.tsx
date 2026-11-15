import ProductDetail from "../pages/ProductDetail";

import {
  languageFromMatches,
  managedProductMeta,
  pageMeta,
} from "../config/meta";

import type { Route } from "./+types/product";

import { storefrontCatalog } from "../server/commerce/queries.server";

// Products come from the live catalogue. The page meta gets what search engines need for a
// Product result: price, condition, brand, photo and whether it can be bought right now.
export async function loader({ params }: Route.LoaderArgs) {
  const catalog = await storefrontCatalog();
  const product = catalog.products.find((item) => item.id === params.id);
  if (!product) throw new Response("Product not found", { status: 404 });
  // Same rule as the product page's "sold out" state, so the markup matches what shoppers see.
  const inStock = product.available !== false && !(product.productType === "shoes" && product.sizes.length === 0);
  // With color details, the product is in stock while at least one color is (see the catalogue).
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    condition: product.condition,
    brand: product.brand,
    imageUrl: product.imageUrl,
    inStock,
    nameAr: product.nameAr,
    descriptionAr: product.descriptionAr,
  };
}

export const meta: Route.MetaFunction = ({ data, matches }) =>
  data
    ? managedProductMeta(data, languageFromMatches(matches))
    : // No such product: describe a missing page, not a product.
      pageMeta("Page not found", "", "/not-found", languageFromMatches(matches));

export default ProductDetail;
