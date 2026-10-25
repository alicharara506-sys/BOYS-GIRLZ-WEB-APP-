import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Heart,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  categories,
  colorHex,
  money,
  products,
  matchesCategory,
  type Category,
} from "../data/products";
import ProductCard, { ProductImage } from "../components/ProductCard";
import { Modal } from "../components/Layout";
import CategoryScene from "../components/CategoryScene";
import { useStore } from "../state/Store";
import { useLocale } from "../i18n/Locale";
import { approvedBrands, brandSlug } from "../data/brands";
import { AnimatedLine, SplitTitle } from "../components/HeroSection";
import { useReducedMotion } from "../hooks/useExperience";
import { useCountUp } from "../hooks/useCountUp";

gsap.registerPlugin(ScrollTrigger);
const priceCeiling = Math.ceil(Math.max(...products.map((product) => product.price)) / 5) * 5;
function GenderIcon({ kind }: { kind: "boys" | "girls" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="5" />
    {kind === "boys" ? <><path d="m13.5 6.5 7-7M16 0h5v5" transform="translate(-1 2)" /></> : <path d="M10 15v7m-4-3.5h8" />}
  </svg>;
}
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
const sortOptions = [
  ["featured", "Featured"],
  ["newest", "Newest first"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

// A filter group that folds open and closed smoothly.
function FilterSection({ title, extra, children, defaultOpen = true }: { title: string; extra?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <fieldset className={`filter-section ${open ? "is-open" : ""}`}>
    <legend className="sr-only">{title}</legend>
    <div className="filter-section-head">
      <button type="button" className="filter-section-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {title} <ChevronDown size={16} aria-hidden="true" />
      </button>
      {extra}
    </div>
    <div className="filter-section-body"><div>{children}</div></div>
  </fieldset>;
}

// Sorting as a small pill that opens a glass menu.
function SortMenu({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const current = sortOptions.find(([key]) => key === value) || sortOptions[0];
  return <div className={`sort-menu ${open ? "is-open" : ""}`} ref={ref}>
    <button type="button" className="sort-trigger" aria-haspopup="true" aria-expanded={open} aria-label={t("Sort products")} onClick={() => setOpen((v) => !v)}>
      <ArrowUpDown size={15} aria-hidden="true" /> <span>{t(current[1])}</span> <ChevronDown size={15} aria-hidden="true" />
    </button>
    {open && <div className="sort-options" role="menu">
      {sortOptions.map(([key, label]) => <button key={key} type="button" role="menuitemradio" aria-checked={key === value} className={key === value ? "active" : ""}
        onClick={() => { onChange(key); setOpen(false); }}>
        {t(label)} {key === value && <Check size={15} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}

export default function Shop() {
  const { language, t } = useLocale();
  const { pathname } = useLocation();
  const category = pathname.match(/^\/category\/([^/]+)/)?.[1];
  const [params, setParams] = useSearchParams();
  const routeCategory = categories.find((c) => c.toLowerCase() === category);
  const [mobile, setMobile] = useState(false);
  const reduceMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const selected = (params.get("category") || "").split(",").filter((value): value is Category => categories.includes(value as Category));
  const max = Math.min(priceCeiling, Math.max(0, Number(params.get("max") || priceCeiling)));
  const size = params.get("size") || "";
  const color = params.get("color") || "";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "featured";
  const sale = params.get("sale") === "true";
  const brand = approvedBrands.find((name) => brandSlug(name) === params.get("brand")) || "";
  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    // Filtering updates the address in place: no new history entry, no jump to the top.
    setParams(next, { replace: true, preventScrollReset: true });
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
        (!brand || p.brand === brand) &&
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
    setParams({}, { replace: true, preventScrollReset: true });
  };
  const filterCount =
    selected.length +
    Number(max < priceCeiling) +
    Number(!!size) +
    Number(!!color) +
    Number(sale) +
    Number(!!brand);
  // Switching category keeps every other filter (except the old multi-category one).
  const chipParams = new URLSearchParams(params);
  chipParams.delete("category");
  const chipSearch = chipParams.toString() ? `?${chipParams}` : "";
  const priceFill = ((max - 10) / (priceCeiling - 10)) * 100;
  const filters = (
    <div className="filter-content">
      <div className="filter-title">
        <h3>{t("A little more you")}</h3>
        <button onClick={reset}>{t("Reset")}</button>
      </div>
      <FilterSection title={t("Price range")}>
        <label htmlFor="max-price">{t("Up to")} <bdi>${max}</bdi></label>
        <div className="price-slider" style={{ "--fill": `${priceFill}%` } as CSSProperties}>
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
          <span className="price-bubble" aria-hidden="true"><bdi>${max}</bdi></span>
        </div>
        <div className="range-labels">
          <span>$10</span>
          <span>${priceCeiling}</span>
        </div>
      </FilterSection>
      <FilterSection title={t("Size")}>
        <div className="size-chips" role="radiogroup" aria-label={t("Filter by size")}>
          {["", ...new Set(products.flatMap((p) => p.sizes))].map((option) => (
            <button key={option || "all"} type="button" role="radio" aria-checked={size === option}
              className={size === option ? "active" : ""} onClick={() => updateParam("size", option)}>
              {t(option || "All sizes")}
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title={t("Color")} extra={color && (
        <button className="clear-color" onClick={() => updateParam("color", "")}>
          {t("Clear")}
        </button>
      )}>
        <div className="filter-colors">
          {Object.entries(colorHex).map(([c, hex]) => (
            <button
              key={c}
              className={color === c ? "selected" : ""}
              onClick={() => updateParam("color", color === c ? "" : c)}
              aria-label={language === "ar" ? `تصفية اللون ${t(c)}` : `Filter ${c}`}
              aria-pressed={color === c}
              style={{ "--swatch": hex } as CSSProperties}
            >
              <i />
              <span>{t(c)}</span>
            </button>
          ))}
        </div>
      </FilterSection>
      <label className="check-label sale-check">
        <input
          type="checkbox"
          checked={sale}
          onChange={() => updateParam("sale", sale ? "" : "true")}
        />
        {t("Little offers only")}
      </label>
      <div className="filter-note">
        <span className="filter-note-heart" aria-hidden="true"><Heart size={22} strokeWidth={1.6} /></span>
        <h3>{t("Chosen with love.")}</h3>
        <p>{t("Soft little things for the moments that matter.")}</p>
      </div>
    </div>
  );
  // Every active filter as a chip that removes it.
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...selected.map((c) => ({ key: `c-${c}`, label: t(c), clear: () => toggleCategory(c) })),
    ...(max < priceCeiling ? [{ key: "max", label: `${t("Up to")} $${max}`, clear: () => updateParam("max", "") }] : []),
    ...(size ? [{ key: "size", label: t(size), clear: () => updateParam("size", "") }] : []),
    ...(color ? [{ key: "color", label: t(color), clear: () => updateParam("color", "") }] : []),
    ...(sale ? [{ key: "sale", label: t("Little offers only"), clear: () => updateParam("sale", "") }] : []),
    ...(brand ? [{ key: "brand", label: brand, clear: () => updateParam("brand", "") }] : []),
    ...(query ? [{ key: "q", label: `“${query}”`, clear: () => updateParam("q", "") }] : []),
  ];
  const shownCount = Math.round(useCountUp(result.length));
  const resultKey = result.map((p) => p.id).join(",");
  // The cards rise in as they scroll into view, and again whenever the results change.
  const firstRender = useRef(true);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduceMotion) return;
    const cards = Array.from(grid.children) as HTMLElement[];
    if (firstRender.current) {
      firstRender.current = false;
      const triggers = ScrollTrigger.batch(cards, {
        start: "top 92%", once: true,
        onEnter: (batch) => gsap.fromTo(batch, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.07, clearProps: "transform,opacity" }),
      });
      gsap.set(cards.filter((card) => card.getBoundingClientRect().top > window.innerHeight * 0.92), { opacity: 0 });
      return () => triggers.forEach((trigger) => trigger.kill());
    }
    const tween = gsap.fromTo(cards.slice(0, 12), { y: 26, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.4)", stagger: 0.045, clearProps: "transform,opacity" });
    return () => { tween.kill(); };
  }, [resultKey, reduceMotion]);
  const title = brand
    ? brand
    : routeCategory
      ? language === "ar" ? `${arabicCategoryHeading[routeCategory]}.` : `${routeCategory === "Maternity" ? "For mama" : routeCategory === "Toys" ? "A little playtime" : routeCategory === "Outlet" ? "Like New little finds" : routeCategory === "Sale" ? "Sale" : `Little ${routeCategory.toLowerCase()}`}.`
      : sale
        ? t("Lovely little offers.")
        : t("All the little things.");
  if (category && !routeCategory) return <NotFound />;
  return (
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">{t("Home")}</Link>
        <ChevronRight size={12} />
        <span>{t(routeCategory || "Shop")}</span>
      </div>
      <div className={`shop-hero ${routeCategory?.toLowerCase() || ""}`}>
        <div className="shop-hero-fields" aria-hidden="true">
          <span className="shop-hero-field shop-hero-field-pink" />
          <span className="shop-hero-field shop-hero-field-blue" />
        </div>
        <div className="shop-hero-copy">
          <div className="section-eyebrow">
            <span aria-hidden="true" />
            <span className="section-eyebrow-text">{t("Made for little moments")}</span>
            <span aria-hidden="true" />
          </div>
          <h1 key={title}>
            <span className="sr-only">{title}</span>
            <span aria-hidden="true"><AnimatedLine text={title} start={0} byWord={language === "ar"} /></span>
          </h1>
          {routeCategory === "Boys" && <span className="gender-mark"><GenderIcon kind="boys" /> <span>{t("Little Boys")}</span></span>}
          {routeCategory === "Girls" && <span className="gender-mark"><GenderIcon kind="girls" /> <span>{t("Little Girls")}</span></span>}
          <p>
            {brand
              ? t("Brands you'll find here")
              : routeCategory
              ? t(copy[routeCategory])
              : sale
                ? t("A little treat for them. A lovely price for you.")
                : t("Soft essentials, sweet details, and new favorites to fall for.")}
          </p>
          {routeCategory === "Outlet" && (
            <div className="outlet-note" role="note"><strong>{t("Outlet means Like New.")}</strong> {t("These are pre-owned, second-hand items in excellent condition, offered at reduced prices so more little favorites can find a home.")}</div>
          )}
        </div>
        {routeCategory && <CategoryScene category={routeCategory} />}
      </div>
      <nav className="shop-cats" aria-label={t("Shop for")}>
        <Link to={{ pathname: "/shop", search: chipSearch }} preventScrollReset data-tone="all" className={!routeCategory && !selected.length ? "active tone-pill" : ""} aria-current={!routeCategory && !selected.length ? "page" : undefined}>{t("All")} <span>{products.length}</span></Link>
        {categories.map((c) => <Link key={c} to={{ pathname: `/category/${c.toLowerCase()}`, search: chipSearch }} preventScrollReset data-tone={c === "Boys" ? "boys" : c === "Girls" ? "girls" : c === "Unisex" ? "unisex" : "all"} className={routeCategory === c ? "active tone-pill" : ""} aria-current={routeCategory === c ? "page" : undefined}>
          {routeCategory === c && <span className="tone-burst" aria-hidden="true" />}{t(c)} <span>{products.filter((p) => matchesCategory(p, c)).length}</span>
        </Link>)}
      </nav>
      <div className="shop-layout">
        <aside className="desktop-filters" aria-label={t("Product filters")}>
          {filters}
        </aside>
        <div className="shop-results">
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
            <SortMenu value={sort} onChange={(value) => updateParam("sort", value === "featured" ? "" : value)} />
          </div>
          <div className="results-line">
            <p role="status">
              {language === "ar" ? <><b>{shownCount}</b> {t("favorites")}</> : <><b>{shownCount}</b> little {result.length === 1 ? "favorite" : "favorites"}</>}
            </p>
            <button
              className="mobile-filter btn btn-outline btn-small"
              onClick={() => setMobile(true)}
            >
              <SlidersHorizontal size={15} /> {t("Filters")}{" "}
              {filterCount > 0 && `(${filterCount})`}
            </button>
          </div>
          {chips.length > 0 && <div className="active-chips">
            {chips.map((chip) => <button key={chip.key} type="button" className="active-chip" onClick={chip.clear} aria-label={`${t("Clear")}: ${chip.label}`}>
              {chip.label} <X size={13} aria-hidden="true" />
            </button>)}
            <button type="button" className="active-clear" onClick={reset}>{t("Clear all")}</button>
          </div>}
          {result.length ? (
            <div className="shop-grid" ref={gridRef}>
              {result.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state shop-empty">
              <span className="shop-empty-mascots" aria-hidden="true">
                <span className="home-mascot home-mascot-boy" />
                <span className="home-mascot home-mascot-girl" />
              </span>
              <h2>{t("No little matches just yet.")}</h2>
              <p>{t("Try a different size, color, or search.")}</p>
              <button className="bh-cta shop-empty-cta" onClick={reset}>
                <span className="bh-cta-shine" aria-hidden="true" />
                <span className="bh-cta-label">{t("Clear filters")}</span>
                <span className="bh-cta-arrow" aria-hidden="true"><X size={18} /></span>
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
        className="filter-sheet"
      >
        {mobile && filters}
        <button
          className="btn btn-blue filter-apply"
          onClick={() => setMobile(false)}
        >
          {t("Show")} {result.length} {t("favorites")} <ArrowRight size={16} />
        </button>
      </Modal>
    </div>
  );
}
// The wishlist: a springing title over drifting light, the saved pieces rising in one after
// another, and an empty state with the mascots and floating hearts.
export function Wishlist() {
  const { language, t } = useLocale();
  const { wishlist } = useStore();
  const reduceMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const saved = products.filter((p) => wishlist.includes(p.id));
  const total = saved.reduce((sum, p) => sum + p.price, 0);
  const shownTotal = useCountUp(total);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduceMotion) return;
    const tween = gsap.fromTo(grid.children, { y: 40, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .7, ease: "back.out(1.4)", stagger: .07, clearProps: "transform,opacity" });
    return () => { tween.kill(); };
  }, [reduceMotion]);
  return (
    <div className="wish-page">
      <section className="contact-hero page-width">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Heart size={13} /></span>{t("Kept close to your heart")}</span>
        <h1 className="contact-title"><SplitTitle text={t("Your little wishlist.")} byWord={language === "ar"} /></h1>
        <p className="contact-lead">
          {saved.length
            ? language === "ar" ? `${saved.length} منتجات محفوظة لوقت لاحق.` : `${saved.length} lovely ${saved.length === 1 ? "thing" : "things"}, saved for later.`
            : t("Some things are too lovely to forget.")}
        </p>
      </section>
      <div className="page-width">
        {saved.length ? (
          <>
            <div className="wish-bar">
              <span className="wish-bar-hearts" aria-hidden="true">{saved.slice(0, 4).map((p) => <span key={p.id}><ProductImageThumb id={p.id} /></span>)}</span>
              <span className="wish-bar-copy"><b>{saved.length}</b> <Heart size={14} aria-hidden="true" /> <span>·</span> <b>{money(shownTotal)}</b></span>
              <Link className="glass-button" to="/shop">{t("Find a favorite")} <ArrowRight size={15} /></Link>
            </div>
            <div className="wishlist-grid" ref={gridRef}>
              {saved.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state wish-empty">
            <span className="wish-empty-art" aria-hidden="true">
              <span className="home-mascot home-mascot-boy" />
              <span className="wish-empty-heart"><Heart size={42} strokeWidth={1.6} /></span>
              <span className="home-mascot home-mascot-girl" />
              {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ "--i": i } as CSSProperties}>♥</i>)}
            </span>
            <h2>{t("A little room for love.")}</h2>
            <p>{t("Tap a heart on anything you love. We’ll keep it here.")}</p>
            <Link className="bh-cta" to="/shop">
              <span className="bh-cta-shine" aria-hidden="true" />
              <span className="bh-cta-label">{t("Find a favorite")}</span>
              <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
function ProductImageThumb({ id }: { id: string }) {
  const product = products.find((p) => p.id === id);
  return product ? <ProductImage product={product} /> : null;
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
