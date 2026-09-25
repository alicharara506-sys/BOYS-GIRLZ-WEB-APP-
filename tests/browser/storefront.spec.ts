import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test("desktop home matches structure, images load, quick flip adds to persistent bag", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" || m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Cute outfits, happy moments." }),
  ).toBeVisible();
  await expect(page.locator(".category-card")).toHaveCount(4);
  await page
    .getByRole("button", {
      name: "Quick shop Fleece Bear Overall",
      exact: true,
    })
    .click();
  await expect(page.locator(".product-flipper").first()).toHaveClass(/flipped/);
  await page
    .locator(".card-back")
    .first()
    .getByRole("button", { name: "Add to bag" })
    .click();
  await page
    .getByRole("button", { name: "Shopping bag, 1 items", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Your little bag (1)" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Your little bag (1)" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Shopping bag, 1 items", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
test("search, filters, sort and empty-state reset work together", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(28);
  await page.locator(".desktop-filters input[type=checkbox]").first().check();
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(5);
  await page
    .getByRole("combobox", { name: "Sort products" })
    .selectOption("price-asc");
  await expect(page.locator(".shop-grid .product-info>a").first()).toHaveText(
    "Little Explorer Playsuit",
  );
  await page.locator(".listing-search input").fill("not-in-catalog");
  await expect(
    page.getByRole("heading", { name: "No little matches just yet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(28);
  await page.getByRole("button", { name: "Filter Pink", exact: true }).click();
  expect(await page.locator(".shop-grid .product-card").count()).toBeLessThan(
    28,
  );
});
test("all six category routes filter correctly", async ({ page }) => {
  for (const [category, count] of [
    ["boys", 5],
    ["girls", 5],
    ["unisex", 5],
    ["accessories", 4],
    ["maternity", 4],
    ["toys", 5],
  ] as const) {
    await page.goto(`/category/${category}`);
    await expect(page.locator(".shop-grid .product-card")).toHaveCount(count);
  }
});
test("wishlist persists and can be removed", async ({ page }) => {
  await page.goto("/shop");
  await page
    .getByRole("button", {
      name: "Save Fleece Bear Overall to wishlist",
      exact: true,
    })
    .click();
  await page.goto("/wishlist");
  await expect(page.locator(".wishlist-grid .product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".wishlist-grid .product-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Remove Fleece Bear Overall from wishlist",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little room for love." }),
  ).toBeVisible();
});
test("product variants, promo and shipping-to-success checkout", async ({
  page,
}) => {
  await page.goto("/product/fleece-bear-overall");
  await page.getByRole("button", { name: "3–6M", exact: true }).click();
  await page.getByRole("button", { name: "Select Cream", exact: true }).click();
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.getByRole("button", { name: /Add to bag —/ }).click();
  await page.goto("/cart");
  await expect(page.locator("#main .cart-line-info>p")).toHaveText(
    "3–6M · Cream",
  );
  await expect(page.locator("#main .cart-line output")).toHaveText("2");
  await page.getByRole("textbox", { name: "Promo code" }).fill("LITTLELOVE10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.locator("#main .order-summary .summary-total strong"),
  ).toContainText("$68.77");
  await page.getByRole("link", { name: "A little closer to yours" }).click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.getByRole("heading", { name: "Where shall we send the love?" }),
  ).toBeVisible();
  await page.getByLabel("First name", { exact: true }).fill("Alex");
  await page.getByLabel("Last name", { exact: true }).fill("Demo");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("alex@example.com");
  await page
    .getByLabel("Street address", { exact: true })
    .fill("12 Sample Street");
  await page.getByLabel("City", { exact: true }).fill("Beirut");
  await page.getByLabel("Postal code", { exact: true }).fill("1107");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.getByRole("heading", { name: "A little payment detail." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review your order" }).click();
  await expect(page.getByText("Alex Demo")).toBeVisible();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(
    page.getByRole("heading", { name: "Oh, happy day!" }),
  ).toBeVisible();
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Good things are on their way." }),
  ).toBeVisible();
});
test("mobile layout, navigation, filters, and dialog keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Cute outfits, happy moments." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Shop", exact: true })
    .click();
  await page.getByRole("button", { name: /^Filters/ }).click();
  const dialog = page.getByRole("dialog", { name: "Find your favorites" });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="checkbox"]').nth(1).check();
  await dialog.getByRole("button", { name: "Show 5 favorites" }).click();
  await expect(page.locator(".shop-grid .product-card")).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Find a little favorite" }),
  ).not.toBeVisible();
});
test("photo hero, product close-up and scroll frame timings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" || m.type() === "error") errors.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".hero-photo")).toBeVisible();
  const performance = await page.evaluate(async () => {
    const samples: number[] = [];
    let last = 0;
    return new Promise<{ median: number; p95: number; frames: number }>(
      (resolve) => {
        function frame(t: number) {
          if (last) samples.push(t - last);
          last = t;
          if (samples.length < 90) {
            window.scrollTo(0, samples.length * 8);
            requestAnimationFrame(frame);
          } else {
            samples.sort((a, b) => a - b);
            window.scrollTo(0, 0);
            resolve({
              median: samples[45],
              p95: samples[85],
              frames: samples.length,
            });
          }
        }
        requestAnimationFrame(frame);
      },
    );
  });
  console.log("Scroll frame timing (headless):", JSON.stringify(performance));
  await page.goto("/product/fleece-bear-overall");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Show product close-up" }).click();
  await expect(page.locator(".photo-viewer")).toHaveClass(/detail/);
  await page.screenshot({
    path: "test-results/product-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("damaged storage and unavailable storage do not break shopping", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("boys-girlz:v1", "{invalid"),
  );
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Good things are on their way." }),
  ).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.goto("/shop");
  await page
    .getByRole("button", {
      name: "Quick shop Fleece Bear Overall",
      exact: true,
    })
    .click();
  await page
    .locator(".card-back")
    .first()
    .getByRole("button", { name: "Add to bag" })
    .click();
  await expect(
    page.getByRole("button", { name: "Shopping bag, 1 items", exact: true }),
  ).toBeVisible();
});
test("help, contact confirmation, search suggestions and not found are usable", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Your name", { exact: true }).fill("Demo");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page
    .getByLabel("Your little note", { exact: true })
    .fill("A sample hello");
  await page.getByRole("button", { name: "Submit demo message" }).click();
  await expect(
    page.getByRole("heading", { name: "Your little note is ready." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search product name or category" })
    .fill("Fleece");
  await page
    .getByRole("dialog", { name: "Find a little favorite" })
    .getByRole("link", { name: /Fleece Bear Overall/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fleece Bear Overall", exact: true }),
  ).toBeVisible();
  await page.goto("/not-a-page");
  await expect(
    page.getByRole("heading", { name: "This little page wandered off." }),
  ).toBeVisible();
});
