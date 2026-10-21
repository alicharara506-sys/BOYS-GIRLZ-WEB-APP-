/* global localStorage, document, getComputedStyle, innerWidth, innerHeight */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "@playwright/test";
import { products, categories } from "../src/data/products.ts";

const origin = "http://127.0.0.1:5173";
const directory = "reports/responsive";
const interactionsOnly = process.argv.includes("--interactions-only");
fs.mkdirSync(`${directory}/after`, { recursive: true });
const routes = ["/", "/shop?sort=newest", ...categories.map((category) => `/category/${category.toLowerCase()}`), ...products.map((product) => `/product/${product.id}`), "/cart", "/checkout", "/wishlist", "/about", "/contact", "/faq", "/help/shipping", "/help/returns", "/help/sizing", "/not-a-page"];
const viewports = [320, 375, 414, 768, 1024, 1440].flatMap((width) => [
  { width, height: Math.max(568, Math.ceil(width * 1.4)), orientation: "portrait" },
  { width, height: Math.max(240, Math.min(900, Math.floor(width * .65))), orientation: "landscape" },
]);
const slug = (route) => route.replace(/[^a-z0-9]/gi, "_") || "home";
const failures = [];
const measurements = [];
const interactions = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const seed = () => localStorage.setItem("boys-girlz:v1", JSON.stringify({ cart: [{ productId: "fleece-bear-overall", size: "New Born", color: "Cream", quantity: 1 }], wishlist: ["fleece-bear-overall"] }));

async function inspect(page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const visible = (element) => {
      const style = getComputedStyle(element);
      return element.getClientRects().length && style.visibility !== "hidden" && style.display !== "none" && !element.closest("dialog:not([open]),.sr-only,[aria-hidden='true']");
    };
    const label = (element) => `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 80)}`;
    const controls = [...document.querySelectorAll("a,button,input:not([type='hidden']),select,textarea,summary")].filter(visible).filter((element) => !element.matches(".skip-link"));
    const offscreen = controls.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > viewport + 1;
    }).map(label);
    const smallTargets = controls.filter((element) => {
      let rect = element.getBoundingClientRect();
      if (element.matches("input[type='checkbox'],input[type='radio']") && element.closest("label")) rect = element.closest("label").getBoundingClientRect();
      return rect.width < 43.5 || rect.height < 43.5;
    }).map(label);
    const smallBodyText = [...document.querySelectorAll("main p, main label, main input:not(.sr-only), main select, main textarea")].filter(visible).filter((element) => parseFloat(getComputedStyle(element).fontSize) < 16).map(label);
    const clippedHeadings = [...document.querySelectorAll("main h1,main h2,main h3")].filter(visible).filter((element) => element.scrollWidth > element.clientWidth + 1).map(label);
    const headerControls = [...document.querySelectorAll(".nav-inner a,.nav-inner button")].filter(visible);
    const headerOverlap = headerControls.some((element, index) => headerControls.slice(index + 1).some((other) => {
      const a = element.getBoundingClientRect(), b = other.getBoundingClientRect();
      return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    }));
    return { overflow: document.documentElement.scrollWidth - viewport, offscreen, smallTargets, smallBodyText, clippedHeadings, headerOverlap };
  });
}

