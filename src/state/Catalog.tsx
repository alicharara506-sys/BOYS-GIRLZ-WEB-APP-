import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Product } from "../data/products";
import { registerCatalogArabic } from "../i18n/Locale";

type Catalog = { products: Product[]; productById: (id: string) => Product | undefined };
const CatalogContext = createContext<Catalog | null>(null);

// The root loader decides whether this request sees the demo or the locally published
// catalog. Components share that exact snapshot, including an intentionally empty catalog.
export function CatalogProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const value = useMemo(() => {
    // Arabic text entered in the admin, so t(product.name) and t(color) show it on Arabic pages.
    registerCatalogArabic(products.flatMap((product) => [
      [product.name, product.nameAr] as [string, string | undefined],
      [product.description, product.descriptionAr] as [string, string | undefined],
      ...(product.colorVariants || []).map((color) => [color.name, color.nameAr] as [string, string]),
    ]));
    const byId = new Map(products.map((product) => [product.id, product]));
    return { products, productById: (id: string) => byId.get(id) };
  }, [products]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("CatalogProvider is required");
  return value;
}
