import { test, expect } from "@playwright/test";
import { products } from "../../src/data/products";

test("size filtering survives refresh and carries through quick add and product details", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("combobox", { name: "Shop by size", exact: true }).selectOption("3–6 Months");
  await expect(page).toHaveURL(/size=3/);
  const matching = products.filter((product) => product.sizes.includes("3–6 Months"));
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(matching.length);
  for (const product of matching) {
    await expect(page.locator(`.shop-grid a.product-image-link[href^="/product/${product.id}?"]`)).toHaveCount(1);
  }
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Shop by size", exact: true })).toHaveValue("3–6 Months");
  const card = page.locator(".shop-grid .product-card").first();
  await card.getByRole("button", { name: "Quick add" }).click();
  await expect(card.locator(".card-quick-options select").first()).toHaveValue("3–6 Months");
  await card.getByRole("button", { name: "Add to bag", exact: true }).click();
  await card.locator(".product-image-link").click();
  await expect(page.locator(".size-options button[aria-pressed=true]")).toHaveText("3–6 Months");
  await page.goto("/cart");
  await expect(page.locator(".cart-line").first()).toContainText("3–6 Months");
  await page.goto("/shop?size=3%E2%80%936%20Months&sort=newest");
  await page.getByRole("button", { name: "Clear size", exact: true }).click();
  await expect(page).toHaveURL(/sort=newest/);
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(products.length);
});

test("mobile Arabic size selector stays visible and syncs with the filters drawer", async ({ page, context }) => {
  await context.addCookies([{ name: "bg-language", value: "ar", url: "http://127.0.0.1:5173" }]);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/category/boys");
  const selector = page.locator("#shopping-size");
  await selector.selectOption("0–3 Months");
  await expect(selector).toHaveValue("0–3 Months");
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(products.filter((product) => product.gender === "Boys" && product.sizes.includes("0–3 Months")).length);
  await page.locator(".mobile-filter").click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.locator("select")).toHaveValue("0–3 Months");
  await drawer.locator("select").selectOption("3–6 Months");
  await drawer.locator(".filter-apply").click();
  await expect(selector).toHaveValue("3–6 Months");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
