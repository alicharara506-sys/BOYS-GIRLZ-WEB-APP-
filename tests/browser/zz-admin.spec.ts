import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// The admin test workspace is separate from the owner's real local data. Do not
// record login traces: credentials belong only in the ignored test workspace.
test.use({ trace: "off", screenshot: "off", actionTimeout: 10000 });
test.setTimeout(120000);

async function credentials() {
  const directory = process.env.BNG_ADMIN_TEST_DIR;
  if (!directory) throw new Error("BNG_ADMIN_TEST_DIR must point to an isolated admin test workspace.");
  const text = await readFile(join(directory, "admin-login.txt"), "utf8");
  const email = text.match(/^Email:\s*(.+)$/im)?.[1].trim();
  const password = text.match(/^Password:\s*(.+)$/im)?.[1].trim();
  if (!email || !password) throw new Error("The isolated test workspace has no usable admin login details.");
  return { email, password };
}

async function login(page: Page) {
  const account = await credentials();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/);
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await submit(page, page.getByRole("button", { name: "Sign in", exact: true }));
  await expect(page.getByRole("heading", { name: "A little overview.", exact: true })).toBeVisible();
}

async function submit(page: Page, button: Locator) {
  await Promise.all([
    page.waitForResponse(response => response.request().method() === "POST" && response.url().includes("/admin")),
    button.click(),
  ]);
}

test("admin is private, persists draft product and stock changes, manages discounts, and signs out", async ({ page, request }) => {
  const unauthenticated = await request.post("/admin/products/new", { form: { intent: "save-product", csrfToken: "invalid" }, maxRedirects: 0 });
  expect([302, 303, 401, 403]).toContain(unauthenticated.status());
  await login(page);
  await page.screenshot({ path: "test-results/admin-overview.png", fullPage: false });
  await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();

  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No orders yet.", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A community waiting to grow.", exact: true })).toBeVisible();

  const suffix = Date.now().toString(36);
  const slug = `admin-review-${suffix}`;
  const name = `Admin review ${suffix} <img src=x onerror=alert('admin-xss')>`;
  const dialogs: string[] = [];
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const discount = `REVIEW_${suffix.toUpperCase()}`;
  await page.goto("/admin/products/new");
  await page.getByLabel("Product name", { exact: true }).fill(name);
  await page.getByLabel("Product URL slug", { exact: false }).fill(slug);
  await page.getByLabel("Description", { exact: true }).fill("A draft product used to verify local administration. It is not published.");
  await page.getByLabel("Price (USD)", { exact: true }).fill("24.50");
  await page.locator('select[name="category"]').selectOption("Boys");
  await page.locator('select[name="gender"]').selectOption("Boys");
  await page.getByLabel("Sizes", { exact: false }).fill("New Born");
  await page.getByLabel("Colors", { exact: false }).fill("Blue");
  await page.getByLabel("Upload an image", { exact: true }).setInputFiles(resolve("public/assets/corners/boys-doodle.webp"));
  await expect(page.getByRole("checkbox", { name: /Publish product/ })).not.toBeChecked();
  await submit(page, page.getByRole("button", { name: "Save product", exact: true }));
  await expect(page).toHaveURL(new RegExp(`/admin/products/${slug}(?:\\?|$)`));
  await page.reload();
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(name);
  await expect(page.getByLabel("Price (USD)", { exact: true })).toHaveValue("24.50");
  await expect(page.getByLabel("Or use an image URL", { exact: false })).toHaveValue(/\/media\//);
  await page.goto(`/admin/products?q=${encodeURIComponent(name)}`);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(dialogs).toEqual([]);

  const csrfFailure = await page.request.post(`/admin/products/${slug}`, {
    form: { intent: "archive-product", productId: slug, csrfToken: "invalid" }, maxRedirects: 0,
  });
  expect(csrfFailure.status()).toBe(403);

  await page.goto(`/admin/inventory?q=${encodeURIComponent(name)}`);
  const stock = page.getByRole("spinbutton", { name: /^Stock for / }).first();
  await stock.fill("12");
  await submit(page, page.getByRole("button", { name: /^Save stock for / }).first());
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /^Stock for / }).first()).toHaveValue("12");

  await page.goto("/admin/discounts");
  await page.getByLabel("Discount code", { exact: true }).fill(discount);
  await page.getByLabel("Percentage (%)", { exact: true }).fill("10");
  await submit(page, page.getByRole("button", { name: "Create discount", exact: true }));
  const promo = page.locator(".bg-admin-discount-list article").filter({ hasText: discount });
  await expect(promo).toContainText("10% off");
  await submit(page, promo.getByRole("button", { name: "Deactivate", exact: true }));
  await expect(promo).toContainText("Inactive");

  await page.goto(`/admin/products/${slug}`);
  await page.getByRole("checkbox", { name: /Publish product/ }).check();
  await submit(page, page.getByRole("button", { name: "Save product", exact: true }));
  const liveProduct = await page.request.get(`/product/${slug}`);
  expect(liveProduct.status()).toBe(200);
  expect(await liveProduct.text()).toContain("Admin review");
  const orderResponse = await page.request.post("/checkout", {
    headers: { Origin: new URL(page.url()).origin },
    data: { fullName: "Local Review Customer", mobile: "+96171234567", email: "", governorate: "Beirut", cityArea: "Beirut", streetBuilding: "Review Building", landmark: "", deliveryNotes: "", promoCode: "", items: [{ productSlug: slug, size: "New Born", color: "Blue", quantity: 2 }] },
  });
  expect(orderResponse.status()).toBe(201);
  const placed = { orderNumber: (await orderResponse.text()).match(/BG-LOCAL-\d+/)?.[0] || "" };
  expect(placed.orderNumber).toMatch(/^BG-LOCAL-/);
  await page.goto("/admin/orders");
  await expect(page.getByText(placed.orderNumber, { exact: true })).toBeVisible();
  await expect(page.locator("tr").filter({ hasText: placed.orderNumber })).toContainText("$54.95");
  await page.goto("/admin/customers");
  await expect(page.getByText("Local Review Customer", { exact: true })).toBeVisible();
  await page.goto(`/admin/products/${slug}`);
  await submit(page, page.getByRole("button", { name: "Archive product", exact: true }));
  await page.goto(`/admin/products/${slug}`);
  await expect(page.getByRole("button", { name: "Restore product", exact: true })).toBeVisible();
  await submit(page, page.getByRole("button", { name: "Restore product", exact: true }));
  await page.goto(`/admin/products/${slug}`);
  await expect(page.getByRole("checkbox", { name: /Publish product/ })).not.toBeChecked();
  await submit(page, page.getByRole("button", { name: "Archive product", exact: true }));

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/);
});
