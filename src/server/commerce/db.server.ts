import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const globalDb = globalThis as typeof globalThis & {
  bngSupabasePrisma?: PrismaClient;
};
function client() {
  const url = process.env.DATABASE_URL;
  if (
    !url ||
    !/(?:\.supabase\.co|\.supabase\.com)$/.test(new URL(url).hostname)
  )
    throw new Error("Configure the shared Supabase database connection.");
  const reference = new URL(
    process.env.SUPABASE_URL || "https://unconfigured.supabase.co",
  ).hostname.split(".")[0];
  const connection = new URL(url);
  if (
    connection.hostname !== `db.${reference}.supabase.co` &&
    !decodeURIComponent(connection.username).endsWith(`.${reference}`)
  )
    throw new Error(
      "The database connection must belong to the same Supabase project as Auth and Storage.",
    );
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    connection.searchParams.delete(key);
  return (globalDb.bngSupabasePrisma ||= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connection.toString(),
      // Supabase's shared session pool is small; keep this app's pool bounded
      // so a full dashboard read can't exhaust the project's connections.
      max: 5,
      min: 1,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
      ssl: {
        ca: readFileSync(resolve("supabase/certs/prod-ca-2021.crt"), "utf8"),
        rejectUnauthorized: true,
      },
    }),
  }));
}
export const db = new Proxy({} as PrismaClient, {
  get(_target, key) {
    const instance = client();
    const value = Reflect.get(instance, key);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
export const commerceEnabled = () => true;
