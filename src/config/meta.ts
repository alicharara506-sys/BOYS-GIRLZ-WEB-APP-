import type { MetaDescriptor } from "react-router";
import { business } from "./business";
import { breadcrumbStructuredData, canonicalUrl, getPageSeo, pageStructuredData, type SeoLanguage } from "./seo";

export function languageFromMatches(matches: readonly ({ id: string; data?: unknown } | undefined)[]): SeoLanguage {
  const root = matches.find((match) => match?.id === "root")?.data;
  return root && typeof root === "object" && "language" in root && root.language === "ar" ? "ar" : "en";
}

export function localizedMeta(_title: string, _description: string, path: string) {
  return ({ matches }: { matches: readonly ({ id: string; data?: unknown } | undefined)[] }) => buildPageMeta(path, languageFromMatches(matches));
}

export function pageMeta(_title: string, _description: string, path: string, language: SeoLanguage = "en"): MetaDescriptor[] {
  return buildPageMeta(path, language);
}

export function buildPageMeta(path: string, language: SeoLanguage = "en"): MetaDescriptor[] {
  const options = { catalogVerified: business.catalogVerified };
  const page = getPageSeo(path, language, options);
  const canonical = canonicalUrl(page.path, language, business.siteUrl);
  const image = `${business.siteUrl}/assets/boys-girlz-logo.jpg`;
  const breadcrumbs = breadcrumbStructuredData(page, language, business.siteUrl);
  const schema = pageStructuredData(page, language, business.siteUrl, options);
  return [
    { title: page.title },
    { name: "description", content: page.description },
    { name: "robots", content: page.indexable ? "index, follow, max-image-preview:large" : "noindex, follow" },
    { tagName: "link", rel: "canonical", href: canonical },
    ...(["en", "ar", "x-default"] as const).map((locale) => ({ tagName: "link" as const, rel: "alternate", hrefLang: locale, href: canonicalUrl(page.path, locale === "ar" ? "ar" : "en", business.siteUrl) })),
    { property: "og:type", content: page.kind === "product" ? "product" : "website" },
    { property: "og:site_name", content: business.name },
    { property: "og:title", content: page.title },
    { property: "og:description", content: page.description },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: language === "ar" ? "ar_LB" : "en_LB" },
    { property: "og:locale:alternate", content: language === "ar" ? "en_LB" : "ar_LB" },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1600" },
    { property: "og:image:height", content: "800" },
    { property: "og:image:alt", content: "Boys & Girlz children's shop logo" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: page.title },
    { name: "twitter:description", content: page.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: "Boys & Girlz children's shop logo" },
    ...(breadcrumbs ? [{ "script:ld+json": breadcrumbs }] : []),
    ...(schema ? [{ "script:ld+json": schema }] : []),
  ];
}
