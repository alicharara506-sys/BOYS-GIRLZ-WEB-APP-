import { defaultSiteUrl, normalizeSiteUrl } from "./site";

// Optional facts remain unpublished until the shop supplies them.
const env = import.meta.env;
const whatsappPhone = env.VITE_WHATSAPP_PHONE || "+96181061731";
export const business = {
  name: "Boys & Girlz",
  model: "A Lebanon-based shop reselling children's items, with a Like New outlet",
  siteUrl: normalizeSiteUrl(env.VITE_PUBLIC_SITE_URL || defaultSiteUrl),
  phone: env.VITE_SHOP_PHONE || "",
  // The shop's WhatsApp: +961 81 061 731.
  whatsappPhone,
  phoneDisplay: whatsappPhone === "+96181061731" ? "+961 81 061 731" : whatsappPhone,
  email: env.VITE_SHOP_EMAIL || "",
  founded: env.VITE_SHOP_FOUNDED || "",
  locality: env.VITE_SHOP_LOCALITY || "",
  postalCode: env.VITE_SHOP_POSTAL_CODE || "",
  countryCode: env.VITE_SHOP_COUNTRY_CODE || "LB",
  latitude: env.VITE_SHOP_LATITUDE || "",
  longitude: env.VITE_SHOP_LONGITUDE || "",
  catalogVerified: env.VITE_CATALOG_VERIFIED === "true",
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
