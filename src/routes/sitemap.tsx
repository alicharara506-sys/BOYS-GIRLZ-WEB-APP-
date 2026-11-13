import { business } from "../config/business";
import { getPublicPagePaths } from "../config/seo";
import { buildSitemap } from "../config/sitemap";
import { categories, matchesCategory } from "../data/products";
import { storefrontCatalog } from "../server/commerce/queries.server";

// The live sitemap: the site's pages, minus any category with no products right now, plus every
// live product once the shop has verified the catalogue (VITE_CATALOG_VERIFIED=true).
export async function loader() {
  if (!business.siteUrl) return new Response("Not found", { status: 404 });
  const catalog = await storefrontCatalog().catch(() => undefined);
  const empty = new Set(catalog
    ? categories.filter((category) => !catalog.products.some((product) => matchesCategory(product, category))).map((category) => `/category/${category.toLowerCase()}`)
    : []);
  const pages = getPublicPagePaths().filter((path) => !empty.has(path));
  const products = business.catalogVerified && catalog ? catalog.products.map((product) => `/product/${product.id}`) : [];
  return new Response(buildSitemap([...pages, ...products], business.siteUrl), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
