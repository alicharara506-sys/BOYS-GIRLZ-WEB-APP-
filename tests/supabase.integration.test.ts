import "dotenv/config";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { publicSupabase } from "../src/server/supabase.server";
import { db } from "../src/server/commerce/db.server";
import { saveCommerceProduct } from "../src/server/commerce/operations.server";
import { createSale } from "../src/server/commerce/sales.server";
import { financials } from "../src/domain/financials";
const ready = process.env.BNG_TEST_SUPABASE === "1";
after(async () => {
  if (ready) await db.$disconnect();
});
test(
  "live Supabase: anonymous visibility, private costs, negative stock and quick-sale integrity",
  { skip: !ready },
  async () => {
    const shop = await db.shop.create({
      data: { name: `Verification ${randomUUID()}` },
    });
    const category = await db.category.create({
      data: { name: "Verification", shopId: shop.id },
    });
    const fields = {
      name: "Verification product",
      slug: `verify-${randomUUID()}`,
      shopId: shop.id,
      categoryId: category.id,
      category: category.name,
      gender: "Unisex",
      brand: "Boys & Girlz",
      season: "All season",
      description: "Verification",
      imageUrl: "",
      price: 1000,
      onlinePrice: 1000,
      cost: 300,
      threshold: 2,
      published: true,
      featured: false,
      sizes: ["2y"],
      colors: ["Blue"],
      visibility: "pos_only",
      discountType: "amount",
      discountValue: 200,
    };
    const product = await saveCommerceProduct(fields);
    const variant = await db.variant.findFirstOrThrow({
      where: { productId: product.id },
    });
    const anon = publicSupabase();
    assert.equal(
      (await anon.from("products").select("id").eq("id", product.id)).data
        ?.length,
      0,
    );
    assert.ok((await anon.from("products").select("cost_cents")).error);
    const sale = await createSale({
      requestKey: randomUUID(),
      demo: true,
      note: "Verification test — not a customer sale",
      items: [
        { variantId: variant.id, quantity: 1 },
        { name: "Unlisted item", price: 200, quantity: 1 },
      ],
      payments: [{ method: "whish", amount: 1000 }],
    });
    assert.equal(
      (await db.variant.findUniqueOrThrow({ where: { id: variant.id } })).stock,
      -1,
    );
    assert.equal(sale.items.find((l) => l.isQuickSale)?.productId, null);
    assert.equal(sale.items.find((l) => l.isQuickSale)?.unitCost, null);
    const journal = await db.journal.findUniqueOrThrow({
      where: { reference: `sale:${sale.id}` },
      include: { lines: true },
    });
    assert.equal(
      journal.lines.reduce((s, l) => s + l.debit - l.credit, 0),
      0,
    );
    await saveCommerceProduct({
      ...fields,
      id: product.id,
      visibility: "website_and_pos",
    });
    assert.equal(
      (await anon.from("products").select("id").eq("id", product.id)).data
        ?.length,
      1,
    );
    const value = financials(
      [{ ...sale, createdAt: sale.createdAt.toISOString() }],
      [],
      [],
      "2000-01-01",
      "2099-12-31",
    );
    assert.equal(value.Sales, 1000);
    assert.equal(value.COGS, 300);
    // Keep linked verification transactions for audit; remove the product from public listings.
    await db.product.update({
      where: { id: product.id },
      data: { archived: true },
    });
  },
);

test(
  "live Supabase: owner Auth, image policies, private rows and liability currency mapping",
  {
    skip:
      !ready ||
      !process.env.BNG_TEST_ADMIN_EMAIL ||
      !process.env.BNG_TEST_ADMIN_PASSWORD,
  },
  async () => {
    const owner = publicSupabase();
    const login = await owner.auth.signInWithPassword({
      email: process.env.BNG_TEST_ADMIN_EMAIL!,
      password: process.env.BNG_TEST_ADMIN_PASSWORD!,
    });
    assert.ifError(login.error);
    assert.ok(
      (await owner.from("products").select("cost_cents").limit(1)).data,
    );
    assert.ok((await publicSupabase().from("customers").select("id")).error);
    const filename = `verification/${randomUUID()}.png`;
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/iF0AAAAASUVORK5CYII=",
      "base64",
    );
    assert.ok(
      (
        await publicSupabase()
          .storage.from("product-images")
          .upload(filename, bytes, { contentType: "image/png" })
      ).error,
    );
    const uploaded = await owner.storage
      .from("product-images")
      .upload(filename, bytes, { contentType: "image/png" });
    assert.ifError(uploaded.error);
    const publicImage = await fetch(
      owner.storage.from("product-images").getPublicUrl(filename).data
        .publicUrl,
    );
    assert.equal(publicImage.status, 200);
    assert.ifError(
      (await owner.storage.from("product-images").remove([filename])).error,
    );
    const liability = await db.liability.create({
      data: {
        creditor: "Verification only",
        amount: 100,
        settled: 40,
        note: "Disposable test",
      },
    });
    try {
      const result = await owner
        .from("liabilities")
        .select("amount,settled")
        .eq("id", liability.id)
        .single();
      assert.ifError(result.error);
      assert.equal(Number(result.data.amount), 1);
      assert.equal(Number(result.data.settled), 0.4);
    } finally {
      await db.liability.delete({ where: { id: liability.id } });
      await owner.auth.signOut();
    }
  },
);
