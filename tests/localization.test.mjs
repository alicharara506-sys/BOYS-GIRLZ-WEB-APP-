import test from "node:test";
import assert from "node:assert/strict";
import { translate, localizedCount } from "../src/i18n/translations.ts";
import { categories, products, sizeOptions, colorHex } from "../src/data/products.ts";

test("complete Arabic phrases take precedence over composed Shop titles", () => {
  assert.equal(translate("Shop Boys", "ar"), "تسوّق تشكيلة الأولاد");
  assert.equal(translate("Shop Girls", "ar"), "تسوّق تشكيلة البنات");
  assert.equal(translate("Shop Unisex", "ar"), "تسوّق تشكيلة الأولاد والبنات");
  assert.equal(translate("Shop Accessories", "ar"), "تسوّق الإكسسوارات");
  assert.equal(translate("Help: shipping", "ar"), "المساعدة: التوصيل");
  assert.equal(translate("Shop Boys", "en"), "Shop Boys");
});

test("Arabic product and suggestion counts handle zero, singular, dual and plurals", () => {
  for (const [count, expected] of [[0, "لا توجد منتجات"], [1, "منتج واحد"], [2, "منتجان"], [3, "3 منتجات"], [10, "10 منتجات"], [11, "11 منتجًا"], [99, "99 منتجًا"], [100, "100 منتج"]]) {
    assert.equal(localizedCount(count, "product", "ar"), expected);
  }
  assert.equal(localizedCount(2, "suggestion", "ar"), "اقتراحان");
  assert.equal(localizedCount(11, "suggestion", "ar"), "11 اقتراحًا");
  assert.equal(localizedCount(1, "product", "en"), "1 product");
  assert.equal(localizedCount(2, "product", "en"), "2 products");
});

test("catalog names, descriptions, navigation, sizes and colors have Arabic copy", () => {
  const messages = [...categories, ...sizeOptions, ...Object.keys(colorHex), ...products.flatMap((product) => [product.name, product.description])];
  for (const message of messages) {
    assert.notEqual(translate(message, "ar"), message, message);
    assert.match(translate(message, "ar"), /[\u0600-\u06ff]/u, message);
    assert.equal(translate(message, "en"), message);
  }
});
