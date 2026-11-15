import { randomBytes, timingSafeEqual, createHash } from "node:crypto";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { redirect } from "react-router";
import { supabaseConfig } from "./supabase.server";
export const adminHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
};
// Failed sign-ins, counted per email (5 tries) and per visitor address (20 tries) for 15 minutes.
// Only expired entries are removed, so nobody can wipe the counts by trying lots of fake emails.
const failures = new Map<string, { count: number; until: number }>();
const LOCK_MS = 15 * 60 * 1000;
const MAX_TRACKED = 5000;
function clientAddress(request: Request) {
  // Render's proxy appends the real visitor address last; earlier entries can be set by the visitor.
  const forwarded = (request.headers.get("x-forwarded-for") || "").split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded.at(-1) || "local";
}
function isLocked(key: string, limit: number, now: number) {
  const entry = failures.get(key);
  return Boolean(entry && entry.until > now && entry.count >= limit);
}
function recordFailure(key: string, now: number) {
  for (const [k, entry] of failures) if (entry.until <= now) failures.delete(k);
  const entry = failures.get(key);
  const count = entry && entry.until > now ? entry.count + 1 : 1;
  failures.delete(key);
  failures.set(key, { count, until: now + LOCK_MS });
  // Memory guard: drop the oldest entries only if far too many are still live.
  while (failures.size > MAX_TRACKED) failures.delete(failures.keys().next().value as string);
}
function context(request: Request) {
  const headers = new Headers({
    ...adminHeaders,
    "Content-Type": "application/json",
  });
  const { url, key } = supabaseConfig();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get("Cookie") || "").map((c) => ({
          name: c.name,
          value: c.value || "",
        })),
      setAll: (cookies) =>
        cookies.forEach((c) =>
          headers.append(
            "Set-Cookie",
            serializeCookieHeader(c.name, c.value, {
              ...c.options,
              httpOnly: true,
              sameSite: "lax",
              secure: new URL(request.url).protocol === "https:",
            }),
          ),
        ),
    },
  });
  return { headers, client };
}
function csrf(request: Request) {
  return (
    parseCookieHeader(request.headers.get("Cookie") || "").find(
      (c) => c.name === "bng-csrf",
    )?.value || ""
  );
}
function checkPost(request: Request, form: FormData) {
  const url = new URL(request.url);
  const received = String(form.get("csrfToken") || "");
  const expected = csrf(request);
  if (
    request.method !== "POST" ||
    request.headers.get("Origin") !== url.origin ||
    !expected ||
    !received ||
    !timingSafeEqual(
      createHash("sha256").update(received).digest(),
      createHash("sha256").update(expected).digest(),
    )
  )
    throw new Response(
      "The sign-in page expired or the request could not be verified. Reload and try again.",
      { status: 403, headers: adminHeaders },
    );
}
async function owner(client: ReturnType<typeof context>["client"]) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const allowed = await client
    .from("owners")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  return allowed.data ? user : null;
}
export async function getLoginState(request: Request) {
  const token = csrf(request) || randomBytes(32).toString("hex");
  let state;
  try {
    state = context(request);
  } catch {
    return {
      configured: false,
      csrfToken: "",
      headers: new Headers(adminHeaders),
      email: undefined,
    };
  }
  state.headers.append(
    "Set-Cookie",
    serializeCookieHeader("bng-csrf", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      maxAge: 28800,
    }),
  );
  const user = await owner(state.client);
  return {
    configured: true,
    csrfToken: token,
    headers: state.headers,
    email: user?.email,
  };
}
export async function requireAdmin(request: Request) {
  const state = context(request);
  const user = await owner(state.client);
  if (!user) throw redirect("/admin/login", { headers: state.headers });
  return {
    email: user.email || "Owner",
    id: user.id,
    csrfToken: csrf(request),
    headers: state.headers,
  };
}
export async function requireAdminMutation(request: Request, form: FormData) {
  checkPost(request, form);
  return requireAdmin(request);
}
export async function loginAdmin(request: Request, form: FormData) {
  checkPost(request, form);
  const state = context(request);
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const now = Date.now();
  const emailKey = `email:${email}`;
  const addressKey = `ip:${clientAddress(request)}`;
  if (isLocked(emailKey, 5, now) || isLocked(addressKey, 20, now))
    return new Response(
      JSON.stringify({ error: "Too many attempts. Try again in 15 minutes." }),
      { status: 429, headers: state.headers },
    );
  const { error } = await state.client.auth.signInWithPassword({
    email,
    password: String(form.get("password") || ""),
  });
  if (error || !(await owner(state.client))) {
    await state.client.auth.signOut();
    recordFailure(emailKey, Date.now());
    recordFailure(addressKey, Date.now());
    return new Response(
      JSON.stringify({
        error:
          "The login details are incorrect or this account is not the shop owner.",
      }),
      { status: 401, headers: state.headers },
    );
  }
  failures.delete(emailKey);
  return redirect("/admin", { status: 303, headers: state.headers });
}
export async function logoutAdmin(request: Request) {
  const form = await request.formData();
  checkPost(request, form);
  const state = context(request);
  await state.client.auth.signOut();
  return redirect("/admin/login", { status: 303, headers: state.headers });
}
