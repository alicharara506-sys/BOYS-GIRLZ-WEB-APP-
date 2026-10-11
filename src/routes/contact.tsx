import { Contact } from "../pages/Info";
import { localizedMeta } from "../config/meta";
import { data } from "react-router";
import { ZodError } from "zod";
import { FormRateLimitError, savePublicForm } from "../server/forms.server";
import type { Route } from "./+types/contact";
export const meta = localizedMeta("Contact", "Contact Boys & Girlz about children's clothing, toys and delivery within Lebanon.", "/contact");
export async function action({ request }: Route.ActionArgs) {
  if (!process.env.DATABASE_URL || !process.env.FORM_RATE_LIMIT_KEY) {
    return data({ error: "Contact form is not available yet. Please use Instagram for now." }, { status: 503 });
  }
  try {
    await savePublicForm("contact", request);
    return data({ success: true });
  } catch (error) {
    if (error instanceof ZodError) return data({ error: "Please check your name, email and message." }, { status: 400 });
    if (error instanceof FormRateLimitError) return data({ error: error.message }, { status: 429 });
    throw error;
  }
}
export default Contact;
