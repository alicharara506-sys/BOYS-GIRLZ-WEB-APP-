export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}
export interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  promo: string;
}
export type Action =
  | { type: "ADD"; item: CartItem }
  | { type: "QUANTITY"; key: string; quantity: number }
  | { type: "REMOVE"; key: string }
  | { type: "WISH"; id: string }
  | { type: "PROMO"; code: string }
  | { type: "CLEAR_CART" };
export const initialState: StoreState = { cart: [], wishlist: [], promo: "" };
export const itemKey = (i: CartItem) =>
  [i.productId, i.size, i.color].join("::");
const clamp = (n: number) =>
  Math.max(1, Math.min(10, Number.isFinite(n) ? Math.round(n) : 1));
export function storeReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "ADD": {
      const key = itemKey(action.item);
      const exists = state.cart.some((i) => itemKey(i) === key);
      return {
        ...state,
        cart: exists
          ? state.cart.map((i) =>
              itemKey(i) === key
                ? { ...i, quantity: clamp(i.quantity + action.item.quantity) }
                : i,
            )
          : [
              ...state.cart,
              { ...action.item, quantity: clamp(action.item.quantity) },
            ],
      };
    }
    case "QUANTITY":
      return {
        ...state,
        cart: state.cart.map((i) =>
          itemKey(i) === action.key
            ? { ...i, quantity: clamp(action.quantity) }
            : i,
        ),
      };
    case "REMOVE":
      return {
        ...state,
        cart: state.cart.filter((i) => itemKey(i) !== action.key),
      };
    case "WISH":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.id)
          ? state.wishlist.filter((id) => id !== action.id)
          : [...state.wishlist, action.id],
      };
    case "PROMO":
      return {
        ...state,
        promo:
          action.code.trim().toUpperCase() === "LITTLELOVE10"
            ? "LITTLELOVE10"
            : "",
      };
    case "CLEAR_CART":
      return { ...state, cart: [], promo: "" };
    default:
      return state;
  }
}
export function restoreStore(
  raw: string | null,
  catalog: { id: string; sizes: string[]; colors: string[] }[],
): StoreState {
  try {
    const data = JSON.parse(raw || "{}");
    const known = new Map(catalog.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const cart = (Array.isArray(data?.cart) ? data.cart : [])
      .filter((i: CartItem) => {
        const p = known.get(i?.productId);
        if (
          !p ||
          !p.sizes.includes(i.size) ||
          !p.colors.includes(i.color) ||
          !Number.isFinite(i.quantity) ||
          i.quantity < 1 ||
          seen.has(itemKey(i))
        )
          return false;
        seen.add(itemKey(i));
        return true;
      })
      .map((i: CartItem) => ({
        productId: i.productId,
        size: i.size,
        color: i.color,
        quantity: clamp(i.quantity),
      }));
    return {
      cart,
      wishlist: [
        ...new Set<string>(
          (Array.isArray(data?.wishlist) ? data.wishlist : []).filter(
            (id: string) => known.has(id),
          ),
        ),
      ],
      promo: data?.promo === "LITTLELOVE10" ? data.promo : "",
    };
  } catch {
    return initialState;
  }
}
export function calculateTotals(
  cart: CartItem[],
  prices: Map<string, number>,
  promo: string,
) {
  const subtotal =
    Math.round(
      cart.reduce(
        (sum, i) => sum + (prices.get(i.productId) || 0) * i.quantity,
        0,
      ) * 100,
    ) / 100;
  const discount =
    promo === "LITTLELOVE10" ? Math.round(subtotal * 10) / 100 : 0;
  const shipping = subtotal === 0 || subtotal >= 99 ? 0 : 5.95;
  return {
    subtotal,
    discount,
    shipping,
    total: Math.round((subtotal - discount + shipping) * 100) / 100,
  };
}
