import { data } from "react-router";
import { ZodError } from "zod";
import { FormRateLimitError, savePublicForm } from "../server/forms.server";
import type { Route } from "./+types/newsletter";

export async function action({ request }: Route.ActionArgs) {
  if (!process.env.DATABASE_URL || !process.env.FORM_RATE_LIMIT_KEY) {
    return data({ error: "Newsletter signup is not available yet." }, { status: 503 });
  }
  try {
    await savePublicForm("newsletter", request);
    return data({ success: true });
  } catch (error) {
    if (error instanceof ZodError) return data({ error: "Please enter a valid email address." }, { status: 400 });
    if (error instanceof FormRateLimitError) return data({ error: error.message }, { status: 429 });
    throw error;
  }
}

export function loader() { throw new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } }); }
