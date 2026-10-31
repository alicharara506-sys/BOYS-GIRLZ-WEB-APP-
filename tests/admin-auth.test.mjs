import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { after, before, test } from "node:test";
import { fileURLToPath, URL } from "node:url";
import { promisify } from "node:util";
import {
  adminHeaders, getLoginState, hashAdminPassword, loginAdmin, logoutAdmin,
  requireAdmin, requireAdminMutation, verifyAdminPassword,
} from "../src/server/admin-auth.server.ts";

const execFileAsync = promisify(execFile);
const { FormData, Request, Response } = globalThis;
const root = fileURLToPath(new URL("..", import.meta.url));
const originalDataDirectory = process.env.BNG_ADMIN_DATA_DIR;
let dataDirectory;
let credential;
let password;
let bootstrapOutput;
const base = "http://127.0.0.1:5181";
const cookieFrom = (headers) => headers.get("Set-Cookie")?.split(";", 1)[0] || "";
function form(values = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(values)) body.set(key, value);
  return body;
}
function request(path, { cookie = "", origin = base, method = "GET", body, urlBase = base } = {}) {
  return new Request(`${urlBase}${path}`, { method, headers: {
    ...(cookie ? { Cookie: cookie } : {}),
    ...(method === "POST" && origin !== null ? { Origin: origin } : {}),
  }, ...(body ? { body } : {}) });
}
async function preauth() {
  const state = await getLoginState(request("/admin/login"));
  assert.equal(state.configured, true);
  return { state, cookie: cookieFrom(state.headers) };
}
async function signedIn() {
  const { state, cookie } = await preauth();
  const response = await loginAdmin(request("/admin/login", { cookie, method: "POST" }), form({ csrfToken: state.csrfToken, email: credential.email, password }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/admin");
  const authCookie = cookieFrom(response.headers);
  const user = await requireAdmin(request("/admin", { cookie: authCookie }));
  return { cookie: authCookie, user, response };
}
async function rejected(operation, status) {
  await assert.rejects(operation, (error) => error instanceof Response && error.status === status);
}

before(async () => {
  dataDirectory = await mkdtemp(resolve(tmpdir(), "bng-admin-auth-"));
  process.env.BNG_ADMIN_DATA_DIR = dataDirectory;
  const result = await execFileAsync(process.execPath, ["scripts/create-admin.mjs"], { cwd: root, env: { ...process.env, BNG_ADMIN_DATA_DIR: dataDirectory } });
  bootstrapOutput = result.stdout;
  credential = JSON.parse(await readFile(resolve(dataDirectory, "admin-credentials.json"), "utf8"));
  const text = await readFile(resolve(dataDirectory, "admin-login.txt"), "utf8");
  password = text.match(/^Password: (.+)$/m)?.[1];
  assert.ok(password);
});

after(async () => {
  if (originalDataDirectory === undefined) delete process.env.BNG_ADMIN_DATA_DIR;
  else process.env.BNG_ADMIN_DATA_DIR = originalDataDirectory;
  // Delete only the exact temporary directory created by this test process.
  const target = resolve(dataDirectory);
  assert.equal(dirname(target), resolve(tmpdir()));
  assert.ok(basename(target).startsWith("bng-admin-auth-"));
  await rm(target, { recursive: true, force: true });
});

test("bootstrap stores only a salted password hash in credentials and never resets an existing account", async () => {
  assert.equal(credential.email, "owner@boysandgirlz.local");
  assert.match(credential.passwordHash, /^scrypt\$32768\$8\$1\$/);
  assert.ok(credential.sessionSecret.length >= 32);
  assert.equal(JSON.stringify(credential).includes(password), false);
  assert.equal(bootstrapOutput.includes(password), false);
  assert.equal(bootstrapOutput.includes(credential.sessionSecret), false);
  assert.deepEqual(bootstrapOutput.trim().split(/\r?\n/), [resolve(dataDirectory, "admin-credentials.json"), resolve(dataDirectory, "admin-login.txt")]);
  assert.equal(await verifyAdminPassword(password, credential.passwordHash), true);
  assert.equal(await verifyAdminPassword("wrong password", credential.passwordHash), false);
  assert.equal(await verifyAdminPassword(password, "invalid hash"), false);
  assert.notEqual(await hashAdminPassword(password), credential.passwordHash);
  const beforeCredentials = await readFile(resolve(dataDirectory, "admin-credentials.json"), "utf8");
  const beforeLogin = await readFile(resolve(dataDirectory, "admin-login.txt"), "utf8");
  await execFileAsync(process.execPath, ["scripts/create-admin.mjs"], { cwd: root, env: { ...process.env, BNG_ADMIN_EMAIL: "another@example.com" } });
  assert.equal(await readFile(resolve(dataDirectory, "admin-credentials.json"), "utf8"), beforeCredentials);
  assert.equal(await readFile(resolve(dataDirectory, "admin-login.txt"), "utf8"), beforeLogin);
});

test("unconfigured and unauthenticated requests do not reveal credentials; public hosts are refused", async () => {
  const saved = process.env.BNG_ADMIN_DATA_DIR;
  process.env.BNG_ADMIN_DATA_DIR = resolve(dataDirectory, "missing");
  const state = await getLoginState(request("/admin/login"));
  assert.equal(state.configured, false);
  assert.equal(state.csrfToken, "");
  process.env.BNG_ADMIN_DATA_DIR = saved;
  await rejected(() => requireAdmin(request("/admin")), 302);
  await rejected(() => getLoginState(request("/admin/login", { urlBase: "https://example.com" })), 403);
  await rejected(() => requireAdmin(request("/admin", { urlBase: "http://192.168.1.50:5181" })), 403);
  assert.match(adminHeaders["X-Robots-Tag"], /noindex/);
  assert.match(state.headers.get("Cache-Control"), /no-store/);
});

test("preauth cookies are signed, HttpOnly and SameSite=Lax; HTTPS enables Secure", async () => {
  const { state, cookie } = await preauth();
  assert.equal(state.email, undefined);
  assert.ok(state.csrfToken.length >= 32);
  const header = state.headers.get("Set-Cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  assert.match(header, /Path=\/(?:;|$)/);
  assert.match(header, /Max-Age=900/);
  assert.equal(/; Secure/i.test(header), false);
  assert.equal(JSON.stringify(state).includes(credential.passwordHash), false);
  const httpsState = await getLoginState(request("/admin/login", { urlBase: "https://localhost:5181" }));
  assert.match(httpsState.headers.get("Set-Cookie"), /; Secure/i);
  const changedCookie = `${cookie.slice(0, -1)}${cookie.endsWith("x") ? "y" : "x"}`;
  await rejected(() => requireAdmin(request("/admin", { cookie: changedCookie })), 302);
});

test("login requires same-origin POST and a CSRF token bound to its preauth cookie", async () => {
  const { state, cookie } = await preauth();
  const values = { csrfToken: state.csrfToken, email: credential.email, password };
  await rejected(() => loginAdmin(request("/admin/login", { cookie }), form(values)), 405);
  await rejected(() => loginAdmin(request("/admin/login", { cookie, method: "POST", origin: null }), form(values)), 403);
  await rejected(() => loginAdmin(request("/admin/login", { cookie, method: "POST", origin: "https://attacker.example" }), form(values)), 403);
  await rejected(() => loginAdmin(request("/admin/login", { method: "POST" }), form(values)), 403);
  await rejected(() => loginAdmin(request("/admin/login", { cookie, method: "POST" }), form({ ...values, csrfToken: "bad" })), 403);
  const other = await preauth();
  await rejected(() => loginAdmin(request("/admin/login", { cookie: other.cookie, method: "POST" }), form(values)), 403);
});

test("successful login rotates CSRF, protects mutations, and logout invalidates even a copied cookie", async () => {
  const { state } = await preauth();
  const { cookie, user, response } = await signedIn();
  assert.equal(user.email, credential.email);
  assert.notEqual(user.csrfToken, state.csrfToken);
  const tamperedCookie = `${cookie.slice(0, -1)}${cookie.endsWith("x") ? "y" : "x"}`;
  await rejected(() => requireAdmin(request("/admin", { cookie: tamperedCookie })), 302);
  assert.match(response.headers.get("Set-Cookie"), /Max-Age=28800/);
  const stateAfterLogin = await getLoginState(request("/admin/login", { cookie }));
  assert.equal(stateAfterLogin.email, credential.email);
  const values = form({ csrfToken: user.csrfToken });
  assert.deepEqual(await requireAdminMutation(request("/admin", { cookie, method: "POST" }), values), user);
  await rejected(() => requireAdminMutation(request("/admin", { cookie, method: "POST" }), form()), 403);
  await rejected(() => requireAdminMutation(request("/admin", { cookie, method: "POST", origin: "http://localhost:5181" }), values), 403);
  await rejected(() => logoutAdmin(request("/admin/logout", { cookie, method: "POST", body: form() })), 403);
  const loggedOut = await logoutAdmin(request("/admin/logout", { cookie, method: "POST", body: form({ csrfToken: user.csrfToken }) }));
  assert.equal(loggedOut.status, 303);
  assert.equal(loggedOut.headers.get("Location"), "/admin/login");
  assert.match(loggedOut.headers.get("Set-Cookie"), /Expires=Thu, 01 Jan 1970/i);
  await rejected(() => requireAdmin(request("/admin", { cookie })), 302);
});

test("sessions expire after eight hours and preauth expires after fifteen minutes", async () => {
  const { cookie } = await signedIn();
  const pre = await preauth();
  const now = Date.now;
  try {
    Date.now = () => now() + 8 * 60 * 60 * 1000 + 1;
    await rejected(() => requireAdmin(request("/admin", { cookie })), 302);
    await rejected(() => loginAdmin(request("/admin/login", { cookie: pre.cookie, method: "POST" }), form({ csrfToken: pre.state.csrfToken, email: credential.email, password })), 403);
  } finally {
    Date.now = now;
  }
});

test("five failed passwords trigger a bounded fifteen-minute login lockout", async () => {
  const { state, cookie } = await preauth();
  for (let i = 0; i < 5; i += 1) {
    const response = await loginAdmin(request("/admin/login", { cookie, method: "POST" }), form({ csrfToken: state.csrfToken, email: `unknown-${i}@example.com`, password: "incorrect password" }));
    assert.equal(response.status, 401);
  }
  const blocked = await loginAdmin(request("/admin/login", { cookie, method: "POST" }), form({ csrfToken: state.csrfToken, email: credential.email, password }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("Retry-After")) > 0);
  const now = Date.now;
  try {
    Date.now = () => now() + 16 * 60 * 1000;
    await signedIn();
  } finally {
    Date.now = now;
  }
});
