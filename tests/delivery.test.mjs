import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DELIVERY, deliveryFee, deliveryRuleFromSettings, dollars } from "../src/domain/delivery.ts";
import { calculateTotals } from "../src/state/storeCore.ts";
import { sortSizes } from "../src/domain/productColors.ts";

const rule = { fee: 5, freeFrom: 100 };

test("delivery is $5 below $100 and free from $100, the same rule the server charges", () => {
  assert.equal(deliveryFee(99.5, rule), 5, "a $99.50 bag is not free: this used to show free and then get charged");
  assert.equal(deliveryFee(99.99, rule), 5);
  assert.equal(deliveryFee(100, rule), 0, "exactly $100 is free (the server uses >=)");
  assert.equal(deliveryFee(140, rule), 0);
  assert.equal(deliveryFee(0, rule), 0, "an empty bag costs nothing");
});

test("the rule comes from the admin settings in cents, with safe defaults", () => {
  assert.deepEqual(deliveryRuleFromSettings({ shipping: 500, freeShipping: 10000 }), { fee: 5, freeFrom: 100 });
  assert.deepEqual(deliveryRuleFromSettings({ shipping: 300, freeShipping: 7500 }), { fee: 3, freeFrom: 75 });
  assert.deepEqual(deliveryRuleFromSettings({}), DEFAULT_DELIVERY);
  assert.deepEqual(deliveryRuleFromSettings({ shipping: -1, freeShipping: "x" }), DEFAULT_DELIVERY);
  assert.equal(dollars(100), "$100");
  assert.equal(dollars(5.95), "$5.95");
});

test("the bag total includes the delivery fee the customer will pay", () => {
  const prices = new Map([["dress", 33.17], ["overall", 50]]);
  const small = calculateTotals([{ productId: "dress", size: "S", color: "Pink", quantity: 3 }], prices, rule);
  assert.equal(small.subtotal, 99.51);
  assert.equal(small.shipping, 5);
  assert.equal(small.total, 104.51);
  const big = calculateTotals([{ productId: "overall", size: "S", color: "Blue", quantity: 2 }], prices, rule);
  assert.equal(big.shipping, 0);
  assert.equal(big.total, 100);
  assert.equal(calculateTotals([], prices, rule).total, 0);
});

test("sizes are listed smallest first on the shop as well", () => {
  assert.deepEqual(sortSizes(["0–3 Months", "12–18 Months", "18–24 Months", "3–6 Months", "New Born"]), ["New Born", "0–3 Months", "3–6 Months", "12–18 Months", "18–24 Months"]);
});
