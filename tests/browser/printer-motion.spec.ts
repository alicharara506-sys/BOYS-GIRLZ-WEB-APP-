import { test, expect } from "@playwright/test";

const seed = () => localStorage.setItem("boys-girlz:v1", JSON.stringify({
  cart: [{ productId: "gingham-day-dress", size: "New Born", color: "Pink", quantity: 2 }], wishlist: [],
}));

test("bag printer feeds the paper, finishes on interaction and replays on reopening", async ({ page }) => {
  await page.addInitScript(seed);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/product/gingham-day-dress");
  const trigger = page.getByRole("button", { name: "Shopping bag, 2 items" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const receipt = page.getByRole("dialog").locator(".bag-receipt");
  await expect(receipt).toHaveAttribute("data-receipt-state", "printing");
  const sample = await receipt.evaluate((element) => {
    const feed = element.querySelector(".receipt-feed")!;
    const animation = feed.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const start = getComputedStyle(feed).clipPath;
    const height = element.getBoundingClientRect().height;
    animation.currentTime = 1200;
    return { start, halfway: getComputedStyle(feed).clipPath, height, halfwayHeight: element.getBoundingClientRect().height };
  });
  expect(sample.start).toContain("100%");
  expect(sample.halfway).not.toBe(sample.start);
  expect(sample.halfwayHeight).toBe(sample.height);
  await expect(receipt.locator(".receipt-printer-panel > span")).toHaveCSS("animation-name", "printer-status");
  await receipt.dispatchEvent("pointerdown");
  await expect(receipt).toHaveAttribute("data-receipt-state", "ready");
  await expect(receipt.locator(".receipt-feed")).toHaveCSS("clip-path", "inset(0px 0px 0%)");
  await expect(receipt.locator(".summary-total")).toContainText("$64.00");
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(receipt).toHaveAttribute("data-receipt-state", "printing");
  await receipt.getByRole("button", { name: "Increase gingham day dress quantity" }).focus();
  await expect(receipt).toHaveAttribute("data-receipt-state", "ready");
  await expect(receipt.locator(".receipt-feed")).toHaveCSS("clip-path", "inset(0px 0px 0%)");
});

test("reduced motion and printing expose the entire receipt immediately", async ({ page }) => {
  await page.addInitScript(seed);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cart");
  const receipt = page.locator("main .receipt-frame");
  await expect(receipt).toHaveAttribute("data-receipt-state", "ready");
  await expect(receipt.locator(".receipt-feed")).toHaveCSS("clip-path", "none");
  await expect(receipt.locator(".receipt-printer")).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(receipt).toHaveAttribute("data-receipt-state", "printing");
  await page.emulateMedia({ media: "print" });
  await expect(receipt.locator(".receipt-feed")).toHaveCSS("clip-path", "none");
  await expect(receipt.locator(".receipt-paper")).toHaveCSS("transform", "none");
});
