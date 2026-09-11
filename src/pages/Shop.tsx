import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Heart,
} from "lucide-react";
import {
  categories,
  colorHex,
  products,
  type Category,
} from "../data/products";
import ProductCard from "../components/ProductCard";
import { Modal } from "../components/Layout";
import { useStore } from "../state/Store";
const copy: Record<Category, string> = {
  Boys: "For muddy knees, sleepy cuddles, and every little adventure.",
  Girls: "Lovely little layers for their own kind of adventure.",
  Unisex: "Timeless little favorites, made for every little one.",
  Accessories: "The thoughtful little things that make it all complete.",
  Maternity: "A little comfort for your beautiful, growing story.",
  Toys: "Little companions. Big imaginations. Endless play.",
};
export default function Shop() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const routeCategory = categories.find((c) => c.toLowerCase() === category);
  const [selected, setSelected] = useState<string[]>([]);
  const [max, setMax] = useState(80);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [mobile, setMobile] = useState(false);
  const query = params.get("q") || "";
  const sort = params.get("sort") || "featured";
  const sale = params.get("sale") === "true";
  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const activeCategories = routeCategory ? [routeCategory] : selected;
  const result = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        (!activeCategories.length || activeCategories.includes(p.category)) &&
        p.price <= max &&
        (!size || p.sizes.includes(size)) &&
        (!color || p.colors.includes(color)) &&
        (!sale || p.originalPrice) &&
        `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
    );
    return filtered.sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "rating"
            ? b.rating - a.rating
            : sort === "newest"
              ? Number(b.isNew) - Number(a.isNew)
              : 0,
    );
  }, [routeCategory, selected, max, size, color, sale, query, sort]);
  const reset = () => {
    setSelected([]);
    setMax(80);
    setSize("");
    setColor("");
    setParams({});
  };
  const filterCount =
    selected.length +
    Number(max < 80) +
    Number(!!size) +
    Number(!!color) +
    Number(sale);
  const filters = (
    <div className="filter-content">
      <div className="filter-title">
        <h3>A little more you</h3>
        <button onClick={reset}>Reset</button>
      </div>
      {!routeCategory && (
        <fieldset>
          <legend>Shop for</legend>
          {categories.map((c) => (
            <label className="check-label" key={c}>
              <input
                type="checkbox"
                checked={selected.includes(c)}
                onChange={() =>
                  setSelected((a) =>
                    a.includes(c) ? a.filter((v) => v !== c) : [...a, c],
                  )
                }
              />
              {c}
              <span>{products.filter((p) => p.category === c).length}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset>
        <legend>Price range</legend>
        <label htmlFor="max-price">Up to ${max}</label>
        <input
          id="max-price"
          aria-label="Maximum price"
          type="range"
          min="10"
          max="80"
          step="5"
          value={max}
          onChange={(e) => setMax(+e.target.value)}
        />
        <div className="range-labels">
          <span>$10</span>
          <span>$80</span>
        </div>
      </fieldset>
      <fieldset>
        <legend>Size</legend>
        <select
          aria-label="Filter by size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="">All sizes</option>
          {[...new Set(products.flatMap((p) => p.sizes))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>
          Color{" "}
          {color && (
            <button className="clear-color" onClick={() => setColor("")}>
              Clear
            </button>
          )}
        </legend>
        <div className="filter-colors">
          {Object.entries(colorHex).map(([c, hex]) => (
            <button
              key={c}
              className={color === c ? "selected" : ""}
              onClick={() => setColor(color === c ? "" : c)}
              aria-label={`Filter ${c}`}
              aria-pressed={color === c}
            >
              <i style={{ background: hex }} />
              <span>{c}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="check-label sale-check">
        <input
          type="checkbox"
          checked={sale}
          onChange={() => updateParam("sale", sale ? "" : "true")}
        />
        Little offers only
      </label>
      <div className="filter-note">
        <Heart size={22} strokeWidth={1.3} />
        <h3>Chosen with love.</h3>
        <p>Soft little things for the moments that matter.</p>
      </div>
    </div>
  );
  if (category && !routeCategory) return <NotFound />;
  return (
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <ChevronRight size={12} />
        <span>{routeCategory || "Shop"}</span>
      </div>
      <div className={`shop-heading ${routeCategory?.toLowerCase() || ""}`}>
        <div>
          <span className="eyebrow">Made for little moments</span>
          <h1>
            {routeCategory
              ? `${routeCategory === "Maternity" ? "For mama" : routeCategory === "Toys" ? "A little playtime" : `Little ${routeCategory.toLowerCase()}`}.`
              : sale
                ? "Lovely little offers."
                : "All the little things."}
          </h1>
          <p>
            {routeCategory
              ? copy[routeCategory]
              : sale
                ? "A little treat for them. A lovely price for you."
                : "Soft essentials, sweet details, and new favorites to fall for."}
          </p>
        </div>
        <span className="heading-heart">
          <Heart size={58} strokeWidth={1} />
        </span>
      </div>
      <div className="shop-layout">
        <aside className="desktop-filters" aria-label="Product filters">
          {filters}
        </aside>
        <div className="shop-results">
          <div className="shop-toolbar">
            <div className="listing-search">
              <Search size={18} />
              <input
                aria-label="Search the collection"
                placeholder="Find something lovely..."
                value={query}
                onChange={(e) => updateParam("q", e.target.value)}
                list="product-suggestions"
              />
              {query && (
                <button
                  aria-label="Clear search"
                  className="icon-button"
                  onClick={() => updateParam("q", "")}
                >
                  <X size={16} />
                </button>
              )}
              <datalist id="product-suggestions">
                {query &&
                  products
                    .filter((p) =>
                      p.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((p) => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          <div className="results-line">
            <p role="status">
              {result.length} little{" "}
              {result.length === 1 ? "favorite" : "favorites"}
            </p>
            <button
              className="mobile-filter btn btn-outline btn-small"
              onClick={() => setMobile(true)}
            >
              <SlidersHorizontal size={15} /> Filters{" "}
              {filterCount > 0 && `(${filterCount})`}
            </button>
          </div>
          {result.length ? (
            <div className="shop-grid">
              {result.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={40} />
              <h2>No little matches just yet.</h2>
              <p>Try a different size, color, or search.</p>
              <button className="btn btn-blue" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      <Modal
        open={mobile}
        onClose={() => setMobile(false)}
        title="Find your favorites"
        drawer
      >
        {mobile && filters}
        <button
          className="btn btn-blue filter-apply"
          onClick={() => setMobile(false)}
        >
          Show {result.length} favorites <ArrowRight size={16} />
        </button>
      </Modal>
    </div>
  );
}
export function Wishlist() {
  const { wishlist } = useStore();
  const saved = products.filter((p) => wishlist.includes(p.id));
  return (
    <div className="page-width">
      <div className="page-heading">
        <span className="eyebrow">Kept close to your heart</span>
        <h1>Your little wishlist.</h1>
        <p>
          {saved.length
            ? `${saved.length} lovely ${saved.length === 1 ? "thing" : "things"}, saved for later.`
            : "Some things are too lovely to forget."}
        </p>
      </div>
      {saved.length ? (
        <div className="wishlist-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Heart size={50} strokeWidth={1.2} />
          <h2>A little room for love.</h2>
          <p>Tap a heart on anything you love. We’ll keep it here.</p>
          <Link className="btn btn-pink" to="/shop">
            Find a favorite <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
export function NotFound() {
  return (
    <div className="page-width empty-state">
      <span className="eyebrow">404 · A little detour</span>
      <h1>This little page wandered off.</h1>
      <p>Let’s get you back to something lovely.</p>
      <Link to="/" className="btn btn-blue">
        Back home <ArrowRight size={16} />
      </Link>
    </div>
  );
}
