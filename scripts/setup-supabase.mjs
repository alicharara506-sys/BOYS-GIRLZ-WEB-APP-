import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
const url = process.env.DATABASE_URL;
if (!url || !/(?:\.supabase\.co|\.supabase\.com)$/.test(new URL(url).hostname))
  throw new Error(
    "Set DATABASE_URL to this Supabase project’s direct or session-pooler connection in .env.",
  );
const connection = new URL(url);
// Preserve explicit CA verification even when a copied URL includes sslmode.
for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
  connection.searchParams.delete(key);
const db = new Client({
  connectionString: connection.toString(),
  ssl: {
    ca: await readFile(
      new URL("../supabase/certs/prod-ca-2021.crt", import.meta.url),
      "utf8",
    ),
    rejectUnauthorized: true,
  },
});
await db.connect();
try {
  await db.query(
    "CREATE TABLE IF NOT EXISTS public.bng_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
  );
  await db.query(
    "REVOKE ALL ON public.bng_migrations FROM anon, authenticated",
  );
  for (const file of [
    "202611040001_shared_shop.sql",
    "202611040002_access_and_storage.sql",
  ]) {
    if (
      (
        await db.query("SELECT 1 FROM public.bng_migrations WHERE name=$1", [
          file,
        ])
      ).rowCount
    )
      continue;
    const sql = await readFile(
      new URL(`../supabase/migrations/${file}`, import.meta.url),
      "utf8",
    );
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query("INSERT INTO public.bng_migrations(name) VALUES($1)", [
        file,
      ]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
  console.log(
    "Supabase schema, policies and image bucket are ready. Add the owner Auth user’s UUID to public.owners in the Supabase SQL editor.",
  );
} finally {
  await db.end();
}
