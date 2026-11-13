import { categories, matchesCategory } from "../data/products";
import { languageFromMatches, pageMeta } from "../config/meta";
import { storefrontCatalog } from "../server/commerce/queries.server";
import type { Route } from "./+types/category";
import type { ShouldRevalidateFunctionArgs } from "react-router";
function findCategory(slug: string | undefined) {
  const category = categories.find((c) => c.toLowerCase() === slug);
  if (!category) throw new Response("Category not found", { status: 404 });
  return { category };
}
// On the server, count the category's live products so an empty category can be kept out of
// search results (an indexed page with nothing on it reads as a soft 404).
export async function loader({ params }: Route.LoaderArgs) {
  const { category } = findCategory(params.category);
  const catalog = await storefrontCatalog().catch(() => undefined);
  const productCount = catalog ? catalog.products.filter((product) => matchesCategory(product, category)).length : undefined;
  return { category, productCount };
}
// Switching category in the browser needs no trip to the server.
export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { ...findCategory(params.category), productCount: undefined as number | undefined };
}
export const meta: Route.MetaFunction = ({ data, params, matches }) =>
  pageMeta(data ? `Shop ${data.category}` : "Category", `Explore ${data?.category || "children's"} clothing and little essentials at Boys & Girlz in Lebanon.`, `/category/${params.category}`, languageFromMatches(matches), { indexable: data?.productCount === 0 ? false : undefined });
// Filters only change the search; the category itself is already loaded.
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}
export default function CategoryPage() { return null; }
