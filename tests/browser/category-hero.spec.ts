import { expect, test } from "@playwright/test";

test("category artwork, collection navigation, and motion controls work together", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/category/boys");
  await expect(page.getByRole("heading", { level: 1, name: "Little outfits. Big adventures." })).toBeVisible();
  await expect(page.locator(".collection-tabs a[aria-current=page]")).toHaveText("Little Boys");
  await page.getByRole("button", { name: "Pause banner animations" }).click();
  await expect(page.locator(".collection-art .home-mascot")).toHaveCSS("animation-play-state", "paused");
  await page.locator(".collection-hero").screenshot({ path: "test-results/category-boys-desktop.png", animations: "disabled" });
  await page.getByRole("button", { name: "Resume banner animations" }).click();
  await expect(page.locator(".collection-art .home-mascot")).toHaveCSS("animation-play-state", "running");
  await page.getByRole("link", { name: "Explore the collection", exact: true }).click();
  await expect(page).toHaveURL(/#category-products$/);
  await expect(page.locator(".shop-toolbar")).toBeInViewport();
  await page.locator(".collection-tabs").getByRole("link", { name: "Little Girls" }).click();
  await expect(page.getByRole("heading", { name: "A little charm. So much possibility." })).toBeVisible();
  await expect(page.locator(".collection-art .home-mascot-girl")).toBeVisible();
  await expect(page.locator(".collection-art .home-mascot-boy")).toHaveCount(0);
  await page.locator(".collection-hero").screenshot({ path: "test-results/category-girls-desktop.png", animations: "disabled" });
  await page.locator(".collection-tabs").getByRole("link", { name: "For everyone" }).click();
  await expect(page.locator(".collection-art .home-mascot")).toHaveCount(2);
  await page.locator(".collection-hero").screenshot({ path: "test-results/category-unisex-desktop.png", animations: "disabled" });
  expect(errors).toEqual([]);
});

test("Arabic category heroes fit narrow screens and respect reduced motion", async ({ page, context }) => {
  await context.addCookies([{ name: "bg-language", value: "ar", url: "http://127.0.0.1:5173" }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 920, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const category of ["boys", "girls", "unisex"]) {
      await page.goto(`/category/${category}`);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator(".collection-copy h1")).toBeVisible();
      await expect(page.locator(".collection-art .home-mascot").first()).toHaveCSS("animation-name", "none");
      await expect(page.locator(".collection-motion-control")).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${category} at ${width}px`).toBeLessThanOrEqual(1);
      const clipping = await page.locator(".collection-copy h1").evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(clipping, `${category} heading at ${width}px`).toBeLessThanOrEqual(1);
      const headerFits = await page.locator(".nav-inner").evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const children = [...element.children].map((child) => child.getBoundingClientRect()).filter((rect) => rect.width > 0).sort((a, b) => a.left - b.left);
        return children.every((rect, index) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && (index === 0 || rect.left >= children[index - 1].right));
      });
      expect(headerFits, `${category} navigation at ${width}px`).toBe(true);
      if (width === 390) await page.locator(".collection-hero").screenshot({ path: `test-results/category-${category}-arabic-mobile.png`, animations: "disabled" });
    }
  }
});
