import { execFileSync } from "node:child_process";
import { isIP } from "node:net";
import { getPublicPagePaths } from "../src/config/seo.ts";
import { buildSitemap, xmlEscape } from "../src/config/sitemap.ts";
import { buildLlms } from "../src/config/llms.ts";

export { xmlEscape };

/** Public URLs deliberately cannot point to a local preview or include private URL data. */
export function publicSiteOrigin(value = "") {
  const input = value.trim();
  if (!input) return "";
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("VITE_PUBLIC_SITE_URL must be a valid public HTTPS origin.");
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || url.port || !hostname.includes(".") || isIP(hostname) ||
      /(?:^|\.)(?:localhost|local|internal)$/.test(hostname) ||
      !hostname.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    throw new Error("VITE_PUBLIC_SITE_URL must be a public HTTPS origin with no path, port, query, fragment or credentials.");
  }
  return url.origin;
}

const commonSources = [
  "src/root.tsx", "src/config/business.ts", "src/config/seo.ts", "src/i18n/Locale.tsx",
  "src/components/Layout.tsx", "src/components/Footer.tsx",
];

/** Content dependencies, rather than the build date, determine a URL's modification date. */
export function contentSources(path) {
  const shared = [...commonSources];
  if (path === "/") return [...shared, "src/routes/home.tsx", "src/pages/Home.tsx", "src/components/HeroSection.tsx", "src/components/CornerTiles.tsx", "src/components/Favorites.tsx", "src/data/products.ts"];
  if (path === "/shop" || path.startsWith("/category/")) return [...shared, "src/routes/shop.tsx", "src/routes/category.tsx", "src/pages/Shop.tsx", "src/data/products.ts"];
  if (path.startsWith("/product/")) return [...shared, "src/routes/product.tsx", "src/pages/ProductDetail.tsx", "src/data/products.ts"];
  if (path === "/brands") return [...shared, "src/routes/brands.tsx", "src/pages/Brands.tsx", "src/data/brands.ts"];
  if (path === "/faq") return [...shared, "src/routes/faq.tsx", "src/data/faqs.ts"];
  if (path.startsWith("/help/")) return [...shared, "src/routes/help.tsx", "src/pages/Info.tsx", "src/data/faqs.ts"];
  return [...shared, `src/routes/${path.slice(1)}.tsx`, "src/pages/Info.tsx"];
}

export function gitLastModified(path, cwd) {
  try {
    const result = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...contentSources(path)], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}T/.test(result) && !Number.isNaN(Date.parse(result)) ? result : undefined;
  } catch {
    // Source archives do not necessarily contain .git; omit lastmod rather than fabricate it.
    return undefined;
  }
}

/** A deterministic API used by the build and regression tests. No files are written here. */
export function generateSeoOutputs({ siteUrl = "", catalogVerified = false, lastModified = () => undefined } = {}) {
  const origin = publicSiteOrigin(siteUrl);
  const paths = getPublicPagePaths({ catalogVerified });
  const robots = [
    "# Public pages, including supported AI/search crawlers, may be crawled.",
    "# Utility pages carry noindex in HTML; they are crawlable so crawlers can read it.",
    "User-agent: *", "Allow: /",
    ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : ["# Set VITE_PUBLIC_SITE_URL to the confirmed production HTTPS origin to publish a sitemap."]),
    "",
  ].join("\n");
  // The deployed site serves a live /sitemap.xml (src/routes/sitemap.tsx); this static version is
  // kept for the tests and as the format reference.
  const sitemap = origin ? buildSitemap(paths, origin, lastModified) : null;
  // Like the sitemap, the deployed site serves llms.txt live (src/routes/llms.tsx) so it can leave
  // out empty categories; this version is kept for the tests.
  const llms = buildLlms({ origin, catalogVerified });
  return { robots, sitemap, llms, paths, origin };
}
