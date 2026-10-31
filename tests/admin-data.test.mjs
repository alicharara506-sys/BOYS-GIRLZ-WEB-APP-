import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createAdminRepository } from "../src/server/admin-data.server.ts";

function cleanupTemporaryDirectory(directory) {
  const target = resolve(directory);
  if (dirname(target) !== resolve(tmpdir()) || !/^bg-admin-(?:data|order)-test-/.test(basename(target))) throw new Error("Refusing to remove a directory outside this test's temporary location");
  rmSync(target, { recursive: true, force: true });
}

const product = (overrides = {}) => ({
  name: "Test Cotton Shirt", slug: "test-cotton-shirt", description: "Test product description", price: 24.99,
  category: "Boys", gender: "Boys", condition: "new", productType: "shirt", image: 8,
  sizes: ["2–3 Years", "3–4 Years"], colors: ["Blue", "Cream"], model: "set", isNew: false,
  published: false, imageUrl: null, ...overrides,
});
const customer = { fullName: "Local Review Customer", mobile: "+961 71 234 567", email: "review@example.test", governorate: "Beirut", cityArea: "Test Area", streetBuilding: "Test Building", landmark: "Test landmark", deliveryNotes: "Test note", promoCode: "" };
const selection = (quantity = 1) => ({ productSlug: "test-cotton-shirt", size: "2–3 Years", color: "Blue", quantity });

test("admin seed contains draft inputs only and does not enable a public catalog", () => {
  const repository = createAdminRepository(":memory:");
  try {
    assert.equal(repository.listProducts().length, 35);
    assert.ok(repository.listProducts().every(item => !item.published && item.stock === 0));
    assert.equal(repository.getAdminOverview().orderCount, 0);
    assert.equal(repository.getAdminOverview().customerCount, 0);
    assert.equal(repository.getAdminOverview().revenueCents, 0);
    assert.deepEqual(repository.getStorefrontCatalog(), { enabled: false, products: [] });
  } finally { repository.close(); }
});

test("product edits preserve variant identity and stock and reject destructive combination changes", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const initial = repository.saveProduct(product());
    assert.equal(initial.variants.length, 4);
    repository.updateInventory([{ variantId: initial.variants[0].id, stock: 7 }]);
    const updated = repository.saveProduct(product({ name: "Updated Cotton Shirt", price: 29.5 }), initial.id);
    assert.equal(updated.id, initial.id);
    assert.equal(updated.stock, 7);
    assert.equal(updated.variants[0].id, initial.variants[0].id);
    assert.throws(() => repository.saveProduct(product({ sizes: ["3–4 Years"] }), initial.id), /stock to zero/);
    assert.throws(() => repository.saveProduct(product({ slug: "changed-url" }), initial.id), /URL cannot/);
    assert.equal(repository.getProduct(initial.id).stock, 7);
  } finally { repository.close(); }
});

test("inventory updates are all-or-nothing and invalid products cannot be saved", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const saved = repository.saveProduct(product());
    const variantId = saved.variants[0].id;
    assert.throws(() => repository.updateInventory([{ variantId, stock: 8 }, { variantId: "00000000-0000-4000-8000-000000000000", stock: 1 }]), /not found/);
    assert.equal(repository.getProduct(saved.id).stock, 0);
    assert.throws(() => repository.updateInventory([{ variantId, stock: -1 }]));
    assert.throws(() => repository.updateInventory([{ variantId, stock: 1 }, { variantId, stock: 2 }]), /only appear once/);
    assert.throws(() => repository.saveProduct(product({ slug: "bad-price", price: 1.234 })));
    assert.throws(() => repository.saveProduct(product({ slug: "bad-image", imageUrl: "javascript:alert(1)" })));
    assert.throws(() => repository.saveProduct(product({ slug: "bad-sale", originalPrice: 20 })));
    assert.equal(repository.listProducts().length, 1);
  } finally { repository.close(); }
});

