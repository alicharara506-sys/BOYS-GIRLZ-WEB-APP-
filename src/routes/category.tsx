import { categories, matchesCategory } from "../data/products";
import { languageFromMatches, pageMeta } from "../config/meta";
import { customCategorySeo } from "../config/seo";
import { storefrontCatalog } from "../server/commerce/queries.server";
import { storefrontSite } from "../server/site.server";
import type { SiteCategory } from "../domain/menu";
import type { Route } from "./+types/category";
import type { ShouldRevalidateFunctionArgs } from "react-router";

// A built-in section (Boys, Girls, Sale…) by its address, or null.
function builtIn(slug: string | undefined) {
  return categories.find((c) => c.toLowerCase() === slug) || null;
}

// On the server, count the category's live products so an empty category can be kept out of
// search results (an indexed page with nothing on it reads as a soft 404). A category the owner
// added in the admin (Menu & categories) is found by its web address.
export async function loader({ params }: Route.LoaderArgs) {
  const category = builtIn(params.category);
  const custom: SiteCategory | null = category ? null : (await storefrontSite()).categories.find((c) => c.slug === params.category) || null;
  if (!category && !custom) throw new Response("Category not found", { status: 404 });
  const catalog = await storefrontCatalog().catch(() => undefined);
  const productCount = catalog
    ? catalog.products.filter((product) => (category ? matchesCategory(product, category) : product.productType === custom!.name)).length
    : undefined;
  return { category, custom, productCount };
}
// Switching between built-in sections in the browser needs no trip to the server; the owner's own
// categories are looked up on the server.
export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  const category = builtIn(params.category);
  if (category) return { category, custom: null as SiteCategory | null, productCount: undefined as number | undefined };
  return serverLoader();
}
export const meta: Route.MetaFunction = ({ data, params, matches }) => {
  const language = languageFromMatches(matches);
  const indexable = data?.productCount === 0 ? false : undefined;
  if (data?.custom) return pageMeta("", "", `/category/${params.category}`, language, { indexable, page: customCategorySeo(data.custom, language) });
  return pageMeta(data?.category ? `Shop ${data.category}` : "Category", `Explore ${data?.category || "children's"} clothing and little essentials at Boys & Girlz in Lebanon.`, `/category/${params.category}`, language, { indexable });
};
// Filters only change the search; the category itself is already loaded.
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}
export default function CategoryPage() { return null; }
