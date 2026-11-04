import { adminHeaders } from "../admin-auth.server";
import { campaignAudience } from "./operations.server";
import { commerceSnapshot } from "./queries.server";

const dollar = (n: number) => (n / 100).toFixed(2);
function cell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export async function commerceExport(url: URL) {
  const kind = url.searchParams.get("kind") || "reports";
  const data = await commerceSnapshot(
    url.searchParams.get("from") || undefined,
    url.searchParams.get("to") || undefined,
  );
  let rows: unknown[][] = [];
  if (kind === "products")
    rows = [
      [
        "Product",
        "Slug",
        "Category",
        "Gender",
        "In-store USD",
        "Online USD",
        "Cost USD",
        "Published",
        "Sample",
      ],
      ...data.products.map((p) => [
        p.name,
        p.slug,
        p.category,
        p.gender,
        dollar(p.price),
        dollar(p.onlinePrice),
        dollar(p.cost),
        p.published,
        p.demo,
      ]),
    ];
  else if (kind === "inventory")
    rows = [
      [
        "Product",
        "Size",
        "Color",
        "SKU",
        "Barcode",
        "Available units",
        "Avg cost USD",
        "Value USD",
        "Threshold",
        "Reorder suggestion",
      ],
      ...data.products.flatMap((p) =>
        p.variants.map((v) => [
          p.name,
          v.size,
          v.color,
          v.sku,
          v.barcode,
          v.stock,
          dollar(v.averageCost),
          dollar(v.stock * v.averageCost),
          p.threshold,
          v.stock <= p.threshold ? Math.max(0, p.threshold * 2 - v.stock) : 0,
        ]),
      ),
    ];
  else if (kind === "customers")
    rows = [
      [
        "Name",
        "Phone",
        "Email",
        "Address",
        "Tags",
        "Lifetime spend USD",
        "Points",
        "Credit USD",
      ],
      ...data.customers.map((c) => [
        c.name,
        c.phone,
        c.email,
        c.address,
        c.tags.join("; "),
        dollar(c.lifetimeValue),
        c.points,
        dollar(c.credit),
      ]),
    ];
  else if (kind === "orders")
    rows = [
      [
        "Order",
        "Date",
        "Channel",
        "Customer",
        "Status",
        "Total USD",
        "Returned USD",
        "Sample",
      ],
      ...data.orders
        .filter(
          (o) =>
            o.createdAt.slice(0, 10) >= data.report.from &&
            o.createdAt.slice(0, 10) <= data.report.to,
        )
        .map((o) => [
          `BG-${o.number}`,
          o.createdAt,
          o.channel,
          o.customerName,
          o.status,
          dollar(o.total),
          dollar(o.returns.reduce((s, r) => s + r.amount, 0)),
          o.demo,
        ]),
    ];
  else if (kind === "journal")
    rows = [
      ["Date", "Reference", "Memo", "Account", "Debit USD", "Credit USD"],
      ...data.journals.flatMap((j) =>
        j.lines.map((l) => [
          j.date,
          j.reference,
          j.memo,
          `${l.accountId} ${l.account.name}`,
          dollar(l.debit),
          dollar(l.credit),
        ]),
      ),
    ];
  else if (kind === "campaign") {
    const audience = await campaignAudience(
      url.searchParams.get("segment") || "all",
    );
    rows = [
      ["Name", "Phone", "Email", "Tags"],
      ...audience.map((c) => [c.name, c.phone, c.email, c.tags.join("; ")]),
    ];
  } else if (kind === "reports") {
    const r = data.report;
    rows = [
      ["Report", "From", "Through", "Metric", "USD / Count"],
      ["P&L", r.from, r.to, "Net income", dollar(r.income)],
      ["P&L", r.from, r.to, "COGS", dollar(r.cogs)],
      ["P&L", r.from, r.to, "Operating expenses", dollar(r.expense)],
      ["P&L", r.from, r.to, "Profit", dollar(r.profit)],
      ["Channels", r.from, r.to, "POS", dollar(r.pos)],
      ["Channels", r.from, r.to, "Online", dollar(r.online)],
      ["Tax", r.from, r.to, "Tax collected", dollar(r.tax)],
      [
        "Cash flow",
        r.from,
        r.to,
        "Cash / Whish net movement",
        dollar(r.cashFlow),
      ],
      [
        "Valuation",
        "Current",
        "Current",
        "Inventory",
        dollar(r.inventoryValue),
      ],
      ...r.topProducts.map((p) => [
        "Product sales",
        r.from,
        r.to,
        p.name,
        dollar(p.total),
      ]),
      ...r.categories.map((c) => [
        "Category sales",
        r.from,
        r.to,
        c.name,
        dollar(c.total),
      ]),
      ...r.series.map((s) => [
        "Daily sales",
        s.date,
        s.date,
        "Combined",
        dollar(s.pos + s.online),
      ]),
    ];
  } else
    return new Response("Export not found", {
      status: 404,
      headers: adminHeaders,
    });
  return new Response(
    "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n"),
    {
      headers: {
        ...adminHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="boys-girlz-${kind}.csv"`,
      },
    },
  );
}
