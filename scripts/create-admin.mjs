import { randomBytes } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashAdminPassword } from "../src/server/admin-auth.server.ts";

const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
const directory = resolve(process.env.BNG_ADMIN_DATA_DIR || resolve(projectDirectory, ".data"));
const credentialPath = resolve(directory, "admin-credentials.json");
const loginPath = resolve(directory, "admin-login.txt");
const exists = async (path) => {
  try { await access(path); return true; } catch { return false; }
};

await mkdir(directory, { recursive: true, mode: 0o700 });
if (!await exists(credentialPath)) {
  if (await exists(loginPath)) throw new Error("A local login file exists without its credential file. Existing login files are never overwritten.");
  const email = (process.env.BNG_ADMIN_EMAIL || "owner@boysandgirlz.local").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("BNG_ADMIN_EMAIL must be a valid email address.");
  const password = randomBytes(24).toString("base64url");
  const value = { email, passwordHash: await hashAdminPassword(password), sessionSecret: randomBytes(48).toString("base64url") };
  try {
    await writeFile(credentialPath, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    await writeFile(loginPath, `Boys & Girlz local admin\n\nEmail: ${email}\nPassword: ${password}\n\nLocal sign-in: http://127.0.0.1:5181/admin/login\nKeep this file private. These credentials are for this computer's local preview only.\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    // Another bootstrap may have finished first. Never overwrite its credentials.
  }
}

// Do not print the email, password, hash or session secret into terminal logs.
console.log(credentialPath);
console.log(loginPath);
