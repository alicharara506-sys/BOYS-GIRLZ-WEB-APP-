import { expect, test } from "@playwright/test";

test("Arabic switch persists, server renders RTL, and core shopping remains usable", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "أناقة لصغاركم، وفرح يكبر معهم." })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("link", { name: "الأولاد", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "إطلالات للصغار. ومغامرات بلا حدود." })).toBeVisible();
  await page.goto("/product/fleece-bear-overall");
  await page.getByRole("button", { name: /أضف إلى السلة/ }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "إتمام الطلب" })).toBeVisible();
  await expect(page.getByLabel("المحافظة")).toBeVisible();
  await page.getByRole("button", { name: "التبديل إلى الإنجليزية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  const response = await request.get("/category/boys", { headers: { Cookie: "bg-language=ar" } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<html lang="ar" dir="rtl"');
  expect(html).toContain("ومغامرات بلا حدود.");
});

test("Arabic mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await page.getByRole("button", { name: "فتح قائمة التصفّح" }).click();
  await expect(page.getByRole("navigation", { name: "قائمة التصفّح على الهاتف" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ملابس الأمومة" })).toBeVisible();
  await page.keyboard.press("Escape");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
