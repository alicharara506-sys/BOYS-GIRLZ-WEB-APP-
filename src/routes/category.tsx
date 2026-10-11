import Shop from "../pages/Shop";
import { categories } from "../data/products";
import { languageFromMatches, pageMeta } from "../config/meta";
import type { Route } from "./+types/category";
export function loader({ params }: Route.LoaderArgs) {
  const category = categories.find((c) => c.toLowerCase() === params.category);
  if (!category) throw new Response("Category not found", { status: 404 });
  return { category };
}
export const meta: Route.MetaFunction = ({ data, params, matches }) =>
  pageMeta(data ? `Shop ${data.category}` : "Category", `Explore ${data?.category || "children's"} clothing and little essentials at Boys & Girlz in Lebanon.`, `/category/${params.category}`, languageFromMatches(matches));
export default Shop;