test("explicit publication replaces the preview durably and unpublishing never re-exposes demo products", () => {
  const directory = mkdtempSync(join(tmpdir(), "bg-admin-data-test-"));
  const filename = join(directory, "store.sqlite");
  let repository = createAdminRepository(filename, { seed: false });
  try {
    const saved = repository.saveProduct(product());
    assert.equal(repository.getStorefrontCatalog().enabled, false);
    repository.setProductPublished(saved.id, true);
    assert.equal(repository.getStorefrontCatalog().enabled, true);
    assert.equal(repository.getStorefrontProducts()[0].available, false);
    repository.updateInventory([{ variantId: saved.variants[0].id, stock: 2 }]);
    assert.equal(repository.getStorefrontProducts()[0].available, true);
    repository.close();
    repository = createAdminRepository(filename, { seed: false });
    assert.equal(repository.getProduct(saved.id).stock, 2);
    repository.archiveProduct(saved.id);
    assert.deepEqual(repository.getStorefrontCatalog(), { enabled: true, products: [] });
    repository.archiveProduct(saved.id, false);
    assert.equal(repository.getProduct(saved.id).published, false);
  } finally { repository.close(); cleanupTemporaryDirectory(directory); }
});

test("discount codes validate percentages, preserve uses and can be deactivated", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const promo = repository.savePromo({ code: "welcome10", discountType: "percent", amount: 10, active: true });
    assert.equal(promo.code, "WELCOME10");
    assert.equal(promo.uses, 0);
    assert.equal(repository.setPromoActive("welcome10", false).active, false);
    assert.throws(() => repository.savePromo({ code: "INVALID", discountType: "percent", amount: 101 }));
    assert.throws(() => repository.savePromo({ code: "INVALID", discountType: "fixed", amount: -2 }));
    assert.equal(repository.listPromos().length, 1);
  } finally { repository.close(); }
});

test("order status transitions are enforced and cancellation restocks exactly once", () => {
  const directory = mkdtempSync(join(tmpdir(), "bg-admin-order-test-"));
  const filename = join(directory, "store.sqlite");
  const repository = createAdminRepository(filename, { seed: false });
  const raw = new DatabaseSync(filename);
  try {
    const saved = repository.saveProduct(product({ published: true }));
    const variant = saved.variants[0];
    repository.updateInventory([{ variantId: variant.id, stock: 3 }]);
    const stamp = new Date().toISOString();
    // Synthetic fixtures belong only to this isolated test database.
    raw.prepare("INSERT INTO admin_customers(id,identity_key,data,created_at) VALUES(?,?,?,?)").run("test-customer", "fixture", JSON.stringify({ fullName: "Fixture Customer", mobile: "test", email: "", governorate: "Test", cityArea: "Test", streetBuilding: "Test" }), stamp);
    raw.prepare("INSERT INTO admin_orders(id,order_number,customer_id,status,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").run("test-order", "BG-TEST-1", "test-customer", "pending", JSON.stringify({ items: [{ variantId: variant.id, productId: saved.id, productName: saved.name, sku: variant.sku, size: variant.size, color: variant.color, unitPriceCents: 2499, quantity: 2 }], subtotalCents: 4998, discountCents: 0, shippingCents: 0, totalCents: 4998, paymentMethod: "cash_on_delivery", promoCode: null }), stamp, stamp);
    assert.equal(repository.getAdminOverview().pendingOrderCount, 1);
    assert.throws(() => repository.updateOrderStatus("test-order", "delivered"), /cannot move/);
    repository.updateOrderStatus("test-order", "confirmed");
    repository.updateOrderStatus("test-order", "cancelled");
    assert.equal(repository.getProduct(saved.id).stock, 5);
    repository.updateOrderStatus("test-order", "cancelled");
    assert.equal(repository.getProduct(saved.id).stock, 5);
    assert.throws(() => repository.updateOrderStatus("test-order", "confirmed"), /cannot move/);
    assert.equal(repository.getAdminOverview().revenueCents, 0);
    assert.equal(repository.listCustomers()[0].orderCount, 1);
  } finally { raw.close(); repository.close(); cleanupTemporaryDirectory(directory); }
});

