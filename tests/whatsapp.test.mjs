import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/data/products.ts";
import { whatsAppOrderMessage } from "../src/utils/whatsappOrder.ts";

test("WhatsApp request lists variants and an estimated subtotal without claiming an order was placed", () => {
  const first = products[0];
  const second = products[1];
  const message = whatsAppOrderMessage([
    { productId: first.id, size: first.sizes[0], color: first.colors[0], quantity: 2 },
    { productId: second.id, size: second.sizes[1], color: second.colors[0], quantity: 1 },
  ]);
  assert.match(message, /delivery within Lebanon/);
  assert.match(message, /1\. Everyday Overshirt \(New Born, Blue\) × 2 — \$56\.00/);
  assert.match(message, /2\. Gingham Day Dress \(0–3 Months, Pink\) × 1 — \$32\.00/);
  assert.match(message, /Estimated item subtotal: \$88\.00/);
  assert.match(message, /confirm availability, delivery charge, and the final total/);
  assert.doesNotMatch(message, /order has been placed/i);
});

test("WhatsApp request identifies Like New items and ignores stale products", () => {
  const outlet = products.find((product) => product.condition === "like-new");
  assert.ok(outlet);
  const message = whatsAppOrderMessage([
    { productId: "missing", size: "", color: "", quantity: 1 },
    { productId: outlet.id, size: outlet.sizes[0], color: outlet.colors[0], quantity: 1 },
  ]);
  assert.match(message, /Like New/);
  assert.doesNotMatch(message, /missing/);
  assert.equal(whatsAppOrderMessage([]), "");
});

test("Arabic WhatsApp request keeps the same item values and asks for confirmation", () => {
  const first = products[0];
  const translate = (text) => ({ "Everyday Overshirt": "قميص يومي", "New Born": "حديث الولادة", Blue: "أزرق" })[text] || text;
  const message = whatsAppOrderMessage([
    { productId: first.id, size: first.sizes[0], color: first.colors[0], quantity: 1 },
  ], "ar", translate);
  assert.match(message, /قميص يومي \(حديث الولادة، أزرق\)/);
  assert.match(message, /يرجى تأكيد توفّر المنتجات/);
  assert.match(message, /\$28\.00/);
});
