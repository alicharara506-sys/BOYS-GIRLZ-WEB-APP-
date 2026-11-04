import { db } from "./db.server";
import type { Category } from "../../data/products";
import { dateRange } from "./rules";
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
  ] = await Promise.all([
    db.product.findMany({
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
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
    db.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    settings(),
    db.stockMovement.findMany({
      include: { variant: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
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
        .filter((a) => ["1000", "1010", "1020"].includes(a.code))
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

export async function storefrontCatalog() {
  const products = await db.product.findMany({
    where: { published: true, archived: false },
    include: { variants: { where: { active: true } } },
  });
  return {
    enabled: true,
    products: products.map((p) => ({
      id: p.slug,
      name: p.name,
      description: p.description,
      price: p.onlinePrice / 100,
      category: (p.category === "Toys" || p.category === "Accessories"
        ? p.category
        : p.gender) as Category,
      gender: p.gender as "Boys" | "Girls" | "Unisex",
      condition: "new" as const,
      productType: p.category,
      image: p.imageIndex,
      imageUrl: p.imageUrl || null,
      available: p.variants.some((v) => v.stock > 0),
      sizes: [...new Set(p.variants.map((v) => v.size))],
      colors: [...new Set(p.variants.map((v) => v.color))],
      model: "set" as const,
      isNew: p.featured,
      brand: p.brand,
    })),
  };
}
