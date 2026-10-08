import { writeFile } from "node:fs/promises";
import { products, categories } from "../src/data/products.ts";
import { approvedBrands } from "../src/data/brands.ts";

const sql = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cents = (value) => Math.round(value * 100);
const lines = [
  "-- Draft seed from the old mock catalog. All products/variants remain unpublished with zero stock.",
  "-- Replace descriptions, product-to-brand links, age groups, variant stock, sizes and photos with verified data before publishing.",
];

for (const brand of approvedBrands) {
  lines.push(`insert into public.brands (name, slug, published) values (${sql(brand)}, ${sql(slug(brand))}, true) on conflict (slug) do nothing;`);
}
for (const category of [...categories, "Sale"]) {
  lines.push(`insert into public.categories (name, slug, published) values (${sql(category)}, ${sql(slug(category))}, true) on conflict (slug) do nothing;`);
}
for (const product of products) {
  const condition = product.condition;
  const gender = product.gender?.toLowerCase() || null;
  const productType = product.productType;
  const ageGroup = product.category === "Maternity" ? "adult" : null;
  lines.push(
    `insert into public.products (slug, name, description, gender, age_group, product_type, condition, condition_grade, base_price_cents, compare_at_cents, published) values (${sql(product.id)}, ${sql(product.name)}, '', ${sql(gender)}, ${sql(ageGroup)}, ${sql(productType)}, ${sql(condition)}, ${sql(condition === "like-new" ? "excellent" : null)}, ${cents(product.price)}, ${product.originalPrice ? cents(product.originalPrice) : "null"}, false) on conflict (slug) do nothing;`,
  );
  lines.push(
    `insert into public.product_categories (product_id, category_id) select p.id, c.id from public.products p, public.categories c where p.slug = ${sql(product.id)} and c.slug = ${sql(slug(product.category))} on conflict do nothing;`,
  );
  const sizes = product.category === "Toys" || product.model === "boots" ? [null] : product.sizes;
  let index = 0;
  for (const size of sizes) {
    for (const color of product.colors) {
      index += 1;
      const sku = `BG-${product.id.toUpperCase()}-${index.toString().padStart(3, "0")}`;
      lines.push(
        `insert into public.product_variants (product_id, sku, size, color, stock, published) select id, ${sql(sku)}, ${sql(size)}, ${sql(color)}, 0, false from public.products where slug = ${sql(product.id)} on conflict (sku) do nothing;`,
      );
    }
  }
}

await writeFile(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n") + "\n");
console.log(`Wrote ${products.length} unpublished products and ${approvedBrands.length} approved brand names to supabase/seed.sql`);
