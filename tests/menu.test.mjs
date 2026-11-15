import test from "node:test";
import assert from "node:assert/strict";
import { checkMenu, DEFAULT_MENU, parseMenu, RESERVED_SLUGS, resolveMenu, safeLink, slugify } from "../src/domain/menu.ts";

const shoes = { id: "cat-shoes", name: "Shoes", nameAr: "أحذية", slug: "shoes", intro: "", introAr: "" };

test("until the owner saves a menu, the website keeps its original menu", () => {
  const { shop, top } = resolveMenu(DEFAULT_MENU, []);
  assert.deepEqual(shop.map((l) => l.label), ["Boys", "Girls", "Unisex", "Accessories", "Maternity", "Toys", "Outlet", "Sale"]);
  assert.deepEqual(top.map((l) => `${l.label} ${l.href}`), ["New In /shop?sort=newest", "Sale /category/sale", "About us /about", "Contact /contact"]);
  assert.equal(parseMenu(undefined, []), DEFAULT_MENU);
});

test("a new category gets its own page and can be added, renamed, reordered and hidden", () => {
  const menu = {
    shop: [
      { kind: "category", target: "cat-shoes", label: "", labelAr: "", icon: "footprints", color: "#123abc", visible: true },
      { kind: "section", target: "girls", label: "Little Girls", labelAr: "بناتنا", icon: "", color: "", visible: true },
      { kind: "section", target: "boys", label: "", labelAr: "", icon: "", color: "", visible: false },
    ],
    top: [{ kind: "page", target: "faq", label: "", labelAr: "", icon: "", color: "", visible: true }],
  };
  const checked = checkMenu(menu, ["cat-shoes"]);
  assert.deepEqual(checked.issues, []);
  const { shop, top } = resolveMenu(checked.menu, [shoes]);
  assert.deepEqual(shop.map((l) => [l.label, l.labelAr, l.href]), [["Shoes", "أحذية", "/category/shoes"], ["Little Girls", "بناتنا", "/category/girls"]], "hidden Boys is left out");
  assert.deepEqual(shop[0].match, { productType: "Shoes" });
  assert.equal(shop[0].icon, "footprints");
  assert.equal(top[0].href, "/faq");
});

test("broken entries are refused when saving, and dropped (not crashing the site) when reading", () => {
  const bad = { shop: [{ kind: "category", target: "gone" }], top: [{ kind: "link", target: "javascript:alert(1)", label: "x" }, { kind: "link", target: "/help/sizing", label: "" }] };
  const { issues } = checkMenu(bad, []);
  assert.equal(issues.length, 3);
  assert.match(issues[0].message, /no longer exists/);
  assert.match(issues[1].message, /must start with/);
  assert.match(issues[2].message, /needs an English label/);
  const saved = { shop: [{ kind: "category", target: "gone" }, { kind: "section", target: "boys" }], top: [] };
  assert.deepEqual(parseMenu(saved, []).shop.map((i) => i.target), ["boys"]);
});

test("links may point to a page of the site or a secure website only", () => {
  assert.ok(safeLink("/help/sizing"));
  assert.ok(safeLink("/shop?sort=newest"));
  assert.ok(safeLink("https://www.instagram.com/boysandgirlz.lb/"));
  assert.ok(!safeLink("//evil.example"));
  assert.ok(!safeLink("http://insecure.example"));
  assert.ok(!safeLink("javascript:alert(1)"));
});

test("category web addresses are simple and can't take a built-in section's address", () => {
  assert.equal(slugify("Baby Shoes & Socks!"), "baby-shoes-socks");
  assert.equal(slugify("  Été  "), "ete");
  assert.equal(slugify("أحذية"), "");
  assert.ok(RESERVED_SLUGS.has("boys") && RESERVED_SLUGS.has("sale"));
});
