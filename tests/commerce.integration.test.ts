import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/commerce/db.server";
import {
  runCommand,
  saveCommerceProduct,
} from "../src/server/commerce/operations.server";
import {
  createSale,
  updateOnlineOrder,
} from "../src/server/commerce/sales.server";
import { journal } from "../src/server/commerce/ledger.server";
import { builtInStorefront } from "../src/server/commerce/adapters.server";
import {
  commerceSnapshot,
  storefrontCatalog,
} from "../src/server/commerce/queries.server";
import { commerceExport } from "../src/server/commerce/export.server";

if (!process.env.BNG_ADMIN_DATA_DIR?.includes("commerce-test-"))
  throw new Error("Commerce verification requires its isolated test database.");
after(() => db.$disconnect());
async function product(stock = 10, price = 1001) {
  const p = await saveCommerceProduct({
    name: "Integration test shirt",
    slug: `test-${randomUUID()}`,
    description: "Test",
    category: "Tops",
    gender: "Boys",
    brand: "Test",
    season: "All season",
    imageUrl: "",
    imageIndex: 0,
    price,
    onlinePrice: price,
    cost: 300,
    threshold: 2,
    published: true,
    featured: false,
    onlineOnly: false,
    sizes: ["2–3 Years"],
    colors: ["Blue"],
  });
  const v = await db.variant.findFirstOrThrow({ where: { productId: p.id } });
  await runCommand("adjust-stock", {
    variantId: v.id,
    quantity: stock,
    reason: "opening stock",
    note: "Isolated test stock",
  });
  return { p, v };
}
const customer = () =>
  db.customer.create({
    data: {
      name: "Test family",
      phone: `TEST-${randomUUID()}`,
      email: "test@example.test",
    },
  });
