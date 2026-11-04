import EmbeddedPostgres from "embedded-postgres";
import { mkdir, access, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { Client } from "pg";

export async function localPostgres() {
  if (process.env.DATABASE_URL) return { stop: async () => {} };
  const directory = resolve(process.env.BNG_ADMIN_DATA_DIR || ".data");
  await mkdir(directory, { recursive: true });
  const secretFile = resolve(directory, "postgres-password.txt");
  let password;
  try {
    password = (await readFile(secretFile, "utf8")).trim();
  } catch {
    password = randomBytes(24).toString("hex");
    await writeFile(secretFile, password, { flag: "wx", mode: 0o600 });
  }
  const port = Number(process.env.BNG_POSTGRES_PORT || 55432);
  process.env.DATABASE_URL = `postgresql://bng:${password}@127.0.0.1:${port}/bng`;
  const ping = async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 1000,
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => {});
    }
  };
  if (await ping()) return { stop: async () => {} };
  const databaseDir = resolve(directory, "postgres");
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "bng",
    password,
    port,
    persistent: true,
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
    onError: () => {},
  });
  try {
    await access(resolve(databaseDir, "PG_VERSION"));
  } catch {
    console.log("Preparing local PostgreSQL (first run only)…");
    await pg.initialise();
  }
  await pg.start();
  const admin = new Client({
    host: "127.0.0.1",
    port,
    user: "bng",
    password,
    database: "postgres",
  });
  try {
    await admin.connect();
    if (
      !(await admin.query("SELECT 1 FROM pg_database WHERE datname='bng'"))
        .rowCount
    )
      await admin.query('CREATE DATABASE "bng"');
  } finally {
    await admin.end();
  }
  return { stop: () => pg.stop() };
}
