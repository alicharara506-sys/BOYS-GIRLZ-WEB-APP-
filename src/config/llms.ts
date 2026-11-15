// llms.txt: a short plain-text guide to the shop for AI assistants. Pure, so the live /llms.txt
// route and the build-time tests share one format.
const readingLinks: [string, string][] = [
  ["About Boys & Girlz", "/about"], ["Browse the shop", "/shop"],
  ["Boys' clothing", "/category/boys"], ["Girls' clothing", "/category/girls"],
  ["Baby and unisex clothing", "/category/unisex"], ["Accessories", "/category/accessories"],
  ["Maternity clothing", "/category/maternity"], ["Toys", "/category/toys"],
  ["Like New outlet", "/category/outlet"], ["Brands", "/brands"],
  ["Delivery information", "/help/shipping"], ["Returns information", "/help/returns"],
  ["Sizing information", "/help/sizing"], ["Frequently asked questions", "/faq"],
  ["Contact the shop", "/contact"],
];

type LlmsOptions = {
  origin?: string;
  catalogVerified?: boolean;
  // Pages to leave out right now, such as categories with no products.
  hiddenPaths?: Set<string>;
  // The shop's confirmed street address and locality, if known.
  address?: string;
  locality?: string;
};

export function buildLlms({ origin = "", catalogVerified = false, hiddenPaths = new Set(), address = "", locality = "" }: LlmsOptions = {}) {
  const located = Boolean(address && locality);
  return [
    "# Boys & Girlz", "",
    "> Boys & Girlz is a Lebanon-based shop for children's clothing, baby items, toys, accessories and maternity wear.", "",
    "The shop also has a Like New outlet for pre-owned items in excellent condition at reduced prices. Delivery is within Lebanon. Cash on Delivery is available.", "",
    ...(located ? [`Shop address: ${address}, ${locality}, Lebanon.`, ""] : []),
    ...(!catalogVerified ? ["The website currently contains a preview catalog. Product listings, prices and availability must be confirmed with the shop before ordering.", ""] : []),
    "## Main pages", "",
    ...readingLinks.filter(([, path]) => !hiddenPaths.has(path)).map(([label, path]) => `- [${label}](${origin}${path})`), "",
    "## Arabic", "",
    `- [Arabic storefront](${origin}/?lang=ar)`,
    `- [Arabic frequently asked questions](${origin}/faq?lang=ar)`, "",
    "## Verified information", "",
    `For current delivery timing, returns terms, product measurements and availability, use the contact page. No founding date${located ? "" : ", physical shop address"} or opening hours are stated here without confirmation.`, "",
    ...(!origin ? ["<!-- Set VITE_PUBLIC_SITE_URL to the confirmed production HTTPS origin. Links are relative until then. -->", ""] : []),
  ].join("\n");
}
