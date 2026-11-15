import { useMemo } from "react";
import { useRouteLoaderData } from "react-router";
import { DEFAULT_MENU, resolveMenu, type MenuLink, type SiteCategory, type SiteMenu } from "../domain/menu";
import { matchesCategory, type Category, type Product } from "../data/products";

// The website menu and the owner's categories, as loaded by the root loader from the admin.
export function useSiteMenu() {
  const data = useRouteLoaderData("root") as { menu?: SiteMenu; categories?: SiteCategory[] } | undefined;
  const menu = data?.menu;
  const categories = data?.categories;
  return useMemo(() => {
    const list = categories || [];
    return { ...resolveMenu(menu || DEFAULT_MENU, list), categories: list };
  }, [menu, categories]);
}

// Whether a product belongs to a menu entry (a built-in section, or one of the owner's categories).
export function matchesLink(product: Product, link: MenuLink): boolean {
  if (!link.match) return false;
  if ("section" in link.match) return matchesCategory(product, link.match.section as Category);
  return product.productType === link.match.productType;
}

// How many products a menu entry lists, or null for entries that aren't product lists (pages, links).
export function linkCount(products: Product[], link: MenuLink): number | null {
  return link.match ? products.filter((product) => matchesLink(product, link)).length : null;
}

// The entry's name in the shopper's language. Empty Arabic labels fall back to the translation of the
// English default ("Boys" → "أولاد").
export function linkLabel(link: MenuLink, language: "en" | "ar", t: (text: string) => string): string {
  return language === "ar" ? link.labelAr || t(link.label) : link.label;
}
