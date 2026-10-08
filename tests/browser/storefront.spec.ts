import { test, expect } from "@playwright/test";

test("home and product pages contain useful HTML before JavaScript runs", async ({ request, browser }) => {
  for (const [path, heading] of [
    ["/", "Little clothes,"],
    ["/category/boys", "Little Boys"],
    ["/product/fleece-bear-overall", "Fleece Bear Overall"],
    ["/faq", "Frequently asked questions"],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toContain("<title>");
    expect(html, path).toContain("<h1");
    expect(html, path).toContain(heading);
  }

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/product/fleece-bear-overall");
  await expect(page.getByRole("heading", { name: "Fleece Bear Overall" })).toBeVisible();
  await context.close();
});

test("invalid URLs return real HTTP 404 responses", async ({ request }) => {
  for (const path of [
    "/not-a-page",
    "/category/not-a-category",
    "/product/not-a-product",
    "/help/not-a-topic",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("quick shop adds an item and keeps the bag after refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Little clothes, for big smiles." })).toBeVisible();
  await page.getByRole("button", { name: "Quick shop Everyday Overshirt" }).click();
  await page.locator(".product-card").first().getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
});

test("reduced motion keeps shopping available without a blocking loader", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".loading-screen")).toHaveCount(0);
  await page.getByRole("link", { name: "Shop boys", exact: true }).first().click();
  await expect(page).toHaveURL(/\/category\/boys$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("checkout offers Cash on Delivery and never confirms an unconfigured order", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Quick shop Everyday Overshirt" }).click();
  await page.locator(".product-card").first().getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText(/Cash on Delivery/).first()).toBeVisible();
  await expect(page.getByText("Demo card")).toHaveCount(0);
  await page.getByLabel("Full name").fill("Sam Customer");
  await page.getByLabel("Lebanese mobile number").fill("+961 71 234 567");
  await page.getByLabel("Governorate").selectOption("Beirut");
  await page.getByLabel("City or area").fill("Achrafieh");
  await page.getByLabel("Street and building").fill("Main Street, Building 4");
  await page.getByRole("button", { name: /Review order/ }).click();
  await page.getByRole("button", { name: /Place Cash on Delivery order/ }).click();
  await expect(page.getByRole("alert")).toContainText("Ordering is not configured yet");
  await expect(page.getByRole("heading", { name: "Your order has been received." })).toHaveCount(0);
});
