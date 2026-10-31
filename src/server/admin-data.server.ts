import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { categories, products as previewProducts, type Product } from "../data/products.ts";
import { orderInputSchema, priceOrder, OrderValidationError, type PricedItem, type PromoForOrder } from "./orderService.ts";
import type { AdminCustomer, AdminOrder, AdminOrderStatus, AdminOverview, AdminProduct, AdminPromo, AdminVariant } from "../admin/types.ts";

export class AdminDataError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.name = "AdminDataError"; this.status = status; }
}

const money = z.coerce.number().finite().min(0).max(100000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Use no more than two decimal places");
const nullableMoney = z.preprocess(value => value === "" || value === null ? undefined : value, money.optional());
const tags = z.preprocess(value => typeof value === "string" ? value.split(",").map(item => item.trim()).filter(Boolean) : value, z.array(z.string().trim().min(1).max(60)).max(30).default([])).transform(values => [...new Set(values)]);
const imageUrl = z.preprocess(value => value === "" || value === undefined ? null : value, z.string().trim().max(2048).refine(value => {
  if (/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) return true;
  if (/^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp|gif)$/i.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}, "Use an HTTPS image URL or a local /assets/ image path").nullable());

const productSchema = z.object({
  id: z.string().optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).optional(),
  name: z.string().trim().min(2).max(160), description: z.string().trim().max(6000).default(""),
  price: money, originalPrice: nullableMoney,
  category: z.enum(categories as [typeof categories[number], ...typeof categories[number][]]),
  gender: z.enum(["Boys", "Girls", "Unisex"]).nullable().default(null),
  condition: z.enum(["new", "like-new"]).default("new"), productType: z.string().trim().min(1).max(80).default("clothing"),
  image: z.coerce.number().int().min(0).max(11).default(0), imageUrl,
  sizes: tags, colors: tags, model: z.enum(["romper", "cardigan", "set", "boots", "bunny", "dress", "duck"]).default("romper"),
  isNew: z.boolean().default(false), brand: z.string().trim().max(100).optional(), published: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.originalPrice !== undefined && value.originalPrice <= value.price) context.addIssue({ code: "custom", path: ["originalPrice"], message: "Compare-at price must be higher than the selling price" });
  if (value.sizes.length * value.colors.length > 300) context.addIssue({ code: "custom", path: ["sizes"], message: "Use no more than 300 size/color combinations" });
});

const stockSchema = z.array(z.object({ variantId: z.uuid(), stock: z.coerce.number().int().min(0).max(100000) })).min(1).max(1000);
const localOrderSchema = orderInputSchema.omit({ items: true }).extend({
  items: z.array(z.object({
    productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
    size: z.string().max(60).nullable(), color: z.string().max(60).nullable(), quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});
const promoSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,39}$/, "Use 2–40 letters, numbers, dashes or underscores"),
  discountType: z.enum(["percent", "fixed"]), amount: z.coerce.number().int().positive().max(10000000),
  minSubtotalCents: z.coerce.number().int().min(0).max(10000000).default(0),
  usageLimit: z.preprocess(value => value === "" || value === undefined ? null : value, z.coerce.number().int().positive().max(1000000).nullable()),
  expiresAt: z.preprocess(value => value === "" || value === undefined ? null : value, z.string().refine(value => !Number.isNaN(Date.parse(value)), "Enter a valid expiry date").nullable()),
  active: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.discountType === "percent" && value.amount > 100) context.addIssue({ code: "custom", path: ["amount"], message: "Percentage cannot exceed 100" });
});

const statuses: AdminOrderStatus[] = ["pending", "confirmed", "packed", "delivered", "cancelled"];
const transitions: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["packed", "cancelled"], packed: ["delivered", "cancelled"], delivered: [], cancelled: [],
};
const now = () => new Date().toISOString();
const variantKey = (size: string | null, color: string | null) => JSON.stringify([size, color]);
type Row = Record<string, unknown>;