test("every seeded journal balances and demo data is labeled", async () => {
  const journals = await db.journal.findMany({ include: { lines: true } });
  assert.ok(journals.length > 20);
  for (const j of journals)
    assert.equal(
      j.lines.reduce((s, l) => s + l.debit - l.credit, 0),
      0,
    );
  assert.equal(await db.order.count({ where: { demo: false } }), 0);
});
test("sale, shared inventory, payments, loyalty and journal save once on retry", async () => {
  const { v } = await product();
  const c = await customer();
  const key = randomUUID();
  const input = {
    requestKey: key,
    customerId: c.id,
    items: [{ variantId: v.id, quantity: 2 }],
    payments: [{ method: "card" as const, amount: 2002 }],
  };
  const first = await createSale(input);
  const second = await createSale(input);
  assert.equal(first.id, second.id);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    8,
  );
  assert.equal(
    (await db.customer.findUniqueOrThrow({ where: { id: c.id } })).points,
    20,
  );
  assert.equal(
    await db.journal.count({ where: { reference: `sale:${first.id}` } }),
    1,
  );
});
test("concurrent sales cannot oversell the last unit", async () => {
  const { v } = await product(1);
  const run = () =>
    createSale({
      requestKey: randomUUID(),
      items: [{ variantId: v.id, quantity: 1 }],
      payments: [{ method: "card", amount: 1001 }],
    });
  const results = await Promise.allSettled([run(), run()]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    0,
  );
});
test("invalid split payment and insufficient gift balance leave no partial sale", async () => {
  const { v } = await product();
  const before = await db.order.count();
  await assert.rejects(
    createSale({
      requestKey: randomUUID(),
      items: [{ variantId: v.id, quantity: 1 }],
      payments: [{ method: "card", amount: 1 }],
    }),
  );
  await assert.rejects(
    createSale({
      requestKey: randomUUID(),
      items: [{ variantId: v.id, quantity: 1 }],
      payments: [{ method: "gift", amount: 1001, reference: "INVALID" }],
    }),
  );
  assert.equal(await db.order.count(), before);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    10,
  );
});
test("POS and online storefront use identical stock and customer history", async () => {
  const { p, v } = await product(4);
  const online = await builtInStorefront.placeOrder({
    fullName: "Shared customer",
    mobile: "+96170009999",
    email: "share@example.test",
    governorate: "Beirut",
    cityArea: "Demo",
    streetBuilding: "Demo",
    landmark: "",
    deliveryNotes: "",
    promoCode: "",
    requestKey: randomUUID(),
    items: [{ productSlug: p.slug, size: v.size, color: v.color, quantity: 2 }],
    paymentMethod: "whish",
  });
  assert.ok(online.orderNumber.startsWith("BG-"));
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    2,
  );
  const order = await db.order.findFirstOrThrow({
    where: { items: { some: { variantId: v.id } }, channel: "online" },
  });
  assert.equal(order.status, "pending");
  assert.equal(await db.payment.count({ where: { orderId: order.id } }), 0);
  await createSale({
    requestKey: randomUUID(),
    customerId: order.customerId!,
    items: [{ variantId: v.id, quantity: 1 }],
    payments: [{ method: "card", amount: 1001 }],
  });
  assert.equal(
    await db.order.count({ where: { customerId: order.customerId } }),
    2,
  );
  assert.ok(
    (await storefrontCatalog()).products.find((p1) => p1.id === p.slug),
  );
});
test("COD fulfillment, collection and cancellation reverse stock and journals once", async () => {
  const { v } = await product(4);
  const order = await createSale({
    requestKey: randomUUID(),
    channel: "online",
    items: [{ variantId: v.id, quantity: 1 }],
  });
  await updateOnlineOrder(order.id, "packed", "TRACK1", "Demo", "whish");
  await updateOnlineOrder(order.id, "cancelled", "TRACK1", "Demo", "whish");
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    4,
  );
  await assert.rejects(
    updateOnlineOrder(order.id, "cancelled", "", "", "whish"),
  );
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    4,
  );
  const next = await createSale({
    requestKey: randomUUID(),
    channel: "online",
    items: [{ variantId: v.id, quantity: 1 }],
  });
  await updateOnlineOrder(next.id, "paid", "", "", "whish");
  assert.equal(
    (await db.payment.findFirstOrThrow({ where: { orderId: next.id } })).amount,
    next.total,
  );
});
test("partial returns preserve every discounted cent and cannot exceed sold quantity", async () => {
  const { v } = await product(6);
  const c = await customer();
  const order = await createSale({
    requestKey: randomUUID(),
    customerId: c.id,
    items: [{ variantId: v.id, quantity: 3 }],
    discount: 2,
    payments: [{ method: "card", amount: 3001 }],
  });
  const first = (await runCommand("return", {
    orderId: order.id,
    items: [{ lineId: order.items[0].id, quantity: 1, restock: true }],
    method: "credit",
    reason: "Size",
  })) as { amount: number };
  const second = (await runCommand("return", {
    orderId: order.id,
    items: [{ lineId: order.items[0].id, quantity: 2, restock: true }],
    method: "credit",
    reason: "Size",
  })) as { amount: number };
  assert.equal(first.amount + second.amount, 3001);
  assert.equal(
    (await db.customer.findUniqueOrThrow({ where: { id: c.id } })).credit,
    3001,
  );
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    6,
  );
  await assert.rejects(
    runCommand("return", {
      orderId: order.id,
      items: [{ lineId: order.items[0].id, quantity: 1, restock: true }],
      method: "credit",
      reason: "Again",
    }),
  );
});
test("a failed exchange rolls back the return, restock and credit", async () => {
  const { v } = await product();
  const c = await customer();
  const order = await createSale({
    requestKey: randomUUID(),
    customerId: c.id,
    items: [{ variantId: v.id, quantity: 1 }],
    payments: [{ method: "card", amount: 1001 }],
  });
  await assert.rejects(
    runCommand("exchange", {
      orderId: order.id,
      items: [{ lineId: order.items[0].id, quantity: 1, restock: true }],
      method: "credit",
      reason: "Exchange",
      replacement: {
        requestKey: randomUUID(),
        customerId: c.id,
        items: [{ variantId: "missing", quantity: 1 }],
        payments: [{ method: "credit", amount: 1001 }],
      },
    }),
  );
  assert.equal(await db.return.count({ where: { orderId: order.id } }), 0);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    9,
  );
  assert.equal(
    (await db.customer.findUniqueOrThrow({ where: { id: c.id } })).credit,
    0,
  );
});
test("return retries are idempotent and a valid exchange redeems the new credit atomically", async () => {
  const { v } = await product();
  const c = await customer();
  const original = await createSale({
    requestKey: randomUUID(),
    customerId: c.id,
    items: [{ variantId: v.id, quantity: 2 }],
    payments: [{ method: "card", amount: 2002 }],
  });
  const input = {
    requestKey: randomUUID(),
    orderId: original.id,
    items: [{ lineId: original.items[0].id, quantity: 1, restock: true }],
    method: "credit",
    reason: "Swap size",
    replacement: {
      requestKey: randomUUID(),
      customerId: c.id,
      items: [{ variantId: v.id, quantity: 1 }],
      payments: [{ method: "credit", amount: 1001 }],
    },
  };
  await runCommand("exchange", input);
  await runCommand("exchange", input);
  assert.equal(await db.return.count({ where: { orderId: original.id } }), 1);
  assert.equal(
    (await db.customer.findUniqueOrThrow({ where: { id: c.id } })).credit,
    0,
  );
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    8,
  );
});
test("online demo orders redeem gift cards and points through the protected sale contract", async () => {
  const { v } = await product();
  const c = await customer();
  await db.customer.update({ where: { id: c.id }, data: { points: 100 } });
  const order = await createSale({
    requestKey: randomUUID(),
    channel: "online",
    customerId: c.id,
    items: [{ variantId: v.id, quantity: 1 }],
    pointsUsed: 100,
    payments: [{ method: "gift", amount: 1401, reference: "DEMO-GIFT-50" }],
  });
  assert.equal(order.status, "paid");
  assert.equal(order.total, 1401);
  assert.equal(
    (await db.giftCard.findUniqueOrThrow({ where: { code: "DEMO-GIFT-50" } }))
      .balance,
    3599,
  );
});
test("receiving a purchase and partial supplier payment update stock, valuation and payable", async () => {
  const { v } = await product();
  const supplier = await db.supplier.findFirstOrThrow();
  const po = (await runCommand("purchase", {
    supplierId: supplier.id,
    invoiceNumber: "TEST-PO",
    dueDate: "2026-12-01",
    items: [{ variantId: v.id, quantity: 10, cost: 500 }],
  })) as { id: string };
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: v.id } })).stock,
    10,
  );
  await runCommand("receive-purchase", { id: po.id });
  const variant = await db.variant.findUniqueOrThrow({ where: { id: v.id } });
  assert.equal(variant.stock, 20);
  assert.equal(variant.averageCost, 400);
  await assert.rejects(runCommand("receive-purchase", { id: po.id }));
  await runCommand("pay-supplier", {
    id: po.id,
    amount: 1000,
    method: "whish",
    reference: "Test",
  });
  assert.equal(
    (await db.purchase.findUniqueOrThrow({ where: { id: po.id } })).paid,
    1000,
  );
  await assert.rejects(
    runCommand("pay-supplier", {
      id: po.id,
      amount: 9999,
      method: "card",
      reference: "",
    }),
  );
});
test("cash drawer reconciles split cash, expense and variance", async () => {
  const drawer = (await runCommand("open-drawer", { opening: 10000 })) as {
    id: string;
  };
  await assert.rejects(runCommand("open-drawer", { opening: 100 }));
  const { v } = await product();
  await createSale({
    requestKey: randomUUID(),
    items: [{ variantId: v.id, quantity: 1 }],
    payments: [
      { method: "cash", amount: 500 },
      { method: "card", amount: 501 },
    ],
    cashTendered: 1000,
  });
  await runCommand("expense", {
    category: "Supplies",
    amount: 200,
    method: "cash",
    note: "Test supplies",
    date: new Date().toISOString().slice(0, 10),
  });
  const closed = (await runCommand("close-drawer", {
    id: drawer.id,
    counted: 10250,
    note: "Test",
  })) as { expected: number; variance: number };
  assert.equal(closed.expected, 10300);
  assert.equal(closed.variance, -50);
  await assert.rejects(
    runCommand("close-drawer", { id: drawer.id, counted: 0, note: "" }),
  );
});
test("unbalanced journal is rejected and all final journals balance", async () => {
  await assert.rejects(
    db.$transaction((tx) =>
      journal(tx, randomUUID(), "Invalid", [{ accountId: "1000", debit: 100 }]),
    ),
  );
  const rows = await db.journal.findMany({ include: { lines: true } });
  for (const row of rows)
    assert.equal(
      row.lines.reduce((s, l) => s + l.debit - l.credit, 0),
      0,
      row.reference,
    );
  const snapshot = await commerceSnapshot();
  assert.equal(snapshot.report.tax, 0);
  const exported = await commerceExport(
    new URL("http://localhost/admin/export?kind=reports"),
  );
  assert.equal(exported.status, 200);
  assert.match(await exported.text(), /Profit/);
});
