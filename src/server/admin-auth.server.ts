import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCookieSessionStorage, redirect } from "react-router";

const scryptKey = (password: string, salt: Buffer) => new Promise<Buffer>((resolveKey, reject) => {
  scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
    if (error) reject(error);
    else resolveKey(key);
  });
});
const SESSION_SECONDS = 8 * 60 * 60;
const PREAUTH_SECONDS = 15 * 60;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_SESSIONS = 128;
const COOKIE_NAME = "bng-local-admin";
const activeSessions = new Map<string, { email: string; expiresAt: number }>();
// One local owner account is supported. A single bounded limiter prevents bypassing
// the limit by changing email addresses or supplying untrusted forwarding headers.
let failures: number[] = [];
let pendingAttempts = 0;

export const adminHeaders: Record<string, string> = {
  "Cache-Control": "no-store, private",
  "Pragma": "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
};

type Credentials = { email: string; passwordHash: string; sessionSecret: string };
type AdminSession = { csrfToken: string; preauthExpiresAt: number; sid: string; email: string; expiresAt: number };
export type AdminUser = { email: string; csrfToken: string };
export type AdminLoginState = { configured: boolean; csrfToken: string; headers: Headers; email?: string };

function authResponse(message: string, status: number, extraHeaders?: HeadersInit, csrfToken?: string) {
  const headers = new Headers(adminHeaders);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify({ error: message, ...(csrfToken ? { csrfToken } : {}) }), { status, headers });
}

function assertLocal(request: Request) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(url.protocol) || !["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw authResponse("Admin access is available only in the local preview.", 403);
  }
  return url;
}

function assertPostOrigin(request: Request) {
  const url = assertLocal(request);
  if (request.method.toUpperCase() !== "POST") {
    throw authResponse("This action requires a POST request.", 405, { Allow: "POST" });
  }
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (origin !== url.origin || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")) {
    throw authResponse("This request could not be verified. Reload the page and try again.", 403);
  }
}

async function credentials(): Promise<Credentials | null> {
  try {
    const filename = resolve(process.env.BNG_ADMIN_DATA_DIR || resolve(process.cwd(), ".data"), "admin-credentials.json");
    const value: unknown = JSON.parse(await readFile(filename, "utf8"));
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<Credentials>;
    if (typeof candidate.email !== "string" || candidate.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email) ||
      typeof candidate.passwordHash !== "string" || !parseHash(candidate.passwordHash) ||
      typeof candidate.sessionSecret !== "string" || candidate.sessionSecret.length < 32) return null;
    return { email: candidate.email.trim().toLowerCase(), passwordHash: candidate.passwordHash, sessionSecret: candidate.sessionSecret };
  } catch {
    return null;
  }
}

function parseHash(encoded: string) {
  const [algorithm, cost, blockSize, parallelism, salt, key, extra] = encoded.split("$");
  if (algorithm !== "scrypt" || cost !== "32768" || blockSize !== "8" || parallelism !== "1" || extra !== undefined ||
    !/^[A-Za-z0-9_-]{22}$/.test(salt || "") || !/^[A-Za-z0-9_-]{86}$/.test(key || "")) return null;
  const saltBytes = Buffer.from(salt, "base64url");
  const keyBytes = Buffer.from(key, "base64url");
  if (saltBytes.length !== 16 || keyBytes.length !== 64) return null;
  return { salt: saltBytes, key: keyBytes };
}

export async function hashAdminPassword(password: string): Promise<string> {
  if (password.length < 16 || password.length > 1024) throw new Error("The admin password must contain between 16 and 1024 characters.");
  const salt = randomBytes(16);
  const key = await scryptKey(password, salt);
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, encoded: string): Promise<boolean> {
  const parsed = parseHash(encoded);
  if (!parsed || typeof password !== "string" || password.length > 1024) return false;
  try {
    const key = await scryptKey(password, parsed.salt);
    return timingSafeEqual(key, parsed.key);
  } catch {
    return false;
  }
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
}

function storage(config: Credentials) {
  return createCookieSessionStorage<AdminSession>({ cookie: {
    name: COOKIE_NAME,
    secrets: [config.sessionSecret],
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
  } });
}

function prune() {
  const now = Date.now();
  failures = failures.filter((time) => time > now - FAILURE_WINDOW_MS);
  for (const [id, session] of activeSessions) if (session.expiresAt <= now) activeSessions.delete(id);
}

async function readSession(request: Request, config: Credentials) {
  const sessionStorage = storage(config);
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return { session, sessionStorage };
}

function authenticated(session: Awaited<ReturnType<typeof readSession>>["session"], config: Credentials): AdminUser | null {
  prune();
  const sid = session.get("sid");
  const stored = sid ? activeSessions.get(sid) : undefined;
  const email = session.get("email");
  const csrfToken = session.get("csrfToken");
  const expiresAt = session.get("expiresAt");
  if (!stored || email !== config.email || stored.email !== email || !csrfToken || !expiresAt || expiresAt <= Date.now()) return null;
  return { email, csrfToken };
}

