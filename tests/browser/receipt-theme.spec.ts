import { test, expect } from "@playwright/test";

const seed = () => localStorage.setItem("boys-girlz:v1", JSON.stringify({
  cart: [{ productId: "fleece-bear-overall", size: "3–6 Months", color: "Cream", quantity: 1 }], wishlist: [],
}));
const routes = ["/", "/shop", "/category/boys", "/category/girls", "/category/unisex", "/category/accessories", "/category/maternity", "/category/toys", "/category/outlet", "/category/sale", "/product/fleece-bear-overall", "/cart", "/checkout", "/about", "/contact", "/faq", "/help/sizing"];

for (const language of ["en", "ar"]) {
  test(`${language}: receipt theme fits mobile, tablet and desktop`, async ({ page, context }) => {
    test.setTimeout(240000);
    await context.addCookies([{ name: "bg-language", value: language, url: "http://127.0.0.1:5173" }]);
    await page.addInitScript(seed);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [320, 375, 414, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const viewportRoutes = [375, 1440].includes(width) ? routes : routes.filter((route) => ["/", "/shop", "/category/boys", "/category/unisex", "/product/fleece-bear-overall", "/cart", "/checkout", "/contact"].includes(route));
      for (const route of viewportRoutes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("#cart-icon .bag-count")).toHaveText("1");
        await expect(page.locator("main h1").first()).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect(overflow, `${language} ${route} ${width}`).toBeLessThanOrEqual(1);
        if (["/cart", "/checkout"].includes(route)) await expect(page.locator("main .receipt-printer")).toBeVisible();
        if ([375, 1440].includes(width) && ["/", "/cart", "/checkout", "/category/unisex"].includes(route)) {
          await page.screenshot({ path: `reports/receipt-theme/${language}-${route.slice(1).replaceAll("/", "-") || "home"}-${width}.png`, fullPage: route !== "/", animations: "disabled" });
        }
      }
      await page.getByRole("button", { name: language === "en" ? "Shopping bag, 1 items" : /سلّة التسوّق/ }).click();
      const bag = page.getByRole("dialog");
      await expect(bag.locator(".receipt-printer")).toBeVisible();
      await expect(bag.locator(".cart-line")).toContainText(language === "en" ? "3–6 Months" : "3");
      expect(await bag.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await page.keyboard.press("Escape");
    }
  });
}

test("accepted order has a printable receipt with server totals and retained items", async ({ page }) => {
  await page.addInitScript(seed);
  // A simulated server response: no order is sent to the shop in this test.
  await page.route("**/checkout.data*", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status: 201, contentType: "text/x-script", headers: { "X-Remix-Response": "yes" }, body: '[{"_1":2},"data",{"_3":4,"_5":6},"orderNumber","PREVIEW-001","totals",{"_7":8,"_9":10,"_11":12,"_13":14},"subtotalCents",3490,"discountCents",200,"shippingCents",500,"totalCents",3790]\n' });
  });
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Preview Customer");
  await page.getByLabel("Lebanese mobile number").fill("+961 71 234 567");
  await page.getByLabel("Governorate").selectOption("Beirut");
  await page.getByLabel("City or area").fill("Achrafieh");
  await page.getByLabel("Street and building").fill("Preview Street");
  await page.getByRole("button", { name: /Review order/ }).click();
  await page.getByRole("button", { name: /Place Cash on Delivery order/ }).click();
  const receipt = page.getByRole("region", { name: "Order receipt" });
  await expect(receipt).toContainText("PREVIEW-001");
  await expect(receipt).toContainText("Fleece Bear Overall");
  await expect(receipt).toContainText("3–6 Months");
  await expect(receipt.locator(".summary-total")).toContainText("$37.90");
  await expect(receipt).toContainText("Awaiting confirmation");
  await page.screenshot({ path: "reports/receipt-theme/order-receipt-preview.png", fullPage: true, animations: "disabled" });
  await page.evaluate(() => { window.print = () => { document.body.dataset.printRequested = "true"; }; });
  await page.getByRole("button", { name: "Print receipt", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-print-requested", "true");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(receipt.locator(".receipt-printer")).toBeHidden();
  await expect(receipt.locator(".receipt-paper")).toBeVisible();
  await page.pdf({ path: "reports/receipt-theme/order-receipt-preview.pdf", format: "A4" });
});
