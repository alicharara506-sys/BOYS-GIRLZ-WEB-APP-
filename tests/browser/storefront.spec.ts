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
  await page.locator(".product-card").first().getByRole("button", { name: "Quick add" }).click();
  await page.locator(".product-card").first().getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
});

test("reduced motion keeps shopping available without a blocking loader", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".loading-screen")).toHaveCount(0);
  await page.getByRole("link", { name: /Shop Boys/i }).first().click();
  await expect(page).toHaveURL(/\/category\/boys$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("checkout offers Cash on Delivery and never confirms an unconfigured order", async ({ page }) => {
  await page.goto("/");
  await page.locator(".product-card").first().getByRole("button", { name: "Quick add" }).click();
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

test("the home journey uses the original logo artwork without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return original.call(this, kind, ...options);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Little clothes, for big smiles." })).toBeVisible();
  await expect(page.locator(".bh-stage")).toBeVisible();
  await expect(page.locator(".bh-stage .home-mascot")).toHaveCount(2);
  await expect(page.locator(".bh canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Shop Boys" }).first().click();
  await expect(page).toHaveURL(/\/category\/boys$/);
  await expect(page.getByRole("img", { name: "Original Boys & Girlz blue B character" })).toBeVisible();
  await expect(page.locator(".category-scene .home-mascot-boy")).toHaveCount(1);
  await expect(page.locator(".category-scene .home-mascot-girl")).toHaveCount(0);
});

test("the desktop hero shows the exact B and G logo characters", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Little clothes, for big smiles." })).toBeVisible();
  await expect(page.locator(".bh-stage .home-mascot-boy")).toBeVisible();
  await expect(page.locator(".bh-stage .home-mascot-girl")).toBeVisible();
  await expect(page.locator(".bh canvas")).toHaveCount(0);
  const artwork = await page.locator(".bh-stage .home-mascot-boy").evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(artwork).toContain("brand-characters.png");
  await expect(page.locator(".bh-line-accent .bh-letter").first()).toHaveCSS("color", "rgb(252, 83, 142)");
  await page.screenshot({ path: "test-results/logo-hero-desktop.png", fullPage: false });
  expect(errors).toEqual([]);
});

test("Girls category displays only the original pink G character", async ({ page }) => {
  await page.goto("/category/girls");
  await expect(page.getByRole("img", { name: "Original Boys & Girlz pink G character" })).toBeVisible();
  await expect(page.locator(".category-scene .home-mascot-girl")).toHaveCount(1);
  await expect(page.locator(".category-scene .home-mascot-boy")).toHaveCount(0);
});

test("product detail keeps the flat preview with reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/product/fleece-bear-overall");
  await expect(page.locator(".photo-viewer .product-photo")).toBeVisible();
  await expect(page.locator(".product-stage canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".product-stage canvas")).toHaveCount(0);
  await expect(page.locator(".photo-viewer .product-photo")).toBeVisible();
});
