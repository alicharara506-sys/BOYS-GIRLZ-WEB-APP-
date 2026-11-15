import type { MetaDescriptor } from "react-router";
import { business } from "./business";
import type { Product } from "../data/products";
import { breadcrumbStructuredData, canonicalUrl, categoryLabel, getPageSeo, localProductName, pageStructuredData, productStructuredData, type SeoLanguage } from "./seo";

export function languageFromMatches(matches: readonly ({ id: string; data?: unknown } | undefined)[]): SeoLanguage {
  const root = matches.find((match) => match?.id === "root")?.data;
  return root && typeof root === "object" && "language" in root && root.language === "ar" ? "ar" : "en";
}

export function localizedMeta(_title: string, _description: string, path: string) {
  return ({ matches }: { matches: readonly ({ id: string; data?: unknown } | undefined)[] }) => buildPageMeta(path, languageFromMatches(matches));
}

export function pageMeta(_title: string, _description: string, path: string, language: SeoLanguage = "en", overrides: { indexable?: boolean } = {}): MetaDescriptor[] {
  return buildPageMeta(path, language, overrides);
}

// `overrides.indexable: false` lets a route hide a page that is empty right now (a category with
// no products), so search engines don't index an empty page.
export function buildPageMeta(path: string, language: SeoLanguage = "en", overrides: { indexable?: boolean } = {}): MetaDescriptor[] {
  const options = { catalogVerified: business.catalogVerified };
  const seo = getPageSeo(path, language, options);
  const page = overrides.indexable === false ? { ...seo, indexable: false } : seo;
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

// Shortens text to fit a meta description without cutting a word in half.
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max - 1);
  return `${text.slice(0, cut > 0 ? cut : max - 1)}…`;
}

export type ManagedProductSeo =Pick<Product, "id" | "name" | "description" | "category" | "price" | "condition"> & {
  brand?: string | null;
  imageUrl?: string | null;
  inStock: boolean;
  // Arabic copy entered in the admin, used on Arabic pages when present.
  nameAr?: string;
  descriptionAr?: string;
};

// A product from the live catalogue. It is indexable, with Product + Offer markup, once the shop
// has verified the catalogue (VITE_CATALOG_VERIFIED=true); until then it stays noindex.
export function managedProductMeta(product: ManagedProductSeo, language: SeoLanguage = "en"): MetaDescriptor[] {
  const path = `/product/${product.id}`;
  const name = language === "ar" && product.nameAr ? product.nameAr : localProductName(product.name, language);
  const category = categoryLabel(product.category, language);
  const indexable = business.catalogVerified;
  const title = `${name.slice(0, 44)} | ${language === "ar" ? "بويز آند غيرلز" : "Boys & Girlz"}`;
  // The catalogue only has English descriptions, so Arabic pages get an Arabic summary built from
  // facts the site already states (name, category, delivery in Lebanon, cash on delivery).
  const arabicSummary = product.descriptionAr || `${name} من قسم ${category} لدى بويز آند غيرلز في لبنان. توصيل داخل لبنان والدفع عند الاستلام.`;
  const description = clip(language === "ar" ? arabicSummary : product.description || `${name} from Boys & Girlz in Lebanon.`, 155);
  const canonical = canonicalUrl(path, language, business.siteUrl);
  const image = product.imageUrl || `${business.siteUrl}/assets/boys-girlz-logo.jpg`;
  const breadcrumbs = breadcrumbStructuredData({ ...getPageSeo(path, language), breadcrumbs: [
    { path: "/", name: language === "ar" ? "الرئيسية" : "Home" },
    { path: `/category/${product.category.toLowerCase()}`, name: category },
    { path, name },
  ] }, language, business.siteUrl);
  const schema = indexable && business.siteUrl ? productStructuredData({
    url: canonical, siteUrl: business.siteUrl, language, sku: product.id, name, description: language === "ar" ? arabicSummary : product.description,
    category: product.category, price: product.price, condition: product.condition, brand: product.brand,
    imageUrl: product.imageUrl, inStock: product.inStock,
  }) : undefined;
  return [
    { title }, { name: "description", content: description },
    { name: "robots", content: indexable ? "index, follow, max-image-preview:large" : "noindex, follow" },
    { tagName: "link", rel: "canonical", href: canonical },
    ...(["en", "ar", "x-default"] as const).map(locale => ({ tagName: "link" as const, rel: "alternate", hrefLang: locale, href: canonicalUrl(path, locale === "ar" ? "ar" : "en", business.siteUrl) })),
    { property: "og:type", content: "product" },
    { property: "og:site_name", content: business.name },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: language === "ar" ? "ar_LB" : "en_LB" },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: name },
    { property: "product:price:amount", content: product.price.toFixed(2) },
    { property: "product:price:currency", content: "USD" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
    ...(breadcrumbs ? [{ "script:ld+json": breadcrumbs }] : []),
    ...(schema ? [{ "script:ld+json": schema }] : []),
  ];
}
