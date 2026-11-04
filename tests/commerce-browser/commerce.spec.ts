import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function login(page: Page) {
  const directory = process.env.BNG_ADMIN_DATA_DIR;
  if (!directory?.includes("commerce-test-"))
    throw new Error("Browser tests require the isolated commerce workspace.");
  const text = await readFile(resolve(directory, "admin-login.txt"), "utf8");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill(text.match(/^Email:\s*(.+)$/m)![1].trim());
  await page
    .getByLabel("Password", { exact: true })
    .fill(text.match(/^Password:\s*(.+)$/m)![1].trim());
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A little overview." }),
  ).toBeVisible();
}
test("private login, dashboard, every module and exports work", async ({
  page,
  request,
}) => {
  const unauthorized = await request.get("/admin/export?kind=customers", {
    maxRedirects: 0,
  });
  expect(unauthorized.status()).toBe(302);
  await login(page);
  await page.screenshot({
    path: ".data/commerce-dashboard.png",
    fullPage: false,
  });
  for (const [path, heading] of [
    ["products", "Products, with personality."],
    ["inventory", "Stock, sorted."],
    ["orders", "Every little order."],
    ["customers", "Your growing community."],
    ["marketing", "Keep in touch."],
    ["suppliers", "Suppliers."],
    ["purchases", "Purchases & invoices."],
    ["accounting", "Accounting."],
    ["reports", "Reports & insights."],
    ["cash", "The cash drawer."],
    ["rewards", "Loyalty & gift cards."],
    ["settings", "The little details."],
  ]) {
    await page.goto(`/admin/${path}`);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  const csv = await page.request.get("/admin/export?kind=journal");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const forbidden = await page.request.post("/admin", {
    form: {
      intent: "open-drawer",
      payload: '{"opening":0}',
      csrfToken: "wrong",
    },
    headers: { Origin: "http://127.0.0.1:5482" },
  });
  expect(forbidden.status()).toBe(403);
});
test("tablet POS saves a sale and receipt, and parked sales can resume", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/cash");
  await page.getByLabel("Opening float $", { exact: true }).fill("100");
  await page
    .getByRole("button", { name: "Open cash drawer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Current cash session" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("/admin/pos");
  await page
    .locator(".co-pos-product")
    .filter({ hasText: "Everyday Overshirt" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Months" })
    .first()
    .click();
  await expect(page.locator(".co-cart-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Hold sale", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.getByRole("button", { name: "Clear cart", exact: true }).click();
  await expect(page.locator(".co-cart-line")).toHaveCount(0);
  await page.getByRole("button", { name: /Parked \(/ }).click();
  await page
    .getByRole("button", { name: "Resume", exact: true })
    .first()
    .click();
  await expect(page.locator(".co-cart-line")).toHaveCount(1);
  await page.screenshot({
    path: ".data/commerce-pos-tablet.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: /Charge \$/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Method", exact: true })
    .selectOption("card");
  await page
    .getByRole("button", { name: "Complete demo sale", exact: true })
    .click();
  await expect(page.getByRole("link", { name: "Open receipt" })).toBeVisible();
  await page.getByRole("link", { name: "Open receipt" }).click();
  await expect(page.locator(".co-receipt")).toContainText("Everyday Overshirt");
  await expect(page.locator(".co-receipt")).toContainText("card (recorded)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test("product image, age variants, pricing, publication and persistence", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/products/new");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Browser Test Cotton Set");
  await page
    .getByLabel("Product URL slug", { exact: false })
    .fill("browser-test-cotton-set");
  await page.getByLabel("In-store price $", { exact: true }).fill("25");
  await page.getByLabel("Online price $", { exact: true }).fill("27");
  await page.getByLabel("Default purchase cost $", { exact: true }).fill("10");
  await page
    .getByLabel("Age sizes", { exact: false })
    .fill("0–3 Months, 12–14 Years");
  await page.getByLabel("Colors", { exact: false }).fill("Blue, Pink");
  await page
    .locator('input[name="imageFile"]')
    .setInputFiles(resolve("public/assets/corners/boys-doodle.webp"));
  await expect(page.getByLabel("Online price $", { exact: true })).toHaveValue(
    "27",
  );
  await page.getByLabel("Publish on the website", { exact: true }).check();
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved successfully");
  await page.getByRole("link", { name: "Open saved product" }).click();
  await expect(page).not.toHaveURL(/\/products\/new$/);
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    "Browser Test Cotton Set",
  );
  await page.reload();
  await expect(page.getByLabel("Online price $", { exact: true })).toHaveValue(
    "27",
  );
  expect(
    await page.locator(".co-editor-photo img").getAttribute("src"),
  ).toMatch(/^\/media\//);
  await page.goto("/product/browser-test-cotton-set");
  await expect(
    page.getByRole("heading", { name: "Browser Test Cotton Set" }),
  ).toBeVisible();
});
test("family profile, child details, marketing simulation and mobile navigation", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/customers/new");
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Family");
  await page.getByLabel("Phone", { exact: true }).fill("+96170008888");
  await page.getByLabel("Email", { exact: true }).fill("family@example.test");
  await page.getByLabel("Segments", { exact: false }).fill("VIP");
  await page.getByRole("button", { name: "Add child", exact: true }).click();
  await page.getByLabel("Child’s name", { exact: true }).fill("Demo child");
  await page.getByLabel("Birthdate", { exact: true }).fill("2023-11-02");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.goto("/admin/customers");
  await page
    .getByLabel("Search customers", { exact: true })
    .fill("Browser Test Family");
  await expect(
    page.getByRole("link", { name: "Browser Test Family", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/marketing");
  await page
    .getByLabel("Campaign name", { exact: true })
    .fill("Demo birthday hello");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Happy birthday from Boys & Girlz.");
  await page
    .getByRole("button", { name: "Simulate campaign", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await expect(
    page.getByRole("cell", { name: "Demo birthday hello", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Point of sale", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Let’s make a sale." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test("the public storefront sends a Whish order into the shared admin", async ({
  page,
}) => {
  await login(page);
  await page.goto("/product/everyday-overshirt");
  await page.locator("button.add-main").click();
  await page.goto("/checkout");
  await page.locator("#co-fullName").fill("Website Demo Family");
  await page.locator("#co-mobile").fill("+96170007777");
  await page.locator("#co-governorate").selectOption("Beirut");
  await page.locator("#co-cityArea").fill("Demo area");
  await page.locator("#co-streetBuilding").fill("Demo building");
  await page
    .getByRole("combobox", { name: "Payment method", exact: true })
    .selectOption("whish");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await page
    .getByRole("button", { name: "Place demo Whish order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your order has been received." }),
  ).toBeVisible();
  await expect(
    page.getByText("is awaiting Whish payment verification.", { exact: false }),
  ).toBeVisible();
  const admin = await page.context().newPage();
  await admin.goto("/admin/orders");
  await admin
    .getByLabel("Search orders", { exact: true })
    .fill("Website Demo Family");
  await expect(
    admin.getByRole("cell", { name: "Website Demo Family", exact: false }),
  ).toBeVisible();
  await admin.close();
});
