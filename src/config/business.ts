// TODO: Confirm the bracketed business details before connecting checkout or publishing.
const env = import.meta.env;
export const business = {
  name: "Boys & Girlz",
  model: "A Lebanon-based shop reselling children's items, with a Like New outlet",
  siteUrl: env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "") || "",
  phone: env.VITE_SHOP_PHONE || "",
  address: env.VITE_SHOP_ADDRESS || "",
  hours: env.VITE_SHOP_HOURS || "",
  returnsPolicy: env.VITE_RETURNS_POLICY || "",
  deliveryEstimate: env.VITE_DELIVERY_ESTIMATE || "",
  shippingFee: Number(env.VITE_SHIPPING_FEE || "5.95"),
  freeShippingOver: 99,
  instagram: "https://www.instagram.com/boysandgirlz/",
  currency: "USD",
  language: "en",
} as const;
