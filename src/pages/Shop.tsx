import { useState } from "react";
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
  sizeOptions,
  type Category,
} from "../data/products";
import ProductCard from "../components/ProductCard";
import { Modal } from "../components/Layout";
import CategoryScene from "../components/CategoryScene";
import CategoryHero from "../components/CategoryHero";
import { useStore } from "../state/Store";
import { localizedCount, useLocale } from "../i18n/Locale";
const matchesCategory = (product: (typeof products)[number], category: Category) =>
  category === "Sale" ? product.condition === "new" && Boolean(product.originalPrice)
    : category === "Outlet" ? product.condition === "like-new"
      : category === "Boys" || category === "Girls" || category === "Unisex"
        ? product.gender === category
        : product.category === category;
const priceCeiling = Math.ceil(Math.max(...products.map((product) => product.price)) / 5) * 5;
const copy: Record<Category, string> = {
  Boys: "For muddy knees, sleepy cuddles, and every little adventure.",
  Girls: "Lovely little layers for their own kind of adventure.",
  Unisex: "Timeless little favorites, made for every little one.",
  Accessories: "The thoughtful little things that make it all complete.",
  Maternity: "A little comfort for your beautiful, growing story.",
  Toys: "Little companions. Big imaginations. Endless play.",
  Outlet: "Like New finds: excellent pre-owned pieces, carefully selected and priced a little lighter.",
  Sale: "Discounted new items for little ones and growing families.",
};
const arabicCategoryHeading: Record<Category, string> = {
  Boys: "للأولاد الصغار", Girls: "للبنات الصغيرات", Unisex: "قطع تناسب الجميع",
  Accessories: "إكسسوارات الصغار", Maternity: "راحة للأم", Toys: "وقت اللعب",
  Outlet: "قطع شبه جديدة", Sale: "تخفيضات",
};
export default function Shop() {
  const { language, t } = useLocale();
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const routeCategory = categories.find((c) => c.toLowerCase() === category);
  const [mobile, setMobile] = useState(false);
  const selected = (params.get("category") || "").split(",").filter((value): value is Category => categories.includes(value as Category));
  const max = Math.min(priceCeiling, Math.max(0, Number(params.get("max") || priceCeiling)));
  const size = params.get("size") || "";
  const categoryProducts = products.filter((product) => routeCategory
    ? matchesCategory(product, routeCategory)
    : !selected.length || selected.some((active) => matchesCategory(product, active)));
  const availableSizes = [...new Set(categoryProducts.flatMap((product) => product.sizes))];
  const orderedSizes = [...sizeOptions, ...availableSizes.filter((option) => !sizeOptions.some((babySize) => babySize === option))]
    .filter((option) => availableSizes.includes(option) || option === size);
  if (size && !orderedSizes.includes(size)) orderedSizes.push(size);
  const color = params.get("color") || "";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "featured";
  const sale = params.get("sale") === "true";
  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  };
  const toggleCategory = (value: Category) => updateParam("category", selected.includes(value)
    ? selected.filter((item) => item !== value).join(",")
    : [...selected, value].join(","));
  const result = (() => {
    const activeCategories = routeCategory ? [routeCategory] : selected;
    const filtered = products.filter(
      (p) =>
        (!activeCategories.length || activeCategories.some((active) => matchesCategory(p, active))) &&
        p.price <= max &&
        (!size || p.sizes.includes(size)) &&
        (!color || p.colors.includes(color)) &&
        (!sale || (p.condition === "new" && p.originalPrice)) &&
        `${p.name} ${p.category} ${t(p.name)} ${t(p.category)}`.toLowerCase().includes(query.toLowerCase()),
    );
    return filtered.sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "newest"
              ? Number(b.isNew) - Number(a.isNew)
              : 0,
    );
  })();
  const reset = () => {
    setParams({});
  };
  const filterCount =
    selected.length +
    Number(max < priceCeiling) +
    Number(!!size) +
    Number(!!color) +
    Number(sale);
  const filters = (
    <div className="filter-content">
      <div className="filter-title">
        <h3>{t("A little more you")}</h3>
        <button onClick={reset}>{t("Reset")}</button>
      </div>
      {!routeCategory && (
        <fieldset>
          <legend>{t("Shop for")}</legend>
          {categories.map((c) => (
            <label className="check-label" key={c}>
              <input
                type="checkbox"
                checked={selected.includes(c)}
                onChange={() => toggleCategory(c)}
              />
              {t(c)}
              <span>{products.filter((p) => matchesCategory(p, c)).length}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset>
        <legend>{t("Price range")}</legend>
        <label htmlFor="max-price">{t("Up to")} <bdi>${max}</bdi></label>
        <input
          id="max-price"
          aria-label={t("Maximum price")}
          type="range"
          min="10"
          max={priceCeiling}
          step="5"
          value={max}
          onChange={(e) => updateParam("max", e.target.value)}
        />
        <div className="range-labels">
          <span>$10</span>
          <span>${priceCeiling}</span>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("Size")}</legend>
        <select
          aria-label={t("Filter by size")}
          value={size}
          onChange={(e) => updateParam("size", e.target.value)}
        >
          <option value="">{t("All sizes")}</option>
          {orderedSizes.map((s) => (
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>
          {t("Color")}{" "}
          {color && (
            <button className="clear-color" onClick={() => updateParam("color", "")}>
              {t("Clear")}
            </button>
          )}
        </legend>
        <div className="filter-colors">
          {Object.entries(colorHex).map(([c, hex]) => (
            <button
              key={c}
              className={color === c ? "selected" : ""}
              onClick={() => updateParam("color", color === c ? "" : c)}
              aria-label={language === "ar" ? `التصفية حسب اللون: ${t(c)}` : `Filter ${c}`}
              aria-pressed={color === c}
            >
              <i style={{ background: hex }} />
              <span>{t(c)}</span>
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
        {t("Little offers only")}
      </label>
      <div className="filter-note">
        <Heart size={22} strokeWidth={1.3} />
        <h3>{t("Chosen with love.")}</h3>
        <p>{t("Soft little things for the moments that matter.")}</p>
      </div>
    </div>
  );
  if (category && !routeCategory) return <NotFound />;
  return (
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">{t("Home")}</Link>
        <ChevronRight size={12} />
        <span>{t(routeCategory || "Shop")}</span>
      </div>
      {routeCategory === "Boys" || routeCategory === "Girls" || routeCategory === "Unisex" ? (
        <CategoryHero key={routeCategory} category={routeCategory} count={products.filter((product) => matchesCategory(product, routeCategory)).length} />
      ) : <div className={`shop-heading ${routeCategory?.toLowerCase() || ""}`}>
        <div>
          <span className="eyebrow">{t("Made for little moments")}</span>
          <h1>
            {routeCategory
              ? language === "ar" ? `${arabicCategoryHeading[routeCategory]}.` : `${routeCategory === "Maternity" ? "For mama" : routeCategory === "Toys" ? "A little playtime" : routeCategory === "Outlet" ? "Like New little finds" : routeCategory === "Sale" ? "Sale" : `Little ${routeCategory.toLowerCase()}`}.`
              : sale
                ? t("Lovely little offers.")
                : t("All the little things.")}
          </h1>
          <p>
            {routeCategory
              ? t(copy[routeCategory])
              : sale
                ? t("A little treat for them. A lovely price for you.")
                : t("Soft essentials, sweet details, and new favorites to fall for.")}
          </p>
          {routeCategory === "Outlet" && (
            <div className="outlet-note" role="note"><strong>{t("Outlet means Like New.")}</strong> {t("These are pre-owned, second-hand items in excellent condition, offered at reduced prices so more little favorites can find a home.")}</div>
          )}
        </div>
        {routeCategory ? <CategoryScene category={routeCategory} /> : <span className="heading-heart"><Heart size={58} strokeWidth={1} /></span>}
      </div>}
      <div className="shop-layout" id="category-products" tabIndex={-1}>
        <aside className="desktop-filters" aria-label={t("Product filters")}>
          {filters}
        </aside>
        <div className="shop-results">
          {(orderedSizes.length > 0 || size) && <section className="shop-size-picker" aria-label={t("Shop by size")}>
            <div>
              <label htmlFor="shopping-size">{t("Shop by size")}</label>
              <p>{t("Choose a size to see only matching pieces.")}</p>
            </div>
            <select id="shopping-size" value={size} onChange={(event) => updateParam("size", event.target.value)}>
              <option value="">{t("All sizes")}</option>
              {orderedSizes.map((option) => <option key={option} value={option}>{t(option)}</option>)}
            </select>
            {size && <button type="button" className="btn btn-outline btn-small" onClick={() => updateParam("size", "")}>
              {t("Clear size")} <X size={16} aria-hidden="true" />
            </button>}
          </section>}
          <div className="shop-toolbar">
            <div className="listing-search">
              <Search size={18} />
              <input
                aria-label={t("Search the collection")}
                placeholder={t("Find something lovely...")}
                value={query}
                onChange={(e) => updateParam("q", e.target.value)}
                list="product-suggestions"
              />
              {query && (
                <button
                  aria-label={t("Clear search")}
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
                      `${p.name} ${t(p.name)}`.toLowerCase().includes(query.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((p) => <option key={p.id} value={t(p.name)} />)}
              </datalist>
            </div>
            <select
              aria-label={t("Sort products")}
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
            >
              <option value="featured">{t("Featured")}</option>
              <option value="newest">{t("Newest first")}</option>
              <option value="price-asc">{t("Price: low to high")}</option>
              <option value="price-desc">{t("Price: high to low")}</option>
            </select>
          </div>
          <div className="results-line">
            <p role="status">
              {language === "ar" ? localizedCount(result.length, "product", language) : <>{result.length} little {result.length === 1 ? "favorite" : "favorites"}</>}
            </p>
            <button
              className="mobile-filter btn btn-outline btn-small"
              onClick={() => setMobile(true)}
            >
              <SlidersHorizontal size={15} /> {t("Filters")}{" "}
              {filterCount > 0 && `(${filterCount})`}
            </button>
          </div>
          {result.length ? (
            <div className="shop-grid">
              {result.map((p) => (
                <ProductCard key={`${p.id}:${size}`} product={p} selectedSize={size} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={40} />
              <h2>{t("No little matches just yet.")}</h2>
              <p>{t("Try a different size, color, or search.")}</p>
              <button className="btn btn-blue" onClick={reset}>
                {t("Clear filters")}
              </button>
            </div>
          )}
        </div>
      </div>
      <Modal
        open={mobile}
        onClose={() => setMobile(false)}
        title={t("Find your favorites")}
        drawer
      >
        {mobile && filters}
        <button
          className="btn btn-blue filter-apply"
          onClick={() => setMobile(false)}
        >
          {language === "ar" ? `عرض النتائج (${result.length})` : <>{t("Show")} {result.length} {t("favorites")}</>} <ArrowRight size={16} />
        </button>
      </Modal>
    </div>
  );
}
export function Wishlist() {
  const { language, t } = useLocale();
  const { wishlist } = useStore();
  const saved = products.filter((p) => wishlist.includes(p.id));
  return (
    <div className="page-width">
      <div className="page-heading">
        <span className="eyebrow">{t("Kept close to your heart")}</span>
        <h1>{t("Your little wishlist.")}</h1>
        <p>
          {saved.length
            ? language === "ar" ? `${localizedCount(saved.length, "product", language)} في قائمة المفضلة.` : `${saved.length} lovely ${saved.length === 1 ? "thing" : "things"}, saved for later.`
            : t("Some things are too lovely to forget.")}
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
          <h2>{t("A little room for love.")}</h2>
          <p>{t("Tap a heart on anything you love. We’ll keep it here.")}</p>
          <Link className="btn btn-pink" to="/shop">
            {t("Find a favorite")} <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
export function NotFound() {
  const { t } = useLocale();
  return (
    <div className="page-width empty-state">
      <span className="eyebrow">{t("404 · A little detour")}</span>
      <h1>{t("This little page wandered off.")}</h1>
      <p>{t("Let’s get you back to something lovely.")}</p>
      <Link to="/" className="btn btn-blue">
        {t("Back home")} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
