import { db } from "./commerce/db.server";
import { settings } from "./commerce/sales.server";
import { DEFAULT_DELIVERY, deliveryRuleFromSettings, type DeliveryRule } from "../domain/delivery";
import { DEFAULT_MENU, parseMenu, type SiteCategory, type SiteMenu } from "../domain/menu";

// What every storefront page needs from the admin: the delivery rule, the menu and the product
// categories. Read at most once a minute; an admin save clears it at once (routes/admin.tsx).
export type SiteConfig = { delivery: DeliveryRule; menu: SiteMenu; categories: SiteCategory[] };

let cache: { config: SiteConfig; at: number } | null = null;
export function clearSiteCache() {
  cache = null;
}

export async function siteCategories(): Promise<SiteCategory[]> {
  return db.category.findMany({
    select: { id: true, name: true, nameAr: true, slug: true, intro: true, introAr: true },
    orderBy: { name: "asc" },
  });
}

export async function storefrontSite(): Promise<SiteConfig> {
  if (cache && Date.now() - cache.at < 60_000) return cache.config;
  try {
    const [shop, menuRecord, categories] = await Promise.all([
      settings(),
      db.setting.findUnique({ where: { key: "menu" } }),
      siteCategories(),
    ]);
    const config: SiteConfig = {
      delivery: deliveryRuleFromSettings(shop),
      menu: parseMenu(menuRecord?.value, categories.map((c) => c.id)),
      categories,
    };
    cache = { config, at: Date.now() };
    return config;
  } catch {
    return cache?.config || { delivery: DEFAULT_DELIVERY, menu: DEFAULT_MENU, categories: [] };
  }
}
