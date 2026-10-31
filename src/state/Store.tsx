import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "../data/products";
import { useCatalog } from "./Catalog";
import {
  calculateTotals,
  initialState,
  restoreStore,
  storeReducer,
  type Action,
  type StoreState,
} from "./storeCore";
import { useLocale } from "../i18n/Locale";
interface Store extends StoreState {
  dispatch: React.Dispatch<Action>;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  notice: string;
  notify: (s: string) => void;
  add: (
    p: Product,
    size?: string,
    color?: string,
    quantity?: number,
    element?: HTMLElement,
  ) => void;
  toggleWish: (id: string) => void;
  count: number;
  totals: ReturnType<typeof calculateTotals>;
}
const StoreContext = createContext<Store | null>(null);
type CatalogAction = Action | { type: "CATALOG_CHANGED"; products: Product[] };
function cleanCatalogState(state: StoreState, products: Product[]): StoreState {
  const restored = restoreStore(JSON.stringify(state), products);
  const available = new Set(products.filter((product) => product.available !== false).map((product) => product.id));
  return { ...restored, cart: restored.cart.filter((item) => available.has(item.productId)) };
}
function catalogReducer(state: StoreState, action: CatalogAction): StoreState {
  return action.type === "CATALOG_CHANGED" ? cleanCatalogState(state, action.products) : storeReducer(state, action);
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const { products, productById } = useCatalog();
  const { language, t } = useLocale();
  const [state, dispatch] = useReducer(catalogReducer, initialState);
  const restored = useRef(false);
  const visibleState = useMemo(() => cleanCatalogState(state, products), [state, products]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, notify] = useState("");
  useEffect(() => {
    if (restored.current) {
      dispatch({ type: "CATALOG_CHANGED", products });
      return;
    }
    restored.current = true;
    try {
      dispatch({ type: "HYDRATE", state: cleanCatalogState(restoreStore(localStorage.getItem("boys-girlz:v1"), products), products) });
    } catch {
      // Storage can be unavailable; the in-memory bag still works.
    } finally {
      setHydrated(true);
    }
  }, [products]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("boys-girlz:v1", JSON.stringify(visibleState));
    } catch {
      /* Local shopping still works without storage. */
    }
  }, [visibleState, hydrated]);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => notify(""), 3400);
    return () => clearTimeout(id);
  }, [notice]);
  const add = (
    p: Product,
    size = p.sizes[0] || "",
    color = p.colors[0],
    quantity = 1,
    element?: HTMLElement,
  ) => {
    const current = productById(p.id);
    if (!current || current.available === false || (current.sizes.length > 0 && !current.sizes.includes(size)) || (current.sizes.length === 0 && size !== "") || !current.colors.includes(color)) return;
    dispatch({ type: "ADD", item: { productId: p.id, size, color, quantity } });
    notify(language === "ar" ? `أُضيف ${t(p.name)} إلى السلّة` : `${p.name} added to your bag`);
    if (element && !current.imageUrl)
      window.dispatchEvent(
        new CustomEvent("fly-to-bag", {
          detail: { rect: element.getBoundingClientRect(), image: p.image },
        }),
      );
  };
  const toggleWish = (id: string) => {
    if (!productById(id)) return;
    dispatch({ type: "WISH", id });
    notify(
      visibleState.wishlist.includes(id)
        ? t("Removed from your wishlist")
        : t("A little favorite, saved for later"),
    );
  };
  const totals = calculateTotals(
    visibleState.cart,
    new Map(products.map((p) => [p.id, p.price])),
  );
  return (
    <StoreContext.Provider
      value={{
        ...visibleState,
        dispatch,
        cartOpen,
        setCartOpen,
        notice,
        notify,
        add,
        toggleWish,
        totals,
        count: visibleState.cart.reduce((n, i) => n + i.quantity, 0),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider is required");
  return value;
}
