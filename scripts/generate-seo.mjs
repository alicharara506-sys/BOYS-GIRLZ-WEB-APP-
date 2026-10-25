import { writeFile, readFile, rm } from "node:fs/promises";
import { products, categories } from "../src/data/products.ts";

try {
  const envFile = await readFile(new URL("../.env", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {
  // A local .env file is optional.
}

const base = process.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
const paths = [
  "/", "/shop", "/about", "/brands", "/contact", "/faq",
  "/help/shipping", "/help/returns", "/help/sizing",
  ...categories.map((category) => `/category/${category.toLowerCase()}`),
  ...products.map((product) => `/product/${product.id}`),
];
const robots = [
  "User-agent: *",
  "Disallow: /cart",
  "Disallow: /checkout",
  "Disallow: /wishlist",
  ...(base ? [`Sitemap: ${base}/sitemap.xml`] : []),
  "",
].join("\n");
await writeFile(new URL("../public/robots.txt", import.meta.url), robots);

if (base) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(new URL("../public/sitemap.xml", import.meta.url), sitemap);
} else {
  await rm(new URL("../public/sitemap.xml", import.meta.url), { force: true });
  console.warn("VITE_PUBLIC_SITE_URL is unset; sitemap.xml and canonical URLs are deferred.");
}

await writeFile(
  new URL("../public/llms.txt", import.meta.url),
  `# Boys & Girlz\n\nBoys & Girlz is a Lebanon-based shop for children's clothing, baby items, toys, accessories and maternity wear. It also has a Like New outlet for pre-owned items in excellent condition at reduced prices.\n\nDelivery is within Lebanon only. Cash on Delivery is available. Free delivery applies to orders over $99.\n\nBrowse: /shop, /category/boys, /category/girls, /category/unisex, /category/accessories, /category/maternity, /category/toys, /category/outlet.\n\nContact: /contact. FAQs: /faq.\n`,
);
