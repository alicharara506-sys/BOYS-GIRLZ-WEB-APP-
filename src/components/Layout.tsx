import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  Baby,
  ChevronDown,
  Gem,
  HandHeart,
  Percent,
  Recycle,
  Shirt,
  Sparkles,
  ToyBrick,
} from "lucide-react";
import { useStore } from "../state/Store";
import { categories, matchesCategory, products, money, type Category } from "../data/products";
import { ProductImage } from "./ProductCard";
import { useLocale } from "../i18n/Locale";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Boys and Girlz home">
      <img className="brand-logo-image" src="/assets/boys-girlz-logo.webp" alt="Boys & Girlz" width="720" height="241" />
    </Link>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
  className?: string;
}) {
  const { language } = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
    if (open) {
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = old;
      };
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${drawer ? "drawer" : ""} ${className}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={language === "ar" ? `إغلاق ${title}` : `Close ${title}`}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
// Wraps every match of the search in a highlight.
function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part);
}

// The shop's categories for the header menu: an icon and a tint for each.
const shopMenu: { category: Category; Icon: typeof Shirt; tint: string }[] = [
  { category: "Boys", Icon: Shirt, tint: "#00b3fc" },
  { category: "Girls", Icon: Sparkles, tint: "#fc538e" },
  { category: "Unisex", Icon: Baby, tint: "#9b7be0" },
  { category: "Accessories", Icon: Gem, tint: "#e7a400" },
  { category: "Maternity", Icon: HandHeart, tint: "#f07a9a" },
  { category: "Toys", Icon: ToyBrick, tint: "#2f9e6a" },
  { category: "Outlet", Icon: Recycle, tint: "#0898d6" },
  { category: "Sale", Icon: Percent, tint: "#fc538e" },
];
const menuCounts = Object.fromEntries(categories.map((c) => [c, products.filter((p) => matchesCategory(p, c)).length]));

