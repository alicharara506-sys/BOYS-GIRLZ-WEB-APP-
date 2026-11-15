import { canonicalUrl } from "./seo.ts";

// Builds sitemap.xml with an English and an Arabic entry per page, each listing both language
// versions. Pure, so the live /sitemap.xml route and the build-time tests share one format.
export function xmlEscape(value: string) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function buildSitemap(paths: string[], origin: string, lastModified: (path: string) => string | undefined = () => undefined) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...paths.flatMap((path) => {
      const modified = lastModified(path);
      const validModified = modified && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(modified) && !Number.isNaN(Date.parse(modified));
      return (["en", "ar"] as const).map((language) => {
        const links = [
          ["en", canonicalUrl(path, "en", origin)],
          ["ar", canonicalUrl(path, "ar", origin)],
          ["x-default", canonicalUrl(path, "en", origin)],
        ];
        return `  <url>\n    <loc>${xmlEscape(canonicalUrl(path, language, origin))}</loc>\n${validModified ? `    <lastmod>${xmlEscape(modified)}</lastmod>\n` : ""}${links.map(([locale, href]) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(href)}" />`).join("\n")}\n  </url>`;
      });
    }),
    "</urlset>", "",
  ].join("\n");
}