export async function getLoginState(request: Request): Promise<AdminLoginState> {
  const url = assertLocal(request);
  const config = await credentials();
  const headers = new Headers(adminHeaders);
  if (!config) return { configured: false, csrfToken: "", headers };
  const { session, sessionStorage } = await readSession(request, config);
  const user = authenticated(session, config);
  if (user) return { configured: true, ...user, headers };
  if (!session.get("csrfToken") || !session.get("preauthExpiresAt") || session.get("preauthExpiresAt")! <= Date.now()) {
    session.unset("sid");
    session.unset("email");
    session.unset("expiresAt");
    session.set("csrfToken", randomBytes(32).toString("base64url"));
    session.set("preauthExpiresAt", Date.now() + PREAUTH_SECONDS * 1000);
  }
  headers.set("Set-Cookie", await sessionStorage.commitSession(session, { maxAge: PREAUTH_SECONDS, secure: url.protocol === "https:" }));
  return { configured: true, csrfToken: session.get("csrfToken")!, headers };
}

export async function requireAdmin(request: Request): Promise<AdminUser> {
  assertLocal(request);
  const config = await credentials();
  if (config) {
    const { session } = await readSession(request, config);
    const user = authenticated(session, config);
    if (user) return user;
  }
  throw redirect("/admin/login", { status: 302, headers: adminHeaders });
}

function verifyCsrf(formData: FormData, expected: string) {
  const received = formData.get("csrfToken");
  if (typeof received !== "string" || received.length > 256 || !safeEqual(received, expected)) {
    throw authResponse("This request could not be verified. Reload the page and try again.", 403);
  }
}

export async function requireAdminMutation(request: Request, formData: FormData): Promise<AdminUser> {
  assertPostOrigin(request);
  const user = await requireAdmin(request);
  verifyCsrf(formData, user.csrfToken);
  return user;
}

export async function loginAdmin(request: Request, formData: FormData): Promise<Response> {
  assertPostOrigin(request);
  const config = await credentials();
  if (!config) return authResponse("Local admin access has not been configured.", 503);
  const { session, sessionStorage } = await readSession(request, config);
  const csrfToken = session.get("csrfToken");
  const validUser = authenticated(session, config);
  if (!csrfToken || (!validUser && (!session.get("preauthExpiresAt") || session.get("preauthExpiresAt")! <= Date.now()))) {
    throw authResponse("The login form has expired. Reload it and try again.", 403);
  }
  verifyCsrf(formData, csrfToken);
  const existingExpiry = validUser ? session.get("expiresAt")! : session.get("preauthExpiresAt")!;
  const errorCookie = await sessionStorage.commitSession(session, {
    maxAge: Math.max(1, Math.ceil((existingExpiry - Date.now()) / 1000)),
    secure: new URL(request.url).protocol === "https:",
  });
  prune();
  if (failures.length + pendingAttempts >= MAX_FAILURES) {
    const retryAfter = Math.max(1, Math.ceil(((failures[0] || Date.now()) + FAILURE_WINDOW_MS - Date.now()) / 1000));
    return authResponse("Too many sign-in attempts. Please try again in 15 minutes.", 429, { "Retry-After": String(retryAfter), "Set-Cookie": errorCookie }, csrfToken);
  }
  const submittedEmail = formData.get("email");
  const password = formData.get("password");
  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase().slice(0, 255) : "";
  // Password verification runs even when the submitted email differs.
  pendingAttempts += 1;
  let passwordMatches: boolean;
  try {
    passwordMatches = await verifyAdminPassword(typeof password === "string" ? password : "", config.passwordHash);
  } finally {
    pendingAttempts -= 1;
  }
  if (!safeEqual(email, config.email) || !passwordMatches) {
    if (failures.length < MAX_FAILURES) failures.push(Date.now());
    return authResponse("The email or password is incorrect.", 401, { "Set-Cookie": errorCookie }, csrfToken);
  }
  failures = [];
  const oldSid = session.get("sid");
  if (oldSid) activeSessions.delete(oldSid);
  if (activeSessions.size >= MAX_SESSIONS) activeSessions.delete(activeSessions.keys().next().value!);
  const sid = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  activeSessions.set(sid, { email: config.email, expiresAt });
  session.set("sid", sid);
  session.set("email", config.email);
  session.set("expiresAt", expiresAt);
  session.set("csrfToken", randomBytes(32).toString("base64url"));
  session.unset("preauthExpiresAt");
  return redirect("/admin", { status: 303, headers: {
    ...adminHeaders,
    "Set-Cookie": await sessionStorage.commitSession(session, { maxAge: SESSION_SECONDS, secure: new URL(request.url).protocol === "https:" }),
  } });
}

export async function logoutAdmin(request: Request): Promise<Response> {
  assertPostOrigin(request);
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw authResponse("The submitted form could not be read.", 400);
  }
  await requireAdminMutation(request, formData);
  const config = await credentials();
  if (!config) return redirect("/admin/login", { status: 303, headers: adminHeaders });
  const { session, sessionStorage } = await readSession(request, config);
  const sid = session.get("sid");
  if (sid) activeSessions.delete(sid);
  return redirect("/admin/login", { status: 303, headers: {
    ...adminHeaders,
    "Set-Cookie": await sessionStorage.destroySession(session, { secure: new URL(request.url).protocol === "https:" }),
  } });
}