export function Header() {
  const { language, setLanguage, t } = useLocale();
  const { count, wishlist, setCartOpen } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  // ⌘K / Ctrl+K, or / outside a text field, opens search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if ((event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const moreRef = useRef<HTMLDetailsElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  // Flush at the top of the page, a floating bar once it scrolls. It hides on the way down and
  // returns on the way up, and its bottom line fills with how far down the page the reader is.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const room = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 12);
      let hide = hiddenRef.current;
      if (y < 120) hide = false;
      else if (y > last + 6) hide = true;
      else if (y < last - 6) hide = false;
      hiddenRef.current = hide;
      setHidden(hide);
      document.documentElement.style.setProperty("--hdr-offset", hide ? "0px" : y > 12 ? "92px" : "80px");
      last = y;
      progressRef.current?.style.setProperty("--progress", String(room > 0 ? Math.min(1, y / room) : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  // A white pill glides to whichever nav link is under the pointer.
  const movePill = (target: EventTarget | null) => {
    const item = target instanceof Element ? target.closest("a, summary") : null;
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!item || !nav || !pill || !nav.contains(item) || item.closest(".nav-more > div")) return;
    const box = item.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    pill.style.setProperty("--pill-x", `${box.left - navBox.left}px`);
    pill.style.setProperty("--pill-w", `${box.width}px`);
    pill.classList.add("is-visible");
  };
  const hidePill = () => pillRef.current?.classList.remove("is-visible");
  useEffect(() => {
    setMobile(false);
    setSearchOpen(false);
    if (moreRef.current) moreRef.current.open = false;
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onOutside = (event: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) moreRef.current.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && moreRef.current) moreRef.current.open = false;
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);
  // The Shop menu opens on hover after a moment of intent and closes after a short grace.
  const hoverTimer = useRef(0);
  const hoverOpen = (open: boolean) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => { if (moreRef.current) moreRef.current.open = open; }, open ? 120 : 220);
  };
  const results = products
    .filter((p) =>
      `${p.name} ${p.category} ${t(p.name)} ${t(p.category)}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
  const mobileNav = (
    <>
      <NavLink to="/" end>{t("Home")}</NavLink>
      <details className="mobile-shop" open>
        <summary>{t("Shop")} <ChevronDown size={18} aria-hidden="true" /></summary>
        <div>
          {shopMenu.filter(({ category }) => category !== "Sale").map(({ category }) => <NavLink key={category} to={`/category/${category.toLowerCase()}`}>{t(category)}</NavLink>)}
          <NavLink to="/shop" end>{t("Shop all")}</NavLink>
        </div>
      </details>
      <Link to="/shop?sort=newest">{t("New In")}</Link>
      <NavLink to="/category/sale">{t("Sale")}</NavLink>
      <NavLink to="/about">{t("About us")}</NavLink>
      <NavLink to="/contact">{t("Contact")}</NavLink>
    </>
  );
  return (
    <>
      <header className={`hdr ${scrolled ? "is-scrolled" : ""} ${hidden ? "is-hidden" : ""}`} onFocusCapture={() => setHidden(false)}>
        <div className="hdr-shell">
          <span className="hdr-ring" aria-hidden="true" />
          <span className="hdr-line" aria-hidden="true">
            <span className="hdr-beam" />
            <span className="hdr-progress" ref={progressRef} />
          </span>
          <div className="nav-inner hdr-inner page-width">
            <Logo />
            <nav className="desktop-nav" aria-label={t("Main navigation")} ref={navRef} onPointerOver={(event) => movePill(event.target)} onPointerLeave={hidePill}>
              <span className="hdr-pill" ref={pillRef} aria-hidden="true" />
              <details ref={moreRef} className="nav-more nav-shop" onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen(true)} onPointerLeave={(e) => e.pointerType === "mouse" && hoverOpen(false)}>
                <summary>{t("Shop")} <ChevronDown size={15} aria-hidden="true" /></summary>
                <div className="shop-menu">
                  <div className="shop-menu-grid">
                    {shopMenu.map(({ category, Icon, tint }) => <Link key={category} to={`/category/${category.toLowerCase()}`} style={{ "--tint": tint } as CSSProperties}>
                      <span className="shop-menu-icon" aria-hidden="true"><Icon size={17} /></span>
                      <span className="shop-menu-name">{t(category)}</span>
                      <span className="shop-menu-count">{menuCounts[category]}</span>
                    </Link>)}
                  </div>
                  <Link to="/shop" className="shop-menu-all">{t("Shop all")} <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </details>
              <Link to="/shop?sort=newest">{t("New In")}</Link>
              <NavLink className="nav-sale" to="/category/sale">{t("Sale")}</NavLink>
              <NavLink to="/about">{t("About us")}</NavLink>
              <NavLink to="/contact">{t("Contact")}</NavLink>
            </nav>
            <div className="nav-icons">
              <button className="language-switch" type="button" onClick={() => setLanguage(language === "en" ? "ar" : "en")} lang={language === "en" ? "ar" : "en"} aria-label={language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}>
                {language === "en" ? "العربية" : "English"}
              </button>
              <button
                className="icon-button"
                onClick={() => setSearchOpen(true)}
                aria-label={t("Search products")}
              >
                <Search size={21} />
              </button>
              <Link
                to="/wishlist"
                className="icon-button"
                aria-label={language === "ar" ? `المفضّلة، ${wishlist.length} منتجات` : `Wishlist, ${wishlist.length} items`}
              >
                <Heart size={22} />
                {wishlist.length > 0 && <span className="tiny-dot" />}
              </Link>
              <button
                id="cart-icon"
                className="icon-button bag-button"
                onClick={() => setCartOpen(true)}
                aria-label={language === "ar" ? `سلّة التسوّق، ${count} منتجات` : `Shopping bag, ${count} items`}
              >
                <ShoppingBag size={21} />
                <span key={count} className="bag-count">
                  {count}
                </span>
              </button>
              <button
                className="icon-button mobile-menu-button"
                aria-label={t("Open navigation")}
                onClick={() => setMobile(true)}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <Modal
        open={mobile}
        onClose={() => setMobile(false)}
        title={t("Explore a little")}
        drawer
      >
        <nav className="mobile-nav" aria-label={t("Mobile navigation")}>
          {mobileNav}
        </nav>
      </Modal>
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("Find a little favorite")}
        className="search-palette"
      >
        <form
          className="search-form palette-field"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
            const chosen = query ? results[activeResult] : undefined;
            navigate(chosen ? `/product/${chosen.id}` : `/shop?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={20} aria-hidden="true" />
          <input
            autoComplete="off"
            aria-label={t("Search product name or category")}
            placeholder={t("Try ‘romper’ or ‘toys’")}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveResult(0); }}
            onKeyDown={(e) => {
              if (!results.length) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveResult((i) => (i + 1) % results.length); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActiveResult((i) => (i - 1 + results.length) % results.length); }
            }}
            aria-activedescendant={query && results.length ? `search-result-${activeResult}` : undefined}
            autoFocus
          />
          <button type="button" className="palette-esc" aria-label={t("Close")} onClick={() => setSearchOpen(false)}><kbd>Esc</kbd></button>
          <button className="icon-button palette-go" aria-label={t("Search all products")}>
            <ArrowRight size={18} />
          </button>
        </form>
        {!query && <div className="palette-chips">
          {shopMenu.slice(0, 6).map(({ category, Icon, tint }) => <Link key={category} to={`/category/${category.toLowerCase()}`} style={{ "--tint": tint } as CSSProperties} onClick={() => setSearchOpen(false)}>
            <Icon size={14} aria-hidden="true" /> {t(category)}
          </Link>)}
        </div>}
        <p className="small-muted palette-count" aria-live="polite">
          {query ? language === "ar" ? `${results.length} اقتراحات` : `${results.length} suggestions` : t("A few little favorites")}
        </p>
        <div className="search-results palette-results" role="listbox" aria-label={t("Search products")}>
          {results.map((p, index) => (
            <Link key={`${query}-${p.id}`} id={`search-result-${index}`} role="option" aria-selected={query ? index === activeResult : undefined}
              className={query && index === activeResult ? "is-active" : ""} style={{ "--i": index } as CSSProperties}
              to={`/product/${p.id}`} onPointerEnter={() => setActiveResult(index)}>
              <ProductImage product={p} />
              <div>
                <strong>{highlightMatch(t(p.name), query)}</strong>
                <span><em>{t(p.category)}</em> {money(p.price)}</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!results.length && <div className="palette-empty">
            <span className="shop-empty-mascots" aria-hidden="true"><span className="home-mascot home-mascot-boy" /><span className="home-mascot home-mascot-girl" /></span>
            <p>{t("No little matches yet. Try another word.")}</p>
            <Link className="glass-button" to={`/shop?q=${encodeURIComponent(query)}`} onClick={() => setSearchOpen(false)}>{t("Search all products")} <ArrowRight size={15} /></Link>
          </div>}
        </div>
        <div className="palette-keys">
          <span>
            <button type="button" aria-label={language === "ar" ? "النتيجة السابقة" : "Previous result"} disabled={!query || !results.length} onClick={() => setActiveResult((i) => (i - 1 + results.length) % results.length)}><kbd>↑</kbd></button>
            <button type="button" aria-label={language === "ar" ? "النتيجة التالية" : "Next result"} disabled={!query || !results.length} onClick={() => setActiveResult((i) => (i + 1) % results.length)}><kbd>↓</kbd></button>
          </span>
          <button type="button" aria-label={language === "ar" ? "فتح النتيجة" : "Open result"} disabled={!query || !results.length} onClick={() => { setSearchOpen(false); navigate(`/product/${results[activeResult].id}`); }}><kbd>↵</kbd></button>
          <button type="button" aria-label={t("Close")} onClick={() => setSearchOpen(false)}><kbd>Esc</kbd></button>
        </div>
      </Modal>
    </>
  );
}
