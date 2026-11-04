import { categories } from "../data/products";
import { languageFromMatches, pageMeta } from "../config/meta";
import type { Route } from "./+types/category";
import type { ShouldRevalidateFunctionArgs } from "react-router";
function findCategory(slug: string | undefined) {
  const category = categories.find((c) => c.toLowerCase() === slug);
  if (!category) throw new Response("Category not found", { status: 404 });
  return { category };
}
export function loader({ params }: Route.LoaderArgs) {
  return findCategory(params.category);
}
// Switching category in the browser needs no trip to the server.
export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return findCategory(params.category);
}
export const meta: Route.MetaFunction = ({ data, params, matches }) =>
  pageMeta(data ? `Shop ${data.category}` : "Category", `Explore ${data?.category || "children's"} clothing and little essentials at Boys & Girlz in Lebanon.`, `/category/${params.category}`, languageFromMatches(matches));
// Filters only change the search; the category itself is already loaded.
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname === nextUrl.pathname ? false : defaultShouldRevalidate;
}
export default function CategoryPage() { return null; }
