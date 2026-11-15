import { test, expect } from "@playwright/test";

test("SSR metadata, language alternates and utility exclusions are present without JS", async ({ request }) => {
  const actionOnly = await request.get("/newsletter");
  expect(actionOnly.status()).toBe(404);
  expect(actionOnly.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  for (const path of ["/", "/about", "/brands", "/faq", "/help/shipping", "/category/toys", "/cart", "/product/everyday-overshirt"]) {
    for (const language of ["en", "ar"]) {
      const url = `${path}${language === "ar" ? "?lang=ar" : ""}`;
      const response = await request.get(url);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`<html lang="${language}" dir="${language === "ar" ? "rtl" : "ltr"}"`);
      expect(html).toContain(`rel="canonical" href="https://boysandgirlz.com${url}"`);
      expect(html).toContain('hrefLang="x-default"');
      expect(html).toContain('property="og:image"');
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
      if (path !== "/") expect(html).toContain("BreadcrumbList");
      if (path === "/cart" || path.startsWith("/product/")) expect(html).toContain('content="noindex, follow"');
      expect(html).not.toContain('"@type":"ClothingStore"');
    }
  }
});

test("FAQ markup matches the visible questions and answers", async ({ page }) => {
  await page.goto("/faq");
  const schema = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map(node => JSON.parse(node.textContent || "{}"))).then(all => all.find(node => node["@type"] === "FAQPage"));
  expect(schema.mainEntity).toHaveLength(5);
  for (const entry of schema.mainEntity) {
    await expect(page.getByRole("heading", { name: entry.name, exact: true })).toHaveCount(1);
    await expect(page.getByText(entry.acceptedAnswer.text, { exact: true })).toHaveCount(1);
  }
  await page.getByRole("searchbox", { name: "Search the questions" }).fill("pay on delivery");
  const filtered = await page.locator('.faq-page script[type="application/ld+json"]').textContent();
  expect(JSON.parse(filtered || "{}").mainEntity).toHaveLength(1);
});

test("language switch keeps Arabic URLs and metadata aligned through navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page).toHaveURL(/\?lang=ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://boysandgirlz.com/?lang=ar");
  await page.locator('.corner-tile-boys').click();
  await expect(page).toHaveURL(/\/category\/boys\?lang=ar$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://boysandgirlz.com/category/boys?lang=ar");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
