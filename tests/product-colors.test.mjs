import test from "node:test";
import assert from "node:assert/strict";
import {
  colorAvailable,
  colorImages,
  colorSizes,
  defaultColor,
  imageFileIssue,
  normalizeHex,
  productSlug,
  validateBasics,
  validateColors,
} from "../src/domain/productColors.ts";
import { canAddToCart, itemKey, restoreStore, storeReducer, initialState, calculateTotals } from "../src/state/storeCore.ts";

const photo = (name) => ({ url: `https://cdn.example/${name}.webp`, file: `${name}.webp` });
const pink = { name: "Pink", nameAr: "زهري", hex: "#e6afb3", images: [photo("pink-front"), photo("pink-back"), photo("pink-detail")], available: true };
const blue = { name: "Blue", nameAr: "أزرق", hex: "#9bbbd7", images: [photo("blue-front"), photo("blue-back")], available: false };
const white = { name: "White", nameAr: "أبيض", hex: "#ffffff", images: [photo("white-front"), photo("white-detail")], available: true };
const basics = { name: "Baby Girl Dress", nameAr: "فستان للبنات", description: "One shared description.", descriptionAr: "", shopId: "shop", categoryId: "girls", brand: "Boys & Girlz", price: 25, salePrice: null, cost: 11, sizes: ["0–3 Months", "3–6 Months"] };
// A product as the storefront catalogue builds it: one product, three colors, one shared price.
const dress = { id: "baby-girl-dress", name: basics.name, description: basics.description, price: 25, sizes: basics.sizes, colors: ["Pink", "Blue", "White"], available: true, imageUrl: pink.images[0].url, colorMode: "multiple", colorVariants: [pink, blue, white] };

test("a one-color product is valid with exactly one color that has photos", () => {
  assert.deepEqual(validateColors("single", [pink]), []);
  assert.deepEqual(validateBasics(basics), []);
  assert.match(validateColors("single", [pink, white])[0].message, /exactly one color/);
});

test("a multiple-color product is valid with two or more colors", () => {
  assert.deepEqual(validateColors("multiple", [pink, blue, white]), []);
});

test("a color without photos is rejected", () => {
  const issues = validateColors("multiple", [pink, { ...white, images: [] }]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, "colors.1.images");
  assert.match(issues[0].message, /White/);
});

test("a multiple-color product needs at least two colors", () => {
  assert.match(validateColors("multiple", [pink])[0].message, /at least two colors/);
});

test("color names, swatches and uploads are checked", () => {
  assert.match(validateColors("multiple", [pink, { ...white, name: "pink" }]).map((i) => i.message).join(" "), /already used/);
  assert.match(validateColors("multiple", [pink, { ...white, hex: "white" }]).map((i) => i.message).join(" "), /swatch/);
  assert.match(validateColors("multiple", [pink, { ...white, images: [{ url: "blob:http://localhost/x" }] }]).map((i) => i.message).join(" "), /finished uploading/);
  assert.equal(normalizeHex("#FFF"), "#ffffff");
  assert.equal(normalizeHex("9BBBD7"), "#9bbbd7");
  assert.match(imageFileIssue({ name: "a.pdf", type: "application/pdf", size: 10 }), /not a JPG/);
  assert.match(imageFileIssue({ name: "big.jpg", type: "image/jpeg", size: 16 * 1024 * 1024 }), /larger than 15 MB/);
  assert.equal(imageFileIssue({ name: "ok.webp", type: "image/webp", size: 1000 }), null);
});

test("shared details are checked once: price, sale price, sizes and category", () => {
  assert.match(validateBasics({ ...basics, price: 0 })[0].message, /price/);
  assert.match(validateBasics({ ...basics, salePrice: 30 })[0].message, /below the regular price/);
  assert.deepEqual(validateBasics({ ...basics, salePrice: 19.99 }), []);
  assert.match(validateBasics({ ...basics, sizes: [] })[0].message, /size/);
  assert.match(validateBasics({ ...basics, categoryId: "" })[0].message, /category/);
  assert.match(productSlug("Baby Girl Dress!", "LZ8K2"), /^baby-girl-dress-lz8k2$/);
});

test("each color keeps only its own photos, cover first", () => {
  assert.deepEqual(colorImages(dress, "Pink"), pink.images.map((i) => i.url));
  assert.deepEqual(colorImages(dress, "Blue"), blue.images.map((i) => i.url));
  assert.ok(colorImages(dress, "Blue").every((url) => url.includes("blue")));
  assert.equal(colorImages(dress, "White")[0], white.images[0].url);
});

test("each color has its own availability; one out-of-stock color doesn't affect the others", () => {
  assert.equal(colorAvailable(dress, "Pink"), true);
  assert.equal(colorAvailable(dress, "Blue"), false);
  assert.equal(colorAvailable(dress, "White"), true);
  assert.equal(defaultColor(dress), "Pink");
  assert.equal(defaultColor({ ...dress, colorVariants: [blue, white] }), "White");
});

test("switching color changes the photos, never the shared name, description or price", () => {
  const before = { name: dress.name, description: dress.description, price: dress.price };
  for (const color of dress.colors) {
    colorImages(dress, color);
    assert.deepEqual({ name: dress.name, description: dress.description, price: dress.price }, before);
  }
  assert.notDeepEqual(colorImages(dress, "Pink"), colorImages(dress, "White"));
});

