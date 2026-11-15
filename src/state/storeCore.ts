export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}
export interface StoreState {
  cart: CartItem[];
  wishlist: string[];
}
export type Action =
  | { type: "HYDRATE"; state: StoreState }
  | { type: "ADD"; item: CartItem }
  | { type: "QUANTITY"; key: string; quantity: number }
  | { type: "REMOVE"; key: string }
  | { type: "WISH"; id: string }
  | { type: "CLEAR_CART" };
export const initialState: StoreState = { cart: [], wishlist: [] };
export const itemKey = (i: CartItem) =>
  [i.productId, i.size, i.color].join("::");
const clamp = (n: number) =>
  Math.max(1, Math.min(10, Number.isFinite(n) ? Math.round(n) : 1));
export function storeReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
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
    case "CLEAR_CART":
      return { ...state, cart: [] };
    default:
      return state;
  }
}
// What the cart needs to know about a product to accept a line for it.
export type CatalogEntry = {
  id: string;
  sizes: string[];
  colors: string[];
  available?: boolean;
  colorVariants?: { name: string; available: boolean; sizes?: string[] }[];
};
// A line can be added only for a sellable product, one of its sizes and one of its colors that
// is not out of stock. Each color is checked on its own: one color being out of stock never
// blocks the others.
export function canAddToCart(
  product: CatalogEntry | undefined,
  size: string,
  color: string,
): boolean {
  if (!product || product.available === false) return false;
  if (product.sizes.length > 0 ? !product.sizes.includes(size) : size !== "") return false;
  if (!product.colors.includes(color)) return false;
  const details = product.colorVariants?.find((variant) => variant.name === color);
  if (!details) return true;
  // A color may come in fewer sizes than the product (purple only in 12–18 Months, say).
  if (details.sizes?.length && !details.sizes.includes(size)) return false;
  return details.available;
}
export function restoreStore(
  raw: string | null,
  catalog: CatalogEntry[],
): StoreState {
  try {
    const data = JSON.parse(raw || "{}");
    const known = new Map(catalog.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const cart = (Array.isArray(data?.cart) ? data.cart : [])
      .filter((i: CartItem) => {
        const p = known.get(i?.productId);
        if (
          !canAddToCart(p, i?.size, i?.color) ||
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
    };
  } catch {
    return initialState;
  }
}
export function calculateTotals(
  cart: CartItem[],
  prices: Map<string, number>,
) {
  const subtotal =
    Math.round(
      cart.reduce(
        (sum, i) => sum + (prices.get(i.productId) || 0) * i.quantity,
        0,
      ) * 100,
    ) / 100;
  return {
    subtotal,
    discount: 0,
    shipping: 0,
    total: subtotal,
  };
}
