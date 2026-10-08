import test from "node:test";
import assert from "node:assert/strict";
import {
  storeReducer,
  restoreStore,
  initialState,
  itemKey,
  calculateTotals,
} from "../src/state/storeCore.ts";
const item = { productId: "romper", size: "3–6M", color: "Blue", quantity: 1 };
const catalog = [
  { id: "romper", sizes: ["3–6M", "6–12M"], colors: ["Blue", "Cream"] },
];
test("identical variants combine, different sizes and colors stay separate", () => {
  let state = storeReducer(initialState, { type: "ADD", item });
  state = storeReducer(state, { type: "ADD", item: { ...item, quantity: 2 } });
  state = storeReducer(state, {
    type: "ADD",
    item: { ...item, size: "6–12M" },
  });
  state = storeReducer(state, {
    type: "ADD",
    item: { ...item, color: "Cream" },
  });
  assert.equal(state.cart.length, 3);
  assert.equal(state.cart[0].quantity, 3);
  assert.deepEqual(restoreStore(JSON.stringify(state), catalog), state);
});
test("quantities stay between 1 and 10 and removal is variant-specific", () => {
  let state = storeReducer(initialState, {
    type: "ADD",
    item: { ...item, quantity: 99 },
  });
  assert.equal(state.cart[0].quantity, 10);
  state = storeReducer(state, {
    type: "QUANTITY",
    key: itemKey(item),
    quantity: -5,
  });
  assert.equal(state.cart[0].quantity, 1);
  state = storeReducer(state, {
    type: "ADD",
    item: { ...item, size: "6–12M" },
  });
  state = storeReducer(state, { type: "REMOVE", key: itemKey(item) });
  assert.equal(state.cart[0].size, "6–12M");
});
test("malformed and stale persisted state recovers without crashing", () => {
  assert.deepEqual(restoreStore("{broken", catalog), initialState);
  assert.deepEqual(restoreStore("null", catalog), initialState);
  const dirty = {
    cart: [
      null,
      { ...item, productId: "gone" },
      { ...item, size: "bad" },
      { ...item, color: "Red" },
      { ...item, quantity: "2" },
      { ...item, quantity: -1 },
      { ...item, quantity: 50 },
      item,
    ],
    wishlist: ["romper", "romper", "gone"],
  };
  assert.deepEqual(restoreStore(JSON.stringify(dirty), catalog), {
    cart: [{ ...item, quantity: 10 }],
    wishlist: ["romper"],
  });
});
test("bag subtotal uses rounded currency values; server handles shipping and promo", () => {
  assert.deepEqual(
    calculateTotals(
      [{ ...item, quantity: 2 }],
      new Map([["romper", 37.4]]),
    ),
    { subtotal: 74.8, discount: 0, shipping: 0, total: 74.8 },
  );
  assert.deepEqual(
    calculateTotals(
      [{ ...item, quantity: 2 }],
      new Map([["romper", 49.85]]),
    ),
    { subtotal: 99.7, discount: 0, shipping: 0, total: 99.7 },
  );
  assert.deepEqual(calculateTotals([], new Map()), {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
  });
});
test("checkout clear preserves wishlist", () => {
  const state = { cart: [item], wishlist: ["romper"] };
  assert.deepEqual(storeReducer(state, { type: "CLEAR_CART" }), {
    cart: [],
    wishlist: ["romper"],
  });
});