try {
  const jobs = interactionsOnly ? [] : ["en", "ar"].flatMap((language) => viewports.flatMap((viewport) => routes.map((route) => ({ language, viewport, route }))));
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.addInitScript(seed);
    const page = await context.newPage();
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      await context.addCookies([{ name: "bg-language", value: job.language, url: origin }]);
      await page.setViewportSize(job.viewport);
      try {
        await page.goto(origin + job.route);
        await page.evaluate(() => document.fonts.ready);
        if (["/cart", "/checkout", "/wishlist"].includes(job.route)) await page.locator("#cart-icon .bag-count").filter({ hasText: "1" }).waitFor();
        const result = await inspect(page);
        measurements.push({ ...job, ...result });
        const issues = [];
        if (result.overflow > 1) issues.push("document overflow");
        if (result.offscreen.length) issues.push("offscreen controls");
        if (result.clippedHeadings.length) issues.push("clipped headings");
        if (result.headerOverlap) issues.push("overlapping header controls");
        if (job.viewport.width < 1024 && result.smallTargets.length) issues.push("small tap targets");
        if (job.viewport.width < 1024 && result.smallBodyText.length) issues.push("small body text");
        if (issues.length) failures.push({ ...job, issues, ...result });
        if (job.viewport.width === 375 && job.viewport.orientation === "portrait" && ["/", "/category/unisex", "/product/fleece-bear-overall", "/cart", "/checkout", "/contact"].includes(job.route)) await page.screenshot({ path: `${directory}/after/${job.language}-${slug(job.route)}-375.png`, fullPage: true, animations: "disabled" });
      } catch (error) { failures.push({ ...job, error: String(error) }); }
    }
    await context.close();
  }));
  console.log(`Layout: ${measurements.length} page/language/viewport combinations, ${failures.length} failures.`);

  // Compare desktop pixels against the actual pre-edit screenshots, with empty state restored.
  const desktop = [];
  for (const language of interactionsOnly ? [] : ["en", "ar"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await context.addCookies([{ name: "bg-language", value: language, url: origin }]);
    const page = await context.newPage();
    for (const file of fs.readdirSync(`${directory}/before`).filter((name) => name.startsWith(`${language}-`) && name.endsWith("-1440.png") && !name.includes("populated"))) {
      const baselineRows = JSON.parse(fs.readFileSync(`${directory}/before.json`, "utf8"));
      const row = baselineRows.find((item) => item.lang === language && `${language}-${slug(item.route)}-1440.png` === file);
      if (!row) continue;
      await page.goto(origin + row.route);
      await page.evaluate(() => document.fonts.ready);
      const actual = await page.screenshot({ path: `${directory}/after/${file}`, fullPage: true, animations: "disabled" });
      desktop.push({ language, route: row.route, identical: actual.equals(fs.readFileSync(`${directory}/before/${file}`)) });
    }
    await context.close();
  }
  if (!interactionsOnly) {
    fs.writeFileSync(`${directory}/desktop-comparison.json`, JSON.stringify(desktop, null, 2));
    console.log(`Desktop: ${desktop.filter((item) => item.identical).length}/${desktop.length} screenshots byte-for-byte identical.`);
  }

  // Exercise real controls, focus restoration, rotation, touch, and a reduced visual viewport.
  for (const language of ["en", "ar"]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce", hasTouch: true, isMobile: true });
    await context.addInitScript(seed);
    await context.addCookies([{ name: "bg-language", value: language, url: origin }]);
    const page = await context.newPage();
    try {
      await page.goto(origin + "/");
      await page.locator("#cart-icon .bag-count").filter({ hasText: "1" }).waitFor();
      const trigger = page.locator(".mobile-menu-button");
      await trigger.focus(); await page.keyboard.press("Enter");
      await page.locator("#mobile-navigation").waitFor({ state: "visible" });
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      await page.keyboard.press("Escape");
      await page.locator("#mobile-navigation").waitFor({ state: "hidden" });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
      await trigger.click();
      await page.locator(".mobile-nav a[href='/']").click();
      await page.locator("#mobile-navigation").waitFor({ state: "hidden" });
      await trigger.click();
      await page.locator(".mobile-nav a[href='/category/girls']").click();
      await page.waitForURL("**/category/girls");
      assert.equal(await page.evaluate(() => document.body.style.overflow), "");
      await trigger.click();
      const heading = page.locator("#mobile-navigation .modal-heading");
      await heading.dispatchEvent("pointerdown", { pointerType: "touch", clientX: language === "ar" ? 220 : 80, clientY: 40 });
      await heading.dispatchEvent("pointerup", { pointerType: "touch", clientX: language === "ar" ? 80 : 220, clientY: 42 });
      await page.locator("#mobile-navigation").waitFor({ state: "hidden" });
      await page.goto(origin + "/shop");
      await page.locator(".mobile-filter").click();
      await page.locator("dialog[open] .filter-content").waitFor();
      await page.keyboard.press("Escape");
      await page.goto(origin + "/product/fleece-bear-overall");
      await page.locator(".size-guide").click();
      const dialog = page.locator("dialog[open]");
      assert.ok(await dialog.evaluate((element) => element.getBoundingClientRect().width <= innerWidth));
      await page.keyboard.press("Escape");
      await page.locator(".purchase-row .add-main").click();
      await page.locator("#cart-icon .bag-count").filter({ hasText: "2" }).waitFor();
      await page.locator("#cart-icon").click();
      await page.locator("dialog[open] .cart-line").first().waitFor();
      await page.keyboard.press("Escape");
      await page.locator(".nav-actions button").first().click();
      await page.locator("dialog[open] input").first().fill("romper");
      await page.setViewportSize({ width: 375, height: 360 });
      await page.waitForFunction(() => {
        const openDialog = document.querySelector("dialog[open]");
        return openDialog && openDialog.getBoundingClientRect().height <= innerHeight + 1;
      });
      assert.ok(await page.locator("dialog[open]").evaluate((element) => element.getBoundingClientRect().height <= innerHeight + 1));
      await page.keyboard.press("Escape");
      await page.setViewportSize({ width: 812, height: 375 });
      assert.equal((await inspect(page)).overflow, 0);
      await page.goto(origin + "/checkout");
      const fields = page.locator(".form-grid input");
      await fields.first().fill("Test Customer");
      await fields.nth(1).fill("+961 71 234 567");
      await page.locator(".form-grid select").selectOption("Beirut");
      await fields.nth(3).fill("Beirut");
      await fields.nth(4).fill("Test street, building 1");
      await page.locator(".step-buttons .btn").click();
      await page.locator(".step-buttons .text-link").waitFor();
      interactions.push({ language, navigationKeyboardEscapeSameRoute: true, drawerSwipe: true, filterSizeGuideCart: true, searchKeyboardResize: true, rotation: true, checkoutReview: true });
    } catch (error) { failures.push({ language, interactionError: String(error) }); }
    await context.close();
  }
} finally {
  await browser.close();
  const filename = interactionsOnly ? "interactions.json" : "after.json";
  fs.writeFileSync(`${directory}/${filename}`, JSON.stringify({ routes: routes.length, viewports, measurements, failures, interactions }, null, 2));
  if (interactionsOnly && fs.existsSync(`${directory}/after.json`)) {
    const matrix = JSON.parse(fs.readFileSync(`${directory}/after.json`, "utf8"));
    matrix.failures = [...matrix.failures.filter((item) => !item.interactionError), ...failures];
    matrix.interactions = interactions;
    fs.writeFileSync(`${directory}/after.json`, JSON.stringify(matrix, null, 2));
  }
}
console.log(JSON.stringify({ failures: failures.slice(0, 20), interactionChecks: interactions }, null, 2));
if (failures.length) process.exitCode = 1;
