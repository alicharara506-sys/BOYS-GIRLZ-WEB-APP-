// The website menu, as the owner arranges it in the admin (Menu & categories).
//
// Two lists:
//   shop: the "Shop" drop-down in the header (also the mobile Shop list and the footer's shop links).
//   top:  the links next to "Shop" in the header (New In, Sale, About us, Contact by default).
// Each entry points at a built-in section (Boys, Girls, Sale…), a product category the owner made
// (Dresses, Shoes…), a page of the site (About, Contact…), or a link the owner typed in.
// The menu is stored in the settings table under the key "menu". Until the owner saves one, the
// website uses DEFAULT_MENU, which is exactly the menu the site had before.

export type MenuKind = "section" | "category" | "page" | "link";
export type MenuItem = {
  kind: MenuKind;
  target: string; // section key, category id, page key, or a URL
  label: string; // English label; empty means the default name
  labelAr: string; // Arabic label; empty means the default name
  icon: string; // one of MENU_ICONS; empty means the default
  color: string; // #rrggbb; empty means the default
  visible: boolean;
};
export type SiteMenu = { shop: MenuItem[]; top: MenuItem[] };
export type SiteCategory = { id: string; name: string; nameAr: string; slug: string; intro: string; introAr: string };

// Built-in sections of the shop. "category" is the storefront grouping each one filters by.
export const SECTIONS = {
  boys: { label: "Boys", href: "/category/boys", icon: "shirt", color: "#00b3fc", category: "Boys" },
  girls: { label: "Girls", href: "/category/girls", icon: "sparkles", color: "#fc538e", category: "Girls" },
  unisex: { label: "Unisex", href: "/category/unisex", icon: "baby", color: "#0898d6", category: "Unisex" },
  accessories: { label: "Accessories", href: "/category/accessories", icon: "gem", color: "#e7a400", category: "Accessories" },
  maternity: { label: "Maternity", href: "/category/maternity", icon: "hand-heart", color: "#f07a9a", category: "Maternity" },
  toys: { label: "Toys", href: "/category/toys", icon: "toy-brick", color: "#2f9e6a", category: "Toys" },
  outlet: { label: "Outlet", href: "/category/outlet", icon: "recycle", color: "#0898d6", category: "Outlet" },
  sale: { label: "Sale", href: "/category/sale", icon: "percent", color: "#fc538e", category: "Sale" },
  new: { label: "New In", href: "/shop?sort=newest", icon: "star", color: "#0898d6", category: null },
  shop: { label: "Shop all", href: "/shop", icon: "shopping-bag", color: "#0898d6", category: null },
} as const;
export type SectionKey = keyof typeof SECTIONS;

export const PAGES = {
  home: { label: "Home", href: "/" },
  about: { label: "About us", href: "/about" },
  contact: { label: "Contact", href: "/contact" },
  faq: { label: "FAQ", href: "/faq" },
  brands: { label: "Brands", href: "/brands" },
  shipping: { label: "Delivery", href: "/help/shipping" },
  returns: { label: "Returns", href: "/help/returns" },
  sizing: { label: "Size Guide", href: "/help/sizing" },
} as const;
export type PageKey = keyof typeof PAGES;

export const MENU_ICONS = ["shirt", "sparkles", "baby", "gem", "hand-heart", "toy-brick", "recycle", "percent", "star", "shopping-bag", "tag", "heart", "gift", "footprints", "moon", "sun", "crown", "backpack", "glasses", "shapes"] as const;

const item = (kind: MenuKind, target: string): MenuItem => ({ kind, target, label: "", labelAr: "", icon: "", color: "", visible: true });
export const DEFAULT_MENU: SiteMenu = {
  shop: (["boys", "girls", "unisex", "accessories", "maternity", "toys", "outlet", "sale"] as const).map((key) => item("section", key)),
  top: [item("section", "new"), item("section", "sale"), item("page", "about"), item("page", "contact")],
};

// Category web addresses: lowercase words joined by dashes ("Baby Shoes" → "baby-shoes").
export function slugify(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
}
// Addresses already used by the built-in sections; a new category can't take one.
export const RESERVED_SLUGS = new Set(Object.values(SECTIONS).map((s) => s.href.match(/^\/category\/([a-z-]+)$/)?.[1]).filter(Boolean) as string[]);

