import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { localPostgres } from "./local-postgres.mjs";
await mkdir(".data", { recursive: true });
process.env.BNG_ADMIN_DATA_DIR = await mkdtemp(resolve(".data/commerce-test-"));
process.env.BNG_POSTGRES_PORT = "55433";
delete process.env.DATABASE_URL;
const pg = await localPostgres();
const run = (args) =>
  new Promise((res, rej) => {
    const p = spawn(process.execPath, args, {
      env: process.env,
      stdio: "inherit",
    });
    p.on("exit", (c) =>
      c === 0 ? res() : rej(new Error(`Verification failed (${c}).`)),
    );
    p.on("error", rej);
  });
try {
  await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  await run(["--import", "tsx", "prisma/seed.ts"]);
  await run(["scripts/create-admin.mjs"]);
  await run([
    "--import",
    "tsx",
    "--test",
    "tests/commerce.integration.test.ts",
  ]);
  await run([
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "playwright.commerce.config.ts",
  ]);
} finally {
  await pg.stop();
}
