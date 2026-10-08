import { createHmac } from "node:crypto";
import type postgres from "postgres";
import { z } from "zod";
import { getConnection } from "./postgres.server";

const email = z.email().max(254).transform((value) => value.trim().toLowerCase());
export const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email,
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(300).optional(),
});
export const newsletterSchema = z.object({ email, website: z.string().max(300).optional() });
export class FormRateLimitError extends Error {}

async function limit(scope: string, subject: string, sql: postgres.TransactionSql) {
  const key = process.env.FORM_RATE_LIMIT_KEY;
  if (!key) throw new Error("FORM_RATE_LIMIT_KEY is required for public forms");
  const hash = createHmac("sha256", key).update(`${scope}:${subject}`).digest("hex");
  await sql`select pg_advisory_xact_lock(hashtext(${hash}))`;
  const [row] = await sql`
    select count(*)::integer as count from public.form_attempts
    where scope = ${scope} and subject_hash = ${hash}
      and created_at > now() - interval '30 minutes'
  `;
  if (Number(row.count) >= 5) throw new FormRateLimitError("Please wait before trying again.");
  await sql`insert into public.form_attempts (scope, subject_hash) values (${scope}, ${hash})`;
}

export async function savePublicForm(kind: "contact" | "newsletter", request: Request) {
  const form = await request.formData();
  const raw = Object.fromEntries(form);
  const parsed = kind === "contact" ? contactSchema.parse(raw) : newsletterSchema.parse(raw);
  if (parsed.website) return;
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const sql = getConnection();
  await sql.begin(async (tx) => {
    await limit(kind, `email:${parsed.email}`, tx);
    await limit(kind, `ip:${ip}`, tx);
    if (kind === "newsletter") {
      await tx`insert into public.newsletter_subscribers (email) values (${parsed.email}) on conflict (email) do nothing`;
    } else {
      const contact = parsed as z.infer<typeof contactSchema>;
      await tx`insert into public.contact_messages (full_name, email, message) values (${contact.fullName}, ${contact.email}, ${contact.message})`;
    }
  });
}