const HEX = /^#[0-9a-f]{6}$/;
// A link the owner types: a page of this site ("/help/sizing") or a full https:// address.
export function safeLink(url: string): boolean {
  return (/^\/(?!\/)[\w\-./?=&%#]*$/.test(url) || /^https:\/\/[^\s"'<>]+$/.test(url)) && url.length <= 300;
}

export type MenuIssue = { list: "shop" | "top"; index: number; message: string };

// Checks a menu sent from the admin. Returns the cleaned menu, or the problems to fix.
export function checkMenu(value: unknown, categoryIds: string[]): { menu?: SiteMenu; issues: MenuIssue[] } {
  const issues: MenuIssue[] = [];
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const clean = (list: "shop" | "top"): MenuItem[] => {
    const raw = Array.isArray(source[list]) ? (source[list] as unknown[]) : [];
    if (raw.length > 30) issues.push({ list, index: 30, message: "A menu can have at most 30 items." });
    return raw.slice(0, 30).map((entry, index) => {
      const e = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
      const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
      const out: MenuItem = {
        kind: (["section", "category", "page", "link"].includes(e.kind as string) ? e.kind : "link") as MenuKind,
        target: text(e.target, 300),
        label: text(e.label, 40),
        labelAr: text(e.labelAr, 40),
        icon: (MENU_ICONS as readonly string[]).includes(e.icon as string) ? (e.icon as string) : "",
        color: typeof e.color === "string" && HEX.test(e.color.toLowerCase()) ? e.color.toLowerCase() : "",
        visible: e.visible !== false,
      };
      const problem =
        out.kind === "section" ? (!(out.target in SECTIONS) && "Unknown section.")
        : out.kind === "category" ? (!categoryIds.includes(out.target) && "This category no longer exists. Remove it from the menu.")
        : out.kind === "page" ? (!(out.target in PAGES) && "Unknown page.")
        : !out.label ? "A custom link needs an English label."
        : !safeLink(out.target) && "Links must start with / (a page of this site) or https://.";
      if (problem) issues.push({ list, index, message: problem });
      return out;
    });
  };
  const menu = { shop: clean("shop"), top: clean("top") };
  return issues.length ? { issues } : { menu, issues };
}

// The saved menu, or the default one if nothing usable is saved.
export function parseMenu(value: unknown, categoryIds: string[]): SiteMenu {
  if (!value || typeof value !== "object") return DEFAULT_MENU;
  const checked = checkMenu(value, categoryIds);
  if (checked.menu) return checked.menu;
  // Drop only the broken entries (for example a deleted category) and keep the rest.
  const broken = new Set(checked.issues.map((i) => `${i.list}:${i.index}`));
  const raw = value as Record<"shop" | "top", unknown[]>;
  const partial = { shop: (raw.shop || []).filter((_, i) => !broken.has(`shop:${i}`)), top: (raw.top || []).filter((_, i) => !broken.has(`top:${i}`)) };
  return checkMenu(partial, categoryIds).menu || DEFAULT_MENU;
}

// What the storefront needs to draw one menu entry.
export type MenuLink = {
  key: string;
  label: string; // English
  labelAr: string; // Arabic, or "" to translate the English default
  href: string;
  icon: string;
  color: string;
  external: boolean;
  // Which products the entry lists, so empty entries can be hidden and counts shown.
  match: { section: string } | { productType: string } | null;
};

export function resolveMenu(menu: SiteMenu, categories: SiteCategory[]): { shop: MenuLink[]; top: MenuLink[] } {
  const resolve = (list: MenuItem[], area: string): MenuLink[] =>
    list.filter((entry) => entry.visible).flatMap((entry, index): MenuLink[] => {
      const key = `${area}-${index}-${entry.kind}-${entry.target}`;
      if (entry.kind === "section") {
        const section = SECTIONS[entry.target as SectionKey];
        if (!section) return [];
        return [{ key, label: entry.label || section.label, labelAr: entry.labelAr, href: section.href, icon: entry.icon || section.icon, color: entry.color || section.color, external: false, match: section.category ? { section: section.category } : null }];
      }
      if (entry.kind === "category") {
        const category = categories.find((c) => c.id === entry.target);
        if (!category) return [];
        return [{ key, label: entry.label || category.name, labelAr: entry.labelAr || category.nameAr, href: `/category/${category.slug}`, icon: entry.icon || "tag", color: entry.color || "#fc538e", external: false, match: { productType: category.name } }];
      }
      if (entry.kind === "page") {
        const page = PAGES[entry.target as PageKey];
        if (!page) return [];
        return [{ key, label: entry.label || page.label, labelAr: entry.labelAr, href: page.href, icon: entry.icon || "heart", color: entry.color || "#0898d6", external: false, match: null }];
      }
      return [{ key, label: entry.label, labelAr: entry.labelAr, href: entry.target, icon: entry.icon || "heart", color: entry.color || "#0898d6", external: /^https:/.test(entry.target), match: null }];
    });
  return { shop: resolve(menu.shop, "shop"), top: resolve(menu.top, "top") };
}
