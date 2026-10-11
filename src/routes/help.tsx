import { Help } from "../pages/Info";
import { languageFromMatches, pageMeta } from "../config/meta";
import type { Route } from "./+types/help";
const topics = ["shipping", "returns", "sizing"];
export function loader({ params }: Route.LoaderArgs) {
  if (!topics.includes(params.topic || "")) throw new Response("Help topic not found", { status: 404 });
  return { topic: params.topic };
}
export const meta: Route.MetaFunction = ({ data, matches }) =>
  pageMeta(data?.topic ? `Help: ${data.topic}` : "Help", "Find helpful information about shopping with Boys & Girlz in Lebanon.", `/help/${data?.topic || ""}`, languageFromMatches(matches));
export default Help;