test("an out-of-stock color can't go in the bag; an available one can", () => {
  assert.equal(canAddToCart(dress, "0–3 Months", "Blue"), false);
  assert.equal(canAddToCart(dress, "0–3 Months", "Pink"), true);
  assert.equal(canAddToCart(dress, "9–12 Months", "Pink"), false, "unknown size");
  assert.equal(canAddToCart(dress, "0–3 Months", "Green"), false, "unknown color");
});

test("two colors of the same product are separate bag lines at the shared price", () => {
  let state = storeReducer(initialState, { type: "ADD", item: { productId: dress.id, size: "0–3 Months", color: "Pink", quantity: 1 } });
  state = storeReducer(state, { type: "ADD", item: { productId: dress.id, size: "0–3 Months", color: "White", quantity: 2 } });
  state = storeReducer(state, { type: "ADD", item: { productId: dress.id, size: "0–3 Months", color: "Pink", quantity: 1 } });
  assert.equal(state.cart.length, 2);
  assert.notEqual(itemKey(state.cart[0]), itemKey(state.cart[1]));
  assert.equal(state.cart.find((i) => i.color === "Pink").quantity, 2);
  assert.equal(calculateTotals(state.cart, new Map([[dress.id, 25]])).total, 100);
});

test("the bag survives a refresh with each line's color, and drops a color that went out of stock", () => {
  const saved = JSON.stringify({
    cart: [
      { productId: dress.id, size: "0–3 Months", color: "Pink", quantity: 1 },
      { productId: dress.id, size: "3–6 Months", color: "White", quantity: 1 },
      { productId: dress.id, size: "0–3 Months", color: "Blue", quantity: 1 },
    ],
    wishlist: [dress.id],
  });
  const restored = restoreStore(saved, [dress]);
  assert.deepEqual(restored.cart.map((i) => i.color), ["Pink", "White"]);
  assert.deepEqual(colorImages(dress, restored.cart[1].color), white.images.map((i) => i.url));
  assert.deepEqual(restored.wishlist, [dress.id]);
});

test("older products without color details keep working in the bag and wishlist", () => {
  const legacy = { id: "romper", sizes: ["3–6M"], colors: ["Blue", "Cream"], imageUrl: "https://cdn.example/romper.webp" };
  assert.equal(canAddToCart(legacy, "3–6M", "Cream"), true);
  assert.deepEqual(colorImages(legacy, "Cream"), [legacy.imageUrl]);
  assert.equal(colorAvailable(legacy, "Cream"), true);
  assert.equal(defaultColor(legacy), "Blue");
  const restored = restoreStore(JSON.stringify({ cart: [{ productId: "romper", size: "3–6M", color: "Cream", quantity: 3 }], wishlist: ["romper", "gone"] }), [legacy]);
  assert.equal(restored.cart.length, 1);
  assert.deepEqual(restored.wishlist, ["romper"]);
});

// The question that started this: purple comes only in 12–18 Months, pink in every size.
const sizes4 = ["3–6 Months", "6–9 Months", "9–12 Months", "12–18 Months"];
const purple = { name: "purple", nameAr: "", hex: "#3b05ff", images: [photo("purple")], available: true, sizes: ["12–18 Months"] };
const pinkAll = { name: "pink", nameAr: "", hex: "#e6afb3", images: [photo("pink")], available: true };
const babyGirl = { id: "baby-girl", name: "baby girl", description: "", price: 30, sizes: sizes4, colors: ["pink", "purple"], available: true, colorMode: "multiple", colorVariants: [pinkAll, purple] };

test("a color can come in fewer sizes than the product", () => {
  assert.deepEqual(colorSizes(babyGirl, "pink"), sizes4);
  assert.deepEqual(colorSizes(babyGirl, "purple"), ["12–18 Months"]);
  assert.deepEqual(colorSizes({ ...babyGirl, colorVariants: undefined }, "purple"), sizes4, "older products: every size");
});

test("the bag only takes sizes the chosen color comes in", () => {
  assert.equal(canAddToCart(babyGirl, "12–18 Months", "purple"), true);
  assert.equal(canAddToCart(babyGirl, "3–6 Months", "purple"), false);
  assert.equal(canAddToCart(babyGirl, "3–6 Months", "pink"), true);
  const restored = restoreStore(JSON.stringify({ cart: [
    { productId: "baby-girl", size: "3–6 Months", color: "purple", quantity: 1 },
    { productId: "baby-girl", size: "12–18 Months", color: "purple", quantity: 1 },
    { productId: "baby-girl", size: "3–6 Months", color: "pink", quantity: 1 },
  ] }), [babyGirl]);
  assert.deepEqual(restored.cart.map((i) => `${i.color} ${i.size}`), ["purple 12–18 Months", "pink 3–6 Months"]);
});

test("each color needs at least one of the product's sizes", () => {
  assert.deepEqual(validateColors("multiple", [pinkAll, purple], sizes4), []);
  assert.match(validateColors("multiple", [pinkAll, { ...purple, sizes: [] }], sizes4)[0].message, /at least one size for purple/);
  assert.match(validateColors("multiple", [pinkAll, { ...purple, sizes: ["12–18 Months", "2–3 Years"] }], sizes4)[0].message, /size the product doesn't have/);
});

test("the cost per item must be entered (0 allowed), never negative or over two decimals", () => {
  assert.match(validateBasics({ ...basics, cost: null }).map((i) => i.message).join(" "), /costs you/);
  assert.match(validateBasics({ ...basics, cost: -1 }).map((i) => i.message).join(" "), /below \$0/);
  assert.match(validateBasics({ ...basics, cost: 1.234 }).map((i) => i.message).join(" "), /two decimals/);
  assert.deepEqual(validateBasics({ ...basics, cost: 0 }), []);
});
