import { writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defaultSiteUrl } from "../src/config/site.ts";
import { generateSeoOutputs, gitLastModified } from "./seo-output.mjs";

// Node's dotenv parser handles quotes/comments without printing configuration values.
try { process.loadEnvFile(); } catch (error) { if (error.code !== "ENOENT") throw error; }
const cwd = fileURLToPath(new URL("../", import.meta.url));
const outputs = generateSeoOutputs({
  siteUrl: process.env.VITE_PUBLIC_SITE_URL?.trim() || defaultSiteUrl,
  catalogVerified: process.env.VITE_CATALOG_VERIFIED === "true",
  lastModified: (path) => gitLastModified(path, cwd),
});
// sitemap.xml and llms.txt are served live (src/routes/sitemap.tsx, src/routes/llms.tsx) from the
// current catalogue, so any old static copies are removed: a file in public/ would be served first.
for (const [filename, content] of [["robots.txt", outputs.robots], ["llms.txt", null], ["sitemap.xml", null]]) {
  const file = new URL(`../public/${filename}`, import.meta.url);
  if (content === null) await rm(file, { force: true });
  else await writeFile(file, content);
}
