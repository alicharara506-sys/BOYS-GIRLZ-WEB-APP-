import test from "node:test";
import assert from "node:assert/strict";
import { generateSeoOutputs, publicSiteOrigin } from "../scripts/seo-output.mjs";
import { PUBLIC_PAGE_PATHS, getPageSeo, globalStructuredData, pageStructuredData } from "../src/config/seo.ts";
import { localizeTo } from "../src/config/locale-url.ts";

test("all public pages have concise, unique metadata in both languages", () => {
  for (const language of ["en", "ar"]) {
    const titles = new Set();
    const descriptions = new Set();
    for (const path of PUBLIC_PAGE_PATHS) {
      const page = getPageSeo(path, language);
      assert.ok(page.title.length <= 60, `${language} ${path} title`);
      assert.ok(page.description.length <= 155, `${language} ${path} description`);
      assert.ok(page.h1.length > 0);
      assert.ok(!titles.has(page.title), `${path} duplicate title`);
      assert.ok(!descriptions.has(page.description), `${path} duplicate description`);
      titles.add(page.title); descriptions.add(page.description);
    }
  }
});

test("crawl output has reciprocal language variants and factual lastmod", () => {
  const outputs = generateSeoOutputs({ siteUrl: "https://boysandgirlz.com", lastModified: () => "2026-10-30T10:00:00+02:00" });
  assert.equal(outputs.paths.length, 17);
  assert.equal((outputs.sitemap.match(/<loc>/g) || []).length, 34);
  assert.match(outputs.sitemap, /hreflang="x-default"/);
  assert.match(outputs.sitemap, /https:\/\/boysandgirlz.com\/faq\?lang=ar/);
  assert.match(outputs.sitemap, /<lastmod>2026-10-30T10:00:00\+02:00<\/lastmod>/);
  assert.doesNotMatch(outputs.sitemap, /\/product\/|\/checkout|\/wishlist|\/cart/);
  assert.match(outputs.robots, /User-agent: \*\nAllow: \//);
  assert.match(outputs.robots, /Sitemap: https:\/\/boysandgirlz.com\/sitemap.xml/);
  assert.doesNotMatch(outputs.robots, /Disallow/);
  assert.match(outputs.llms, /\[About Boys & Girlz\]\(https:\/\/boysandgirlz.com\/about\)/);
});

test("missing dates are omitted and invalid public origins are rejected", () => {
  assert.doesNotMatch(generateSeoOutputs({ siteUrl: "https://boysandgirlz.com" }).sitemap, /lastmod/);
  assert.equal(generateSeoOutputs().sitemap, null);
  for (const value of ["http://boysandgirlz.com", "https://localhost", "https://127.0.0.1", "https://boysandgirlz.com/path", "https://user:password@boysandgirlz.com"]) assert.throws(() => publicSiteOrigin(value));
});

test("demo products and private/error pages are noindex without fabricated offers", () => {
  for (const path of ["/product/everyday-overshirt", "/cart", "/checkout", "/wishlist", "/invalid"]) assert.equal(getPageSeo(path).indexable, false);
  const product = getPageSeo("/product/everyday-overshirt");
  assert.equal(pageStructuredData(product, "en", "https://boysandgirlz.com"), undefined);
  const verified = getPageSeo(product.path, "en", { catalogVerified: true });
  const schema = pageStructuredData(verified, "en", "https://boysandgirlz.com", { catalogVerified: true });
  assert.equal(schema.offers.price, "28.00");
  assert.equal(schema.offers.availability, undefined);
  assert.equal(schema.aggregateRating, undefined);
});

test("business schema avoids unconfirmed locations and supports real search", () => {
  const schema = globalStructuredData({ language: "ar", siteUrl: "https://boysandgirlz.com", whatsappPhone: "+96181061731" });
  assert.equal(schema["@graph"][0]["@type"], "Organization");
  assert.equal(schema["@graph"][0].address, undefined);
  assert.equal(schema["@graph"][1].potentialAction.target.urlTemplate, "https://boysandgirlz.com/shop?lang=ar&q={search_term_string}");
});

test("language navigation retains filters and fragments without modifying external URLs", () => {
  assert.equal(localizeTo("/shop?brand=gap#products", "ar"), "/shop?brand=gap&lang=ar#products");
  assert.equal(localizeTo("/faq?lang=ar#sizes", "en"), "/faq#sizes");
  assert.equal(localizeTo("https://example.com/", "ar"), "https://example.com/");
  assert.deepEqual(localizeTo({ pathname: "/shop", search: "?q=shirt" }, "ar"), { pathname: "/shop", search: "?q=shirt&lang=ar", hash: undefined });
});
