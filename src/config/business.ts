// TODO: Confirm the bracketed business details before connecting checkout or publishing.
const env = import.meta.env;
export const business = {
  name: "Boys & Girlz",
  model: "A Lebanon-based shop reselling children's items, with a Like New outlet",
  siteUrl: env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "") || "",
  phone: env.VITE_SHOP_PHONE || "",
  // The shop's WhatsApp: +961 81 061 731.
  whatsappPhone: env.VITE_WHATSAPP_PHONE || "+96181061731",
  address: env.VITE_SHOP_ADDRESS || "",
  hours: env.VITE_SHOP_HOURS || "",
  returnsPolicy: env.VITE_RETURNS_POLICY || "",
  deliveryEstimate: env.VITE_DELIVERY_ESTIMATE || "",
  shippingFee: Number(env.VITE_SHIPPING_FEE || "5.95"),
  freeShippingOver: 99,
  instagram: "https://www.instagram.com/boysandgirlz.lb/",
  facebook: "https://www.facebook.com/share/19cnjtfzcw/",
  tiktok: "https://www.tiktok.com/@boysandgirlz.lb",
  currency: "USD",
  language: "en",
} as const;