test("local checkout validates exact variants and atomically records server totals, stock and discount use", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const saved = repository.saveProduct(product());
    assert.throws(() => repository.placeLocalOrder({ ...customer, items: [selection()] }), /catalog/);
    repository.setProductPublished(saved.id, true);
    repository.updateInventory([{ variantId: saved.variants[0].id, stock: 6 }]);
    repository.savePromo({ code: "TEST10", discountType: "percent", amount: 10, usageLimit: 1, active: true });
    const result = repository.placeLocalOrder({ ...customer, promoCode: "test10", items: [{ ...selection(2), unitPriceCents: 1 }] });
    assert.match(result.orderNumber, /^BG-LOCAL-/);
    assert.deepEqual(result.totals, { subtotalCents: 4998, discountCents: 499, shippingCents: 595, totalCents: 5094 });
    assert.equal(repository.getProduct(saved.id).stock, 4);
    assert.equal(repository.listPromos()[0].uses, 1);
    assert.equal(repository.getAdminOverview().pendingOrderCount, 1);
    const order = repository.getOrder(result.orderNumber);
    assert.equal(order.customer.fullName, customer.fullName);
    assert.equal(order.customer.mobile, "+96171234567");
    assert.equal(order.landmark, customer.landmark);
    assert.equal(order.items[0].unitPriceCents, 2499);
    assert.throws(() => repository.placeLocalOrder({ ...customer, promoCode: "TEST10", items: [selection()] }), /Promo/);
    assert.equal(repository.listOrders().length, 1);
    assert.equal(repository.getProduct(saved.id).stock, 4);
    repository.updateOrderStatus(order.id, "cancelled");
    assert.equal(repository.getProduct(saved.id).stock, 6);
    repository.updateOrderStatus(order.id, "cancelled");
    assert.equal(repository.getProduct(saved.id).stock, 6);
  } finally { repository.close(); }
});

test("invalid local checkout never changes stock and completed orders keep customer address snapshots", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const saved = repository.saveProduct(product({ published: true }));
    repository.updateInventory([{ variantId: saved.variants[0].id, stock: 8 }]);
    for (const items of [[selection(9)], [selection(), selection()], [{ ...selection(), color: "Pink" }]]) assert.throws(() => repository.placeLocalOrder({ ...customer, items }));
    assert.throws(() => repository.placeLocalOrder({ ...customer, mobile: "123", items: [selection()] }));
    assert.equal(repository.getProduct(saved.id).stock, 8);
    assert.equal(repository.listOrders().length, 0);
    const first = repository.placeLocalOrder({ ...customer, items: [selection(4)] });
    assert.equal(first.totals.shippingCents, 0);
    repository.updateOrderStatus(first.orderNumber, "confirmed");
    repository.updateOrderStatus(first.orderNumber, "packed");
    repository.updateOrderStatus(first.orderNumber, "delivered");
    assert.equal(repository.getAdminOverview().revenueCents, 9996);
    repository.placeLocalOrder({ ...customer, mobile: "071234567", streetBuilding: "A new address", items: [selection()] });
    assert.equal(repository.listCustomers().length, 1);
    assert.equal(repository.listCustomers()[0].orderCount, 2);
    assert.equal(repository.getOrder(first.orderNumber).customer.streetBuilding, customer.streetBuilding);
    assert.throws(() => repository.updateOrderStatus(first.orderNumber, "cancelled"), /cannot move/);
  } finally { repository.close(); }
});

test("approved upload image paths are accepted without allowing arbitrary local files", () => {
  const repository = createAdminRepository(":memory:", { seed: false });
  try {
    const saved = repository.saveProduct(product({ imageUrl: "/media/01234567-89ab-4cde-8fab-0123456789ab.webp" }));
    assert.match(saved.imageUrl, /^\/media\//);
    assert.throws(() => repository.saveProduct(product({ slug: "invalid-file", imageUrl: "/media/private.sqlite" })));
    assert.throws(() => repository.saveProduct(product({ slug: "invalid-file", imageUrl: "file:///private.png" })));
  } finally { repository.close(); }
});