export function createAdminRepository(filename: string, { seed = true }: { seed?: boolean } = {}) {
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  if (filename !== ":memory:") db.exec("PRAGMA journal_mode=WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_products (
      id TEXT PRIMARY KEY, data TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_variants (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES admin_products(id), sku TEXT UNIQUE NOT NULL,
      size TEXT, color TEXT, stock INTEGER NOT NULL DEFAULT 0 CHECK(stock>=0),
      published INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS admin_variants_product ON admin_variants(product_id);
    CREATE TABLE IF NOT EXISTS admin_customers (id TEXT PRIMARY KEY, identity_key TEXT UNIQUE NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_orders (
      id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL, customer_id TEXT NOT NULL REFERENCES admin_customers(id),
      status TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      restocked INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin_promos (code TEXT PRIMARY KEY, data TEXT NOT NULL, uses INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
  `);

  function transaction<T>(callback: () => T): T {
    db.exec("BEGIN IMMEDIATE");
    try { const result = callback(); db.exec("COMMIT"); return result; }
    catch (error) { db.exec("ROLLBACK"); throw error; }
  }

  function readVariant(row: Row): AdminVariant {
    return { id: String(row.id), productId: String(row.product_id), sku: String(row.sku), size: row.size === null ? null : String(row.size), color: row.color === null ? null : String(row.color), stock: Number(row.stock), published: Boolean(row.published) };
  }
  function hydrate(row: Row): AdminProduct {
    const variants = (db.prepare("SELECT * FROM admin_variants WHERE product_id=? AND active=1 ORDER BY rowid").all(String(row.id)) as Row[]).map(readVariant);
    return { ...JSON.parse(String(row.data)), id: String(row.id), published: Boolean(row.published), archived: Boolean(row.archived), createdAt: String(row.created_at), updatedAt: String(row.updated_at), stock: variants.reduce((sum, variant) => sum + variant.stock, 0), variants };
  }
  function getProduct(id: string): AdminProduct | null {
    const row = db.prepare("SELECT * FROM admin_products WHERE id=?").get(id) as Row | undefined;
    return row ? hydrate(row) : null;
  }
  function listProducts(query?: string | { search?: string; archived?: boolean }): AdminProduct[] {
    const search = (typeof query === "string" ? query : query?.search || "").trim().toLowerCase();
    const includeArchived = typeof query === "object" && query.archived === true;
    return (db.prepare(`SELECT * FROM admin_products ${includeArchived ? "" : "WHERE archived=0"} ORDER BY created_at DESC, rowid DESC`).all() as Row[]).map(hydrate).filter(product => !search || `${product.name} ${product.id} ${product.category} ${product.brand || ""}`.toLowerCase().includes(search));
  }

  function writeProduct(raw: unknown, existingId?: string, enableCatalog = true): AdminProduct {
    const input = productSchema.parse(raw);
    const priorId = existingId || (input.id && getProduct(input.id) ? input.id : undefined);
    const prior = priorId ? getProduct(priorId) : null;
    if (priorId && !prior) throw new AdminDataError("Product not found", 404);
    if (prior?.archived) throw new AdminDataError("Restore this product before editing it");
    const slug = input.slug || prior?.id || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new AdminDataError("Provide an English URL slug using letters, numbers and dashes");
    if (prior && prior.id !== slug) throw new AdminDataError("An existing product URL cannot be changed");
    if (!prior && getProduct(slug)) throw new AdminDataError("A product with this URL already exists");
    const stamp = now();
    const published = input.published;
    const data = {
      name: input.name, description: input.description, price: input.price, originalPrice: input.originalPrice,
      category: input.category, gender: input.gender, condition: input.condition, productType: input.productType,
      image: input.image, imageUrl: input.imageUrl, sizes: input.sizes, colors: input.colors,
      model: input.model, isNew: input.isNew, brand: input.brand,
    };
    const sizes = data.sizes.length ? data.sizes : [null];
    const colors = data.colors.length ? data.colors : [null];
    const selected = new Set(sizes.flatMap(size => colors.map(color => variantKey(size, color))));
    const previousVariants = prior?.variants || [];
    if (previousVariants.some(variant => !selected.has(variantKey(variant.size, variant.color)) && variant.stock > 0)) throw new AdminDataError("Set stock to zero before removing an existing size or color");
    const removedIds = new Set(previousVariants.filter(variant => !selected.has(variantKey(variant.size, variant.color))).map(variant => variant.id));
    if (removedIds.size && (db.prepare("SELECT data FROM admin_orders WHERE status NOT IN ('delivered','cancelled')").all() as Row[]).some(row => (JSON.parse(String(row.data)).items as AdminOrder["items"]).some(item => removedIds.has(item.variantId)))) throw new AdminDataError("A size or color reserved by an open order cannot be removed");
    if (prior) db.prepare("UPDATE admin_products SET data=?,published=?,updated_at=? WHERE id=?").run(JSON.stringify(data), Number(published), stamp, slug);
    else db.prepare("INSERT INTO admin_products(id,data,published,created_at,updated_at) VALUES(?,?,?,?,?)").run(slug, JSON.stringify(data), Number(published), stamp, stamp);
    const allVariants = db.prepare("SELECT * FROM admin_variants WHERE product_id=?").all(slug) as Row[];
    db.prepare("UPDATE admin_variants SET active=0,published=0 WHERE product_id=?").run(slug);
    for (const size of sizes) for (const color of colors) {
      const existing = allVariants.find(variant => variantKey(variant.size as string | null, variant.color as string | null) === variantKey(size, color));
      if (existing) db.prepare("UPDATE admin_variants SET active=1,published=? WHERE id=?").run(Number(published), String(existing.id));
      else {
        const id = randomUUID();
        const suffix = createHash("sha256").update(`${slug}:${variantKey(size, color)}`).digest("hex").slice(0, 12).toUpperCase();
        db.prepare("INSERT INTO admin_variants(id,product_id,sku,size,color,published) VALUES(?,?,?,?,?,?)").run(id, slug, `BG-${suffix}`, size, color, Number(published));
      }
    }
    if (published && enableCatalog) db.prepare("INSERT INTO admin_settings(key,value) VALUES('storefront_enabled','true') ON CONFLICT(key) DO UPDATE SET value='true'").run();
    return getProduct(slug)!;
  }
  function saveProduct(input: unknown, existingId?: string) { return transaction(() => writeProduct(input, existingId)); }
  function setProductPublished(id: string, published: boolean) {
    const product = getProduct(id);
    if (!product) throw new AdminDataError("Product not found", 404);
    return saveProduct({ ...product, published }, id);
  }
  function archiveProduct(id: string, archived = true) {
    return transaction(() => {
      if (!getProduct(id)) throw new AdminDataError("Product not found", 404);
      db.prepare("UPDATE admin_products SET archived=?,published=0,updated_at=? WHERE id=?").run(Number(archived), now(), id);
      db.prepare("UPDATE admin_variants SET published=0 WHERE product_id=?").run(id);
      return getProduct(id)!;
    });
  }
  function updateInventory(input: unknown): AdminVariant[] {
    const updates = stockSchema.parse(input);
    if (new Set(updates.map(update => update.variantId)).size !== updates.length) throw new AdminDataError("A variant can only appear once per stock update");
    return transaction(() => updates.map(({ variantId, stock }) => {
      const variant = db.prepare("SELECT v.* FROM admin_variants v JOIN admin_products p ON p.id=v.product_id WHERE v.id=? AND v.active=1 AND p.archived=0").get(variantId) as Row | undefined;
      if (!variant) throw new AdminDataError("Inventory variant not found", 404);
      db.prepare("UPDATE admin_variants SET stock=? WHERE id=?").run(stock, variantId);
      db.prepare("UPDATE admin_products SET updated_at=? WHERE id=?").run(now(), String(variant.product_id));
      return { ...readVariant(variant), stock };
    }));
  }

  function listPromos(): AdminPromo[] {
    return (db.prepare("SELECT * FROM admin_promos ORDER BY created_at DESC,code").all() as Row[]).map(row => ({ ...JSON.parse(String(row.data)), code: String(row.code), uses: Number(row.uses), createdAt: String(row.created_at) }));
  }
  function savePromo(raw: unknown): AdminPromo {
    const value = promoSchema.parse(raw);
    return transaction(() => {
      const prior = db.prepare("SELECT uses FROM admin_promos WHERE code=?").get(value.code) as Row | undefined;
      if (value.usageLimit !== null && Number(prior?.uses || 0) > value.usageLimit) throw new AdminDataError("Usage limit cannot be lower than the number already used");
      db.prepare("INSERT INTO admin_promos(code,data,created_at) VALUES(?,?,?) ON CONFLICT(code) DO UPDATE SET data=excluded.data").run(value.code, JSON.stringify(value), now());
      return listPromos().find(promo => promo.code === value.code)!;
    });
  }
  function setPromoActive(code: string, active: boolean): AdminPromo {
    const promo = listPromos().find(item => item.code === code.toUpperCase());
    if (!promo) throw new AdminDataError("Discount code not found", 404);
    return savePromo({ ...promo, active });
  }

  function hydrateOrder(row: Row): AdminOrder {
    const order = JSON.parse(String(row.data));
    const customer = listCustomers().find(customer => customer.id === row.customer_id);
    if (!customer) throw new AdminDataError("Order customer is missing", 500);
    return { ...order, id: String(row.id), orderNumber: String(row.order_number), customer: { ...customer, ...order.customer, orderCount: customer.orderCount, totalSpentCents: customer.totalSpentCents }, status: row.status as AdminOrderStatus, createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
  }
  function listOrders(): AdminOrder[] { return (db.prepare("SELECT * FROM admin_orders ORDER BY created_at DESC,rowid DESC").all() as Row[]).map(hydrateOrder); }
  function getOrder(id: string): AdminOrder | null {
    const row = db.prepare("SELECT * FROM admin_orders WHERE id=? OR order_number=?").get(id, id) as Row | undefined;
    return row ? hydrateOrder(row) : null;
  }
  function listCustomers(): AdminCustomer[] {
    const orders = db.prepare("SELECT customer_id,status,data FROM admin_orders").all() as Row[];
    return (db.prepare("SELECT * FROM admin_customers ORDER BY created_at DESC").all() as Row[]).map(row => {
      const customerOrders = orders.filter(order => order.customer_id === row.id);
      return { ...JSON.parse(String(row.data)), id: String(row.id), createdAt: String(row.created_at), orderCount: customerOrders.length, totalSpentCents: customerOrders.filter(order => order.status === "delivered").reduce((sum, order) => sum + Number(JSON.parse(String(order.data)).totalCents), 0) };
    });
  }
  function updateOrderStatus(id: string, status: AdminOrderStatus): AdminOrder {
    if (!statuses.includes(status)) throw new AdminDataError("Choose a valid order status");
    return transaction(() => {
      const order = getOrder(id);
      if (!order) throw new AdminDataError("Order not found", 404);
      if (order.status === status) return order;
      if (!transitions[order.status].includes(status)) throw new AdminDataError(`An order marked ${order.status} cannot move to ${status}`);
      if (status === "cancelled") {
        const row = db.prepare("SELECT restocked FROM admin_orders WHERE id=?").get(order.id) as Row;
        if (!row.restocked) for (const item of order.items) db.prepare("UPDATE admin_variants SET stock=stock+? WHERE id=?").run(item.quantity, item.variantId);
      }
      db.prepare("UPDATE admin_orders SET status=?,updated_at=?,restocked=CASE WHEN ?='cancelled' THEN 1 ELSE restocked END WHERE id=?").run(status, now(), status, order.id);
      return getOrder(order.id)!;
    });
  }
  function getAdminOverview(): AdminOverview {
    const items = listProducts();
    const orders = listOrders();
    const lowStockProducts = items.filter(product => product.published && product.stock < 5);
    return { productCount: items.length, publishedCount: items.filter(product => product.published).length, draftCount: items.filter(product => !product.published).length, stockUnits: items.reduce((sum, product) => sum + product.stock, 0), lowStockCount: lowStockProducts.length, orderCount: orders.length, pendingOrderCount: orders.filter(order => order.status === "pending").length, customerCount: listCustomers().length, revenueCents: orders.filter(order => order.status === "delivered").reduce((sum, order) => sum + order.totalCents, 0), recentOrders: orders.slice(0, 5), lowStockProducts: lowStockProducts.slice(0, 8) };
  }
  function getStorefrontProducts(): Product[] {
    return listProducts().filter(product => product.published).map(product => {
      return {
        id: product.id, name: product.name, description: product.description, price: product.price, originalPrice: product.originalPrice,
        category: product.category, gender: product.gender, condition: product.condition, productType: product.productType,
        image: product.image, ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}), sizes: product.sizes, colors: product.colors,
        model: product.model, isNew: product.isNew, brand: product.brand, available: product.variants.some(variant => variant.published && variant.stock > 0),
      };
    });
  }
  function getStorefrontCatalog() {
    return { enabled: db.prepare("SELECT value FROM admin_settings WHERE key='storefront_enabled'").get()?.value === "true", products: getStorefrontProducts() };
  }

  function placeLocalOrder(raw: unknown, config = { shippingFeeCents: 595, freeOverCents: 9900 }) {
    const input = localOrderSchema.parse(raw);
    if (!Number.isSafeInteger(config.shippingFeeCents) || config.shippingFeeCents < 0 || !Number.isSafeInteger(config.freeOverCents) || config.freeOverCents < 0) throw new AdminDataError("Local delivery settings are invalid");
    return transaction(() => {
      if (!getStorefrontCatalog().enabled) throw new AdminDataError("Publish a local catalog before placing review orders", 409);
      const lines = input.items.map(item => {
        const product = getProduct(item.productSlug);
        const variant = product?.variants.find(variant => variant.size === item.size && variant.color === item.color);
        if (!product || !product.published || product.archived || !variant || !variant.published || variant.stock < item.quantity) throw new OrderValidationError("An item is no longer available in that quantity");
        const priced: PricedItem = { id: variant.id, productName: product.name, sku: variant.sku, size: variant.size, color: variant.color, unitPriceCents: Math.round(product.price * 100), stock: variant.stock, published: variant.published, quantity: item.quantity };
        return { product, variant, priced };
      });
      if (new Set(lines.map(line => line.variant.id)).size !== lines.length) throw new OrderValidationError("Duplicate product variants");
      // Reuse the existing customer/order validation after resolving server-owned variants.
      const validated = orderInputSchema.parse({ ...input, items: lines.map(line => ({ variantId: line.variant.id, quantity: line.priced.quantity })) });
      const promoCode = validated.promoCode?.trim().toUpperCase() || null;
      const storedPromo = promoCode ? listPromos().find(promo => promo.code === promoCode) : undefined;
      if (promoCode && !storedPromo) throw new OrderValidationError("Promo code is unavailable");
      const promo: PromoForOrder | null = storedPromo ? { ...storedPromo, expiresAt: storedPromo.expiresAt ? new Date(storedPromo.expiresAt) : null } : null;
      const totals = priceOrder(lines.map(line => line.priced), promo, config.shippingFeeCents, config.freeOverCents);
      for (const line of lines) {
        const result = db.prepare("UPDATE admin_variants SET stock=stock-? WHERE id=? AND stock>=?").run(line.priced.quantity, line.variant.id, line.priced.quantity);
        if (Number(result.changes) !== 1) throw new OrderValidationError("An item went out of stock");
        db.prepare("UPDATE admin_products SET updated_at=? WHERE id=?").run(now(), line.product.id);
      }
      if (storedPromo) db.prepare("UPDATE admin_promos SET uses=uses+1 WHERE code=?").run(storedPromo.code);
      const stamp = now();
      const digits = validated.mobile.replace(/\D/g, "");
      const mobile = `+961${digits.startsWith("961") ? digits.slice(3) : digits.replace(/^0/, "")}`;
      const identity = createHash("sha256").update(mobile).digest("hex");
      const previous = db.prepare("SELECT id,created_at FROM admin_customers WHERE identity_key=?").get(identity) as Row | undefined;
      const customerId = previous ? String(previous.id) : randomUUID();
      const customer = { id: customerId, fullName: validated.fullName, mobile, email: validated.email || "", governorate: validated.governorate, cityArea: validated.cityArea, streetBuilding: validated.streetBuilding, createdAt: previous ? String(previous.created_at) : stamp };
      db.prepare("INSERT INTO admin_customers(id,identity_key,data,created_at) VALUES(?,?,?,?) ON CONFLICT(identity_key) DO UPDATE SET data=excluded.data").run(customerId, identity, JSON.stringify(customer), customer.createdAt);
      const counter = Number(db.prepare("SELECT value FROM admin_settings WHERE key='order_number'").get()?.value || 0) + 1;
      db.prepare("INSERT INTO admin_settings(key,value) VALUES('order_number',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(counter));
      const id = randomUUID();
      const orderNumber = `BG-LOCAL-${String(counter).padStart(7, "0")}`;
      const items: AdminOrder["items"] = lines.map(line => ({ variantId: line.variant.id, productId: line.product.id, productName: line.product.name, sku: line.variant.sku, size: line.variant.size, color: line.variant.color, unitPriceCents: line.priced.unitPriceCents, quantity: line.priced.quantity }));
      const data = { ...totals, items, customer, paymentMethod: "cash_on_delivery", promoCode, landmark: validated.landmark || "", deliveryNotes: validated.deliveryNotes || "" };
      db.prepare("INSERT INTO admin_orders(id,order_number,customer_id,status,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").run(id, orderNumber, customerId, "pending", JSON.stringify(data), stamp, stamp);
      return { orderNumber, totals };
    });
  }

  // No manufactured order history or customers: draft catalog inputs are the only seed.
  if (seed && !db.prepare("SELECT 1 FROM admin_settings WHERE key='initial_seed'").get()) transaction(() => {
    for (const product of previewProducts) if (!getProduct(product.id)) writeProduct({ ...product, slug: product.id, published: false, imageUrl: null }, undefined, false);
    db.prepare("INSERT INTO admin_settings(key,value) VALUES('initial_seed','true')").run();
  });

  return { getAdminOverview, listProducts, getProduct, saveProduct, updateInventory, archiveProduct, setProductPublished, listOrders, getOrder, updateOrderStatus, listCustomers, listPromos, savePromo, setPromoActive, getStorefrontProducts, getStorefrontCatalog, placeLocalOrder, close: () => db.close() };
}

type Repository = ReturnType<typeof createAdminRepository>;
const repositories = new Map<string, Repository>();
export function getAdminRepository(): Repository {
  const filename = process.env.ADMIN_DATA_PATH || resolve(".data/admin.sqlite");
  let repository = repositories.get(filename);
  if (!repository) { repository = createAdminRepository(filename); repositories.set(filename, repository); }
  return repository;
}
export const getAdminOverview = () => getAdminRepository().getAdminOverview();
export const listProducts = (query?: Parameters<Repository["listProducts"]>[0]) => getAdminRepository().listProducts(query);
export const getProduct = (id: string) => getAdminRepository().getProduct(id);
export const saveProduct = (input: unknown, id?: string) => getAdminRepository().saveProduct(input, id);
export const updateInventory = (input: unknown) => getAdminRepository().updateInventory(input);
export const archiveProduct = (id: string, archived = true) => getAdminRepository().archiveProduct(id, archived);
export const setProductPublished = (id: string, published: boolean) => getAdminRepository().setProductPublished(id, published);
export const listOrders = () => getAdminRepository().listOrders();
export const getOrder = (id: string) => getAdminRepository().getOrder(id);
export const updateOrderStatus = (id: string, status: AdminOrderStatus) => getAdminRepository().updateOrderStatus(id, status);
export const listCustomers = () => getAdminRepository().listCustomers();
export const listPromos = () => getAdminRepository().listPromos();
export const savePromo = (input: unknown) => getAdminRepository().savePromo(input);
export const setPromoActive = (code: string, active: boolean) => getAdminRepository().setPromoActive(code, active);
export const getStorefrontProducts = () => getAdminRepository().getStorefrontProducts();
export const getStorefrontCatalog = () => getAdminRepository().getStorefrontCatalog();
export const placeLocalOrder = (input: unknown, config?: { shippingFeeCents: number; freeOverCents: number }) => getAdminRepository().placeLocalOrder(input, config);
