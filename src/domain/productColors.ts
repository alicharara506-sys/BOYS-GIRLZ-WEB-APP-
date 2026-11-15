// Product colors: one product, shared details and price, and one entry per color with its own
// swatch, photo set and availability. Shared by the admin (to validate before saving), the
// server (to validate again before writing) and the storefront (to show the right photos).
//
// Stock still lives on each size × color variant row, as it always has (the POS counts it). The
// per-color "available" switch is the shop's own on/off for selling a color online; a color is
// shown as out of stock when that switch is off.

export type ColorMode = "single" | "multiple";

export type ColorImage = {
  url: string;
  // Storage file name of an image uploaded through the admin, so an unsaved upload can be removed.
  file?: string;
};

export type ProductColor = {
  name: string;
  nameAr: string;
  hex: string;
  // In display order; the first image is the color's cover photo.
  images: ColorImage[];
  available: boolean;
  // The sizes this color comes in, in the product's size order. Missing or empty means every size
  // of the product (older products, and colors that come in every size).
  sizes?: string[];
};

export type ColorDraftIssue = { field: string; message: string };

// The sizes the shop sells, smallest first. Lists of sizes are shown in this order everywhere.
export const SIZE_ORDER = ["New Born", "0–3 Months", "3–6 Months", "6–9 Months", "9–12 Months", "12–18 Months", "18–24 Months", "2–3 Years", "3–4 Years", "4–5 Years", "5–6 Years", "6–7 Years", "7–8 Years", "8–9 Years", "9–10 Years", "10–12 Years", "12–14 Years", "One size"];
export function sortSizes(sizes: string[]): string[] {
  const rank = (size: string) => { const i = SIZE_ORDER.indexOf(size); return i < 0 ? SIZE_ORDER.length : i; };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export const HEX = /^#[0-9a-f]{6}$/;
export const MAX_COLORS = 20;
export const MAX_IMAGES_PER_COLOR = 12;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Upload limit per photo. The server then compresses it (see server/image.server.ts).
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const imageUrl = (url: string) => /^https:\/\//.test(url) || /^\/(?:assets|media)\/[a-zA-Z0-9_./-]+$/.test(url);

export function normalizeHex(value: string): string {
  const raw = value.trim().toLowerCase();
  const short = raw.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  const full = raw.match(/^#?([0-9a-f]{6})$/);
  return full ? `#${full[1]}` : raw;
}

// Checks the color part of a product before it is saved. The same rules run in the admin modal
// and on the server, so a product can never be saved with a color that breaks them.
export function validateColors(mode: ColorMode, colors: ProductColor[], productSizes?: string[]): ColorDraftIssue[] {
  const issues: ColorDraftIssue[] = [];
  if (mode === "single" && colors.length !== 1) issues.push({ field: "colors", message: "A one-color product has exactly one color." });
  if (mode === "multiple" && colors.length < 2) issues.push({ field: "colors", message: "Add at least two colors, or choose One Color." });
  if (colors.length > MAX_COLORS) issues.push({ field: "colors", message: `A product can have up to ${MAX_COLORS} colors.` });
  const seen = new Set<string>();
  const seenHex = new Set<string>();
  colors.forEach((color, index) => {
    const at = `colors.${index}`;
    const name = color.name.trim();
    if (!name) issues.push({ field: `${at}.name`, message: "Give this color a name." });
    else if (name.length > 40) issues.push({ field: `${at}.name`, message: "Keep the color name under 40 characters." });
    else if (seen.has(name.toLowerCase())) issues.push({ field: `${at}.name`, message: `"${name}" is already used by another color.` });
    seen.add(name.toLowerCase());
    if (color.nameAr.trim().length > 40) issues.push({ field: `${at}.nameAr`, message: "Keep the Arabic name under 40 characters." });
    if (!HEX.test(color.hex)) issues.push({ field: `${at}.hex`, message: "Pick a swatch color." });
    else if (seenHex.has(color.hex) && mode === "multiple") issues.push({ field: `${at}.hex`, message: "Two colors share the same swatch; pick a different one." });
    seenHex.add(color.hex);
    if (!color.images.length) issues.push({ field: `${at}.images`, message: `Add at least one photo of ${name || "this color"}.` });
    if (color.images.length > MAX_IMAGES_PER_COLOR) issues.push({ field: `${at}.images`, message: `Up to ${MAX_IMAGES_PER_COLOR} photos per color.` });
    if (color.images.some((image) => !imageUrl(image.url))) issues.push({ field: `${at}.images`, message: "A photo has not finished uploading." });
    if (typeof color.available !== "boolean") issues.push({ field: `${at}.available`, message: "Choose Available or Out of stock." });
    if (color.sizes && productSizes) {
      if (!color.sizes.some((size) => productSizes.includes(size))) issues.push({ field: `${at}.sizes`, message: `Pick at least one size for ${name || "this color"}.` });
      else if (color.sizes.some((size) => !productSizes.includes(size))) issues.push({ field: `${at}.sizes`, message: `${name || "This color"} has a size the product doesn't have.` });
    }
  });
  return issues;
}

// The details every color shares. Prices are in dollars here; the server stores cents.
export type ProductBasics = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  shopId: string;
  categoryId: string;
  brand: string;
  price: number;
  // Optional lower price the product is sold at; the regular price is then shown struck through.
  salePrice: number | null;
  // What one item costs the shop. It values stock and feeds cost of goods sold (COGS) and profit.
  // null means not entered yet.
  cost: number | null;
  sizes: string[];
};

export function validateBasics(basics: ProductBasics): ColorDraftIssue[] {
  const issues: ColorDraftIssue[] = [];
  if (!basics.name.trim()) issues.push({ field: "name", message: "Give the product an English name." });
  else if (basics.name.trim().length > 150) issues.push({ field: "name", message: "Keep the name under 150 characters." });
  if (basics.nameAr.trim().length > 150) issues.push({ field: "nameAr", message: "Keep the Arabic name under 150 characters." });
  if (!basics.shopId) issues.push({ field: "shopId", message: "Choose a shop." });
  if (!basics.categoryId) issues.push({ field: "categoryId", message: "Choose a category." });
  if (!basics.brand.trim()) issues.push({ field: "brand", message: "Enter the brand." });
  if (!Number.isFinite(basics.price) || basics.price <= 0) issues.push({ field: "price", message: "Enter a price above $0." });
  else if (Math.abs(basics.price * 100 - Math.round(basics.price * 100)) > 1e-6) issues.push({ field: "price", message: "Use at most two decimals." });
  if (basics.salePrice !== null && (!Number.isFinite(basics.salePrice) || basics.salePrice <= 0 || basics.salePrice >= basics.price))
    issues.push({ field: "salePrice", message: "The sale price must be above $0 and below the regular price." });
  if (basics.cost === null || !Number.isFinite(basics.cost)) issues.push({ field: "cost", message: "Enter what one item costs you, so profit and stock value are right. Use 0 only if it really cost nothing." });
  else if (basics.cost < 0) issues.push({ field: "cost", message: "The cost can't be below $0." });
  else if (Math.abs(basics.cost * 100 - Math.round(basics.cost * 100)) > 1e-6) issues.push({ field: "cost", message: "Use at most two decimals." });
  if (!basics.sizes.length) issues.push({ field: "sizes", message: "Pick at least one size." });
  return issues;
}

// A URL slug from the English name, with a short suffix so two products can share a name.
export function productSlug(name: string, suffix: string): string {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "product"}-${suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6)}`;
}

// Checks one picked file before uploading it.
export function imageFileIssue(file: { type: string; size: number; name: string }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name} is not a JPG, PNG, WebP or GIF image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} is larger than 15 MB.`;
  return null;
}

