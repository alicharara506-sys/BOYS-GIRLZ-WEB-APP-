import test from "node:test";
import assert from "node:assert/strict";
import { createOrder, OrderValidationError, priceOrder } from "../src/server/orderService.ts";

const variantId = "10000000-0000-4000-8000-000000000001";
const input = {
  fullName: "Sam Customer",
  mobile: "+961 71 234 567",
  email: "",
  governorate: "Beirut",
  cityArea: "Achrafieh",
  streetBuilding: "Main Street, Building 4",
  items: [{ variantId, quantity: 2 }],
};
const variant = {
  id: variantId,
  productName: "Cotton romper",
  sku: "BG-001",
  size: "3–6 Months",
  color: "Blue",
  unitPriceCents: 2800,
  stock: 4,
  published: true,
};

function repository(overrides = {}) {
  const calls = { decrements: [], saved: [], used: [] };
  const tx = {
    async getVariantsForUpdate() { return [overrides.variant ?? variant]; },
    async getPromoForUpdate() { return overrides.promo ?? null; },
    async decrementStock(id, quantity) {
      calls.decrements.push([id, quantity]);
      return overrides.decrementResult ?? true;
    },
    async saveOrder(...args) { calls.saved.push(args); return "BG-0000001"; },
    async usePromo(code) { calls.used.push(code); },
  };
  return { calls, transaction: (fn) => fn(tx) };
}

test("server prices in cents and waives delivery only above the threshold", () => {
  const item = { ...variant, quantity: 2 };
  assert.deepEqual(priceOrder([item], null, 595, 9900), {
    subtotalCents: 5600, discountCents: 0, shippingCents: 595, totalCents: 6195,
  });
  assert.equal(priceOrder([{ ...item, unitPriceCents: 4950 }], null, 595, 9900).shippingCents, 595);
  assert.equal(priceOrder([{ ...item, unitPriceCents: 4951 }], null, 595, 9900).shippingCents, 0);
});

test("promo rules are validated on the server", () => {
  const promo = {
    code: "SAVE10", discountType: "percent", amount: 10,
    minSubtotalCents: 5000, usageLimit: 2, uses: 0, expiresAt: null, active: true,
  };
  assert.equal(priceOrder([{ ...variant, quantity: 2 }], promo, 595, 9900).totalCents, 5635);
  assert.throws(() => priceOrder([{ ...variant, quantity: 1 }], promo, 595, 9900), OrderValidationError);
  assert.throws(() => priceOrder([{ ...variant, quantity: 2 }], { ...promo, uses: 2 }, 595, 9900), OrderValidationError);
});

test("a valid order saves server totals and decrements stock", async () => {
  const repo = repository();
  const result = await createOrder(input, repo, { shippingFeeCents: 595, freeOverCents: 9900 });
  assert.equal(result.orderNumber, "BG-0000001");
  assert.equal(result.totals.totalCents, 6195);
  assert.deepEqual(repo.calls.decrements, [[variantId, 2]]);
  assert.equal(repo.calls.saved.length, 1);
  assert.deepEqual(repo.calls.used, []);
});

test("unpublished, depleted, and stale variants cannot be ordered", async () => {
  for (const changed of [{ published: false }, { stock: 1 }, { id: "other" }]) {
    const repo = repository({ variant: { ...variant, ...changed } });
    await assert.rejects(createOrder(input, repo, { shippingFeeCents: 595, freeOverCents: 9900 }), OrderValidationError);
    assert.equal(repo.calls.saved.length, 0);
  }
});

test("order rejects invalid phone numbers and duplicate variants", async () => {
  const repo = repository();
  await assert.rejects(createOrder({ ...input, mobile: "123" }, repo, { shippingFeeCents: 595, freeOverCents: 9900 }));
  await assert.rejects(createOrder({ ...input, items: [input.items[0], input.items[0]] }, repo, { shippingFeeCents: 595, freeOverCents: 9900 }), OrderValidationError);
});
