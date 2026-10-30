import { execFileSync } from "node:child_process";
import { isIP } from "node:net";
import { canonicalUrl, getPublicPagePaths } from "../src/config/seo.ts";

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

export function xmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
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

const readingLinks = [
  ["About Boys & Girlz", "/about"], ["Browse the shop", "/shop"],
  ["Boys' clothing", "/category/boys"], ["Girls' clothing", "/category/girls"],
  ["Baby and unisex clothing", "/category/unisex"], ["Accessories", "/category/accessories"],
  ["Maternity clothing", "/category/maternity"], ["Toys", "/category/toys"],
  ["Like New outlet", "/category/outlet"], ["Brands", "/brands"],
  ["Delivery information", "/help/shipping"], ["Returns information", "/help/returns"],
  ["Sizing information", "/help/sizing"], ["Frequently asked questions", "/faq"],
  ["Contact the shop", "/contact"],
];

/** A deterministic API used by the build and regression tests. No files are written here. */
export function generateSeoOutputs({ siteUrl = "", catalogVerified = false, lastModified = () => undefined } = {}) {
  const origin = publicSiteOrigin(siteUrl);
  const paths = getPublicPagePaths({ catalogVerified });
  const robots = [
    "# Public pages, including supported AI/search crawlers, may be crawled.",
    "# Utility pages carry noindex in HTML; they are crawlable so crawlers can read it.",
    "User-agent: *", "Allow: /",
    ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : ["# TODO: Set VITE_PUBLIC_SITE_URL to the confirmed production HTTPS origin to publish a sitemap."]),
    "",
  ].join("\n");
  const sitemap = origin ? [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...paths.flatMap((path) => {
      const modified = lastModified(path);
      const validModified = modified && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(modified) && !Number.isNaN(Date.parse(modified));
      return ["en", "ar"].map((language) => {
        const links = [
          ["en", canonicalUrl(path, "en", origin)],
          ["ar", canonicalUrl(path, "ar", origin)],
          ["x-default", canonicalUrl(path, "en", origin)],
        ];
        return `  <url>\n    <loc>${xmlEscape(canonicalUrl(path, language, origin))}</loc>\n${validModified ? `    <lastmod>${xmlEscape(modified)}</lastmod>\n` : ""}${links.map(([locale, href]) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(href)}" />`).join("\n")}\n  </url>`;
      });
    }),
    "</urlset>", "",
  ].join("\n") : null;
  const llms = [
    "# Boys & Girlz", "",
    "> Boys & Girlz is a Lebanon-based shop for children's clothing, baby items, toys, accessories and maternity wear.", "",
    "The shop also has a Like New outlet for pre-owned items in excellent condition at reduced prices. Delivery is within Lebanon. Cash on Delivery is available.", "",
    ...(!catalogVerified ? ["The website currently contains a preview catalog. Product listings, prices and availability must be confirmed with the shop before ordering.", ""] : []),
    "## Main pages", "",
    ...readingLinks.map(([label, path]) => `- [${label}](${origin}${path})`), "",
    "## Arabic", "",
    `- [Arabic storefront](${origin}/?lang=ar)`,
    `- [Arabic frequently asked questions](${origin}/faq?lang=ar)`, "",
    "## Verified information", "",
    "For current delivery timing, returns terms, product measurements and availability, use the contact page. No founding date, physical shop address or opening hours are stated here without confirmation.", "",
    ...(!origin ? ["<!-- TODO: Set VITE_PUBLIC_SITE_URL to the confirmed production HTTPS origin. Links are relative until then. -->", ""] : []),
  ].join("\n");
  return { robots, sitemap, llms, paths, origin };
}
