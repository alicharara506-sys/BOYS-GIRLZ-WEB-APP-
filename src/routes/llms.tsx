import { business } from "../config/business";
import { buildLlms } from "../config/llms";
import { categories, matchesCategory } from "../data/products";
import { storefrontCatalog } from "../server/commerce/queries.server";

// The live llms.txt: the same guide as before, minus any category with no products right now, so
// AI assistants aren't pointed at empty (noindex) pages. It also states the shop's address once set.
export async function loader() {
  const catalog = await storefrontCatalog().catch(() => undefined);
  const hiddenPaths = new Set(catalog
    ? categories.filter((category) => !catalog.products.some((product) => matchesCategory(product, category))).map((category) => `/category/${category.toLowerCase()}`)
    : []);
  const text = buildLlms({ origin: business.siteUrl, catalogVerified: business.catalogVerified, hiddenPaths, address: business.address, locality: business.locality });
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
