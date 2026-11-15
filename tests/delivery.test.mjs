import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DELIVERY, deliveryAnswer, deliveryFee, deliveryRuleFromSettings, deliverySentence, dollars } from "../src/domain/delivery.ts";
import { calculateTotals } from "../src/state/storeCore.ts";
import { sortSizes } from "../src/domain/productColors.ts";

const rule = { fee: 5, freeFrom: 99 };

test("delivery is $5 below $99 and free from $99, the same rule the server charges", () => {
  assert.equal(deliveryFee(98.99, rule), 5);
  assert.equal(deliveryFee(99, rule), 0, "exactly $99 is free (the server uses >=)");
  assert.equal(deliveryFee(140, rule), 0);
  assert.equal(deliveryFee(0, rule), 0, "an empty bag costs nothing");
  assert.equal(deliveryFee(95, { fee: 5, freeFrom: 90 }), 0, "the owner can lower the amount to $90");
});

test("with free delivery turned off, every order pays the fee", () => {
  const off = { fee: 5, freeFrom: null };
  assert.equal(deliveryFee(500, off), 5);
  assert.equal(deliveryFee(10, off), 5);
  assert.equal(deliveryFee(0, off), 0);
});

test("the rule comes from the admin settings in cents, with safe defaults", () => {
  assert.deepEqual(deliveryRuleFromSettings({ shipping: 500, freeShipping: 9900 }), { fee: 5, freeFrom: 99 });
  assert.deepEqual(deliveryRuleFromSettings({ shipping: 300, freeShipping: 7500, freeShippingEnabled: true }), { fee: 3, freeFrom: 75 });
  assert.deepEqual(deliveryRuleFromSettings({ shipping: 500, freeShipping: 9900, freeShippingEnabled: false }), { fee: 5, freeFrom: null });
  assert.deepEqual(deliveryRuleFromSettings({}), DEFAULT_DELIVERY);
  assert.deepEqual(deliveryRuleFromSettings({ shipping: -1, freeShipping: "x" }), DEFAULT_DELIVERY);
  assert.equal(dollars(99), "$99");
  assert.equal(dollars(5.95), "$5.95");
});

test("the help and FAQ texts follow the admin settings", () => {
  assert.match(deliverySentence(rule, "en"), /Delivery is \$5, and free on orders of \$99 or more/);
  assert.match(deliverySentence({ fee: 5, freeFrom: 90 }, "ar"), /\$90/);
  assert.match(deliverySentence({ fee: 5, freeFrom: null }, "en"), /Delivery is \$5 per order\.$/);
  assert.doesNotMatch(deliveryAnswer({ fee: 5, freeFrom: null }, "en"), /free/i);
  assert.match(deliveryAnswer({ fee: 0, freeFrom: null }, "en"), /Delivery is free on every order\./);
  assert.match(deliveryAnswer({ fee: 0, freeFrom: null }, "ar"), /فقط\. التوصيل مجاني/);
});

test("the bag total includes the delivery fee the customer will pay", () => {
  const prices = new Map([["dress", 33], ["overall", 49.5]]);
  const small = calculateTotals([{ productId: "dress", size: "S", color: "Pink", quantity: 2 }], prices, rule);
  assert.equal(small.subtotal, 66);
  assert.equal(small.shipping, 5);
  assert.equal(small.total, 71);
  const big = calculateTotals([{ productId: "overall", size: "S", color: "Blue", quantity: 2 }], prices, rule);
  assert.equal(big.shipping, 0);
  assert.equal(big.total, 99);
  const off = calculateTotals([{ productId: "overall", size: "S", color: "Blue", quantity: 4 }], prices, { fee: 5, freeFrom: null });
  assert.equal(off.total, 203);
  assert.equal(calculateTotals([], prices, rule).total, 0);
});

test("sizes are listed smallest first on the shop as well", () => {
  assert.deepEqual(sortSizes(["0–3 Months", "12–18 Months", "18–24 Months", "3–6 Months", "New Born"]), ["New Born", "0–3 Months", "3–6 Months", "12–18 Months", "18–24 Months"]);
});
