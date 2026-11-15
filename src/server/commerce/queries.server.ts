import { publicSupabase } from "../supabase.server";
import { finalPrice } from "../../domain/pricing";
import { db } from "./db.server";
import type { Category } from "../../data/products";
import { sortSizes, type ColorImage, type ColorMode, type ProductColor } from "../../domain/productColors";
import { dateRange } from "./rules";
import { DEFAULT_DELIVERY, deliveryRuleFromSettings, type DeliveryRule } from "../../domain/delivery";
import { fullOrder, settings } from "./sales.server";

export async function commerceSnapshot(from?: string, to?: string) {
  const range = dateRange(from, to);
  const [
    products,
    customers,
    orders,
    suppliers,
    purchases,
    drawers,
    parked,
    expenses,
    journals,
    accounts,
    gifts,
    promos,
    campaigns,
    config,
    movements,
    shops,
    categories,
    liabilities,
  ] = await Promise.all([
    db.product.findMany({
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
        // Per-color swatch, photos and availability, for the overview and editing in the modal.
        colorDetails: { orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      include: {
        children: true,
        loyalty: { orderBy: { createdAt: "desc" }, take: 20 },
      },
      orderBy: { name: "asc" },
    }),
    db.order.findMany({ include: fullOrder, orderBy: { createdAt: "desc" } }),
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.drawer.findMany({
      include: { payments: true, cashEvents: true },
      orderBy: { openedAt: "desc" },
      take: 90,
    }),
    db.parkedSale.findMany({ orderBy: { createdAt: "desc" } }),
    db.expense.findMany({ orderBy: { date: "desc" } }),
    db.journal.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { date: "desc" },
    }),
    db.account.findMany({ orderBy: { code: "asc" } }),
    db.giftCard.findMany({ orderBy: { createdAt: "desc" } }),
    db.promo.findMany(),
    db.campaign.findMany({
      include: {
        recipients: { include: { customer: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    settings(),
    // The Inventory page shows the latest 15 movements; only the product name is needed.
    db.stockMovement.findMany({
      include: { variant: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    // Fetched with everything else (not after it), so the page waits for one round of queries.
    db.shop.findMany(),
    db.category.findMany(),
    db.liability.findMany(),
  ]);
  const sales = orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      o.createdAt >= range.gte &&
      o.createdAt <= range.lte,
  );
  const selectedJournals = journals.filter(
    (j) => j.date >= range.gte && j.date <= range.lte,
  );
  const balances = accounts.map((account) => {
    const rows = selectedJournals
      .flatMap((j) => j.lines)
      .filter((l) => l.accountId === account.code);
    const all = journals
      .flatMap((j) => j.lines)
      .filter((l) => l.accountId === account.code);
    return {
      ...account,
      debit: rows.reduce((s, l) => s + l.debit, 0),
      credit: rows.reduce((s, l) => s + l.credit, 0),
      balance: all.reduce((s, l) => s + l.debit - l.credit, 0),
    };
  });
  const income =
    balances
      .filter((a) => a.type === "income")
      .reduce((s, a) => s + a.credit - a.debit, 0) -
    balances
      .filter((a) => a.type === "contra-income")
      .reduce((s, a) => s + a.debit - a.credit, 0);
  const cogs = balances
    .filter((a) => a.code === "5000")
    .reduce((s, a) => s + a.debit - a.credit, 0);
  const expense = balances
    .filter((a) => a.type === "expense" && a.code !== "5000")
    .reduce((s, a) => s + a.debit - a.credit, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      o.createdAt.toISOString().slice(0, 10) === today,
  );
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const prevStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const netValue = (order: (typeof orders)[number]) =>
    order.total - order.returns.reduce((s, r) => s + r.amount, 0);
  const month = orders
    .filter((o) => o.status !== "cancelled" && o.createdAt >= monthStart)
    .reduce((s, o) => s + netValue(o), 0);
  const lastMonth = orders
    .filter(
      (o) =>
        o.status !== "cancelled" &&
        o.createdAt >= prevStart &&
        o.createdAt < monthStart,
    )
    .reduce((s, o) => s + netValue(o), 0);
  const series = new Map<
    string,
    { date: string; pos: number; online: number }
  >();
  for (const order of sales) {
    const date = order.createdAt.toISOString().slice(0, 10);
    const row = series.get(date) || { date, pos: 0, online: 0 };
    row[order.channel === "pos" ? "pos" : "online"] += netValue(order);
    series.set(date, row);
  }
  const grouped = new Map<
    string,
    { name: string; quantity: number; total: number; category: string }
  >();
  for (const order of sales)
    for (const line of order.items) {
      const row = grouped.get(line.name) || {
        name: line.name,
        quantity: 0,
        total: 0,
        category: line.category,
      };
      row.quantity += line.quantity - line.returned;
      row.total +=
        line.net - Math.floor((line.net * line.returned) / line.quantity);
      grouped.set(line.name, row);
    }
  const byCategory = new Map<string, number>();
  for (const row of grouped.values())
    byCategory.set(
      row.category,
      (byCategory.get(row.category) || 0) + row.total,
    );
  const lowStock = products
    .filter((p) => !p.archived)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= p.threshold)
        .map((v) => ({
          ...v,
          productName: p.name,
          threshold: p.threshold,
          reorder: Math.max(0, p.threshold * 2 - v.stock),
        })),
    );
  const data = {
    shops,
    categories,
    liabilities,
    products,
    customers: customers.map((c) => {
      const history = orders.filter(
        (o) => o.customerId === c.id && o.status !== "cancelled",
      );
      return {
        ...c,
        lifetimeValue: history.reduce((s, o) => s + netValue(o), 0),
        visits: history.length,
        lastVisit: history[0]?.createdAt || null,
      };
    }),
    orders,
    suppliers,
    purchases,
    drawers,
    parked,
    expenses,
    journals: selectedJournals,
    accounts: balances,
    gifts,
    promos,
    campaigns,
    settings: config,
    movements,
    lowStock,
    report: {
      from: range.gte.toISOString().slice(0, 10),
      to: range.lte.toISOString().slice(0, 10),
      income,
      cogs,
      expense,
      profit: income - cogs - expense,
      sales: sales.reduce((s, o) => s + netValue(o), 0),
      count: sales.length,
      pos: sales
        .filter((o) => o.channel === "pos")
        .reduce((s, o) => s + netValue(o), 0),
      online: sales
        .filter((o) => o.channel === "online")
        .reduce((s, o) => s + netValue(o), 0),
      tax: 0,
      inventoryValue: products
        .flatMap((p) => p.variants)
        .reduce((s, v) => s + v.stock * v.averageCost, 0),
      cashFlow: balances
        .filter((a) => ["1000", "1020"].includes(a.code))
        .reduce((s, a) => s + a.debit - a.credit, 0),
      series: [...series.values()].sort((a, b) => a.date.localeCompare(b.date)),
      topProducts: [...grouped.values()].sort((a, b) => b.total - a.total),
      categories: [...byCategory].map(([name, total]) => ({ name, total })),
    },
    kpis: {
      today: todaySales.reduce((s, o) => s + netValue(o), 0),
      todayCount: todaySales.length,
      month,
      lastMonth,
      cash: balances.find((a) => a.code === "1000")?.balance || 0,
      payable: purchases
        .filter((p) => p.status === "received")
        .reduce((s, p) => s + p.total - p.paid, 0),
      customers: customers.length,
      units: products
        .flatMap((p) => p.variants)
        .reduce((s, v) => s + v.stock, 0),
    },
  };
  // Dates become ISO strings at the server boundary; no Prisma or secrets enter the browser.
  return JSON.parse(JSON.stringify(data)) as Serialized<typeof data>;
}
type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;
export type CommerceSnapshot = Awaited<ReturnType<typeof commerceSnapshot>>;

const baseColumns =
  "id,slug,name,description,price_cents,online_price_cents,discount_type,discount_value,category,gender,brand,image_url,image_index,featured,visibility,archived,product_variants(id,size,color,stock,active)";
// Added by the product-colors migration. Until it is applied the catalogue loads without them.
const colorColumns =
  ",name_ar,description_ar,color_mode,product_colors(name,name_ar,hex,images,available,position)";
type StoredColor = { name: string; name_ar: string; hex: string; images: unknown; available: boolean; position: number };
function storedImages(value: unknown): ColorImage[] {
  return Array.isArray(value)
    ? value.filter((image): image is ColorImage => Boolean(image) && typeof image.url === "string").map(({ url }) => ({ url }))
    : [];
}
// The delivery fee and free-delivery threshold from the admin settings, for the storefront. Read at
// most once a minute; if the settings can't be read the defaults (same as the server's) are used.
let deliveryCache: { rule: DeliveryRule; at: number } | null = null;
export async function storefrontDelivery(): Promise<DeliveryRule> {
  if (deliveryCache && Date.now() - deliveryCache.at < 60_000) return deliveryCache.rule;
  try {
    const rule = deliveryRuleFromSettings(await settings());
    deliveryCache = { rule, at: Date.now() };
    return rule;
  } catch {
    return deliveryCache?.rule || DEFAULT_DELIVERY;
  }
}
export async function storefrontCatalog() {
  const query = (columns: string) =>
    publicSupabase()
      .from("products")
      .select(columns)
      .eq("visibility", "website_and_pos")
      .eq("archived", false);
  let result = await query(baseColumns + colorColumns);
  if (result.error) result = await query(baseColumns);
  if (result.error) throw new Error("The shared catalog could not be loaded.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase client rows
  const rows = (result.data || []) as any[];
  return {
    enabled: true,
    products: rows.map((p) => {
      const variants = (p.product_variants as { size: string; color: string; stock: number; active: boolean }[]).filter((v) => v.active);
      const variantColors = [...new Set(variants.map((v) => v.color))];
      const allSizes = sortSizes([...new Set(variants.map((v) => v.size))]);
      // Online orders need stock on the shelf, so a size with none left shows as unavailable.
      const inStock = variants.filter((v) => v.stock > 0);
      // A color's own sizes are its in-stock variants; listed only when it lacks some sizes.
      const sizesOf = (color: string) => {
        const own = new Set(inStock.filter((v) => v.color === color).map((v) => v.size));
        return own.size < allSizes.length ? allSizes.filter((s) => own.has(s)) : undefined;
      };
      const colorInStock = (color: string) => inStock.some((v) => v.color === color);
      // Color details, in the shop's order, only for colors that still have sellable variants.
      const colorVariants: ProductColor[] = ((p.product_colors || []) as StoredColor[])
        .filter((c) => variantColors.includes(c.name))
        .sort((a, b) => a.position - b.position)
        .map((c) => ({ name: c.name, nameAr: c.name_ar, hex: c.hex, images: storedImages(c.images), available: c.available && colorInStock(c.name), sizes: sizesOf(c.name) }));
      const detailed = colorVariants.length > 0;
      const colors = detailed
        ? [...colorVariants.map((c) => c.name), ...variantColors.filter((c) => !colorVariants.some((v) => v.name === c))]
        : variantColors;
      return {
        id: p.slug as string,
        name: p.name as string,
        description: p.description as string,
        price:
          finalPrice(p.online_price_cents, {
            discountType: p.discount_type,
            discountValue: p.discount_value,
          }) / 100,
        originalPrice: p.discount_type ? (p.online_price_cents as number) / 100 : undefined,
        category: (p.category === "Toys" || p.category === "Accessories"
          ? p.category
          : p.gender) as Category,
        gender: p.gender as "Boys" | "Girls" | "Unisex",
        condition: "new" as const,
        productType: p.category as string,
        image: p.image_index as number,
        imageUrl: (detailed ? colorVariants[0].images[0]?.url : undefined) || p.image_url || null,
        // A product with color details is sellable while at least one color is available.
        available: detailed ? colorVariants.some((c) => c.available) : inStock.length > 0,
        sizes: allSizes,
        colors,
        model: "set" as const,
        isNew: p.featured as boolean,
        brand: p.brand as string,
        nameAr: (p.name_ar as string | undefined) || undefined,
        descriptionAr: (p.description_ar as string | undefined) || undefined,
        colorMode: detailed ? (p.color_mode as ColorMode) : undefined,
        colorVariants: detailed ? colorVariants : undefined,
      };
    }),
  };
}
