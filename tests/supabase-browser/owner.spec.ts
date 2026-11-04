import { test, expect } from "@playwright/test";
test.skip(
  process.env.BNG_TEST_SUPABASE !== "1" ||
    !process.env.BNG_TEST_ADMIN_EMAIL ||
    !process.env.BNG_TEST_ADMIN_PASSWORD,
  "Needs an explicitly selected Supabase test project and owner login.",
);
test("inline shop/category creation preserves product fields, zero-stock and unlisted sales complete", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill(process.env.BNG_TEST_ADMIN_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.BNG_TEST_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/products/new");
  const suffix = Date.now().toString(36);
  await page
    .getByLabel("Product name", { exact: true })
    .fill(`Verification ${suffix}`);
  await page
    .getByLabel("Product URL slug", { exact: false })
    .fill(`verify-${suffix}`);
  await page
    .getByRole("combobox", { name: "Shop", exact: true })
    .selectOption("__new");
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill(`Verification shop ${suffix}`);
  await page.getByRole("button", { name: "Save shop", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    `Verification ${suffix}`,
  );
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("__new");
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill("Verification category");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    `Verification ${suffix}`,
  );
  await expect(
    page.getByRole("combobox", { name: "Category", exact: true }),
  ).toHaveValue(/.+/);
  await page.getByLabel("In-store price $", { exact: true }).fill("10");
  await page.getByLabel("Online price $", { exact: true }).fill("10");
  await page.getByLabel("Default purchase cost $", { exact: true }).fill("3");
  await page
    .getByRole("combobox", { name: "Product discount", exact: true })
    .selectOption("amount");
  await page.getByLabel("Discount value (% or $)", { exact: true }).fill("2");
  await page
    .getByRole("combobox", { name: "Sell on", exact: true })
    .selectOption("pos_only");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  const editUrl = await page
    .getByRole("link", { name: "Open saved product" })
    .getAttribute("href");
  const publicPage = await page.context().newPage();
  const hidden = await publicPage.goto(`/product/verify-${suffix}`);
  expect(hidden?.status()).toBe(404);
  await page.goto("/admin/pos");
  await page
    .getByLabel("Search products or scan barcode")
    .fill(`Verification ${suffix}`);
  await page.locator(".co-pos-product").click();
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Out of stock — selling allowed" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "＋ Quick Sale / Unlisted Item", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Item name")
    .fill("Verification unlisted");
  await page
    .getByRole("dialog")
    .getByLabel("Sale price $", { exact: true })
    .fill("2");
  await page.getByRole("button", { name: "Add unlisted item to sale" }).click();
  await expect(page.locator(".co-cart-line")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Charge $10.00", exact: false })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Method", exact: true })
    .selectOption("whish");
  await page
    .getByRole("button", { name: "Complete sale", exact: true })
    .click();
  await expect(page.getByRole("link", { name: "Open receipt" })).toBeVisible();
  await page.goto(editUrl!);
  await page
    .getByRole("combobox", { name: "Sell on", exact: true })
    .selectOption("website_and_pos");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await publicPage.goto(`/product/verify-${suffix}`);
  await expect(publicPage.locator(".detail-price")).toContainText("$8.00");
  await page.getByLabel("Online price $", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(publicPage.locator(".detail-price")).toContainText("$10.00");
  await publicPage.close();
});