// Storefront helpers. A product without color details (older products) has none of these, and
// every helper falls back to the product's single photo and treats its colors as available.
type WithColors = { colors: string[]; imageUrl?: string | null; colorVariants?: ProductColor[] };

export function colorDetails(product: WithColors, color: string | undefined): ProductColor | undefined {
  return product.colorVariants?.find((variant) => variant.name === color);
}

export function colorImages(product: WithColors, color: string | undefined): string[] {
  const details = colorDetails(product, color) || product.colorVariants?.[0];
  const urls = details?.images.map((image) => image.url) || [];
  return urls.length ? urls : product.imageUrl ? [product.imageUrl] : [];
}

// The sizes a color comes in: its own list, else every size of the product.
export function colorSizes(product: WithColors & { sizes: string[] }, color: string | undefined): string[] {
  const own = colorDetails(product, color)?.sizes;
  return own?.length ? product.sizes.filter((size) => own.includes(size)) : product.sizes;
}

export function colorAvailable(product: WithColors, color: string | undefined): boolean {
  const details = colorDetails(product, color);
  return details ? details.available : true;
}

// The first color shoppers see: the first available one, else the first.
export function defaultColor(product: WithColors): string {
  return product.colorVariants?.find((variant) => variant.available)?.name || product.colors[0] || "";
}
