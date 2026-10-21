import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Instagram,
  Truck,
  ArrowRight,
} from "lucide-react";
import { useStore } from "../state/Store";
import { products, money } from "../data/products";
import { ProductImage } from "./ProductCard";
import { localizedCount, useLocale } from "../i18n/Locale";
export function Logo() {
  const { t } = useLocale();
  return (
    <Link to="/" className="logo" aria-label={t("Boys and Girlz home")}>
      <img className="brand-logo-image" src="/assets/boys-girlz-logo.jpg" alt="Boys & Girlz" width={1600} height={800} />
    </Link>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
  id,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
  id?: string;
}) {
  const { language } = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
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
  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const resize = () => ref.current?.style.setProperty("--dialog-viewport-height", `${viewport.height}px`);
    resize();
    viewport.addEventListener("resize", resize);
    return () => viewport.removeEventListener("resize", resize);
  }, [open]);
  return (
    <dialog
      ref={ref}
      id={id}
      className={`modal ${drawer ? "drawer" : ""}`}
      aria-label={title}
      onCancel={onClose}
      onPointerDown={(event) => {
        if (drawer && event.pointerType === "touch" && (event.target as Element).closest(".modal-heading") && !(event.target as Element).closest("button")) swipe.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = swipe.current;
        swipe.current = null;
        if (start && (event.clientX - start.x) * (language === "ar" ? -1 : 1) > 72 && Math.abs(event.clientY - start.y) < 48) onClose();
      }}
      onPointerCancel={() => { swipe.current = null; }}
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
export function Header() {
  const { language, setLanguage, t } = useLocale();
  const { count, wishlist, setCartOpen } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const moreRef = useRef<HTMLDetailsElement>(null);
  const location = useLocation();
  const previousRoute = useRef(`${location.pathname}${location.search}`);
  const navigate = useNavigate();
  useEffect(() => {
    const route = `${location.pathname}${location.search}`;
    if (previousRoute.current === route) return;
    previousRoute.current = route;
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
  const results = products
    .filter((p) =>
      `${p.name} ${p.category} ${t(p.name)} ${t(p.category)}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
  const mobileNav = (
    <>
      <NavLink to="/" end>{t("Home")}</NavLink>
      <Link to="/shop?sort=newest">{t("New In")}</Link>
      <NavLink to="/category/boys">{t("Boys")}</NavLink>
      <NavLink to="/category/girls">{t("Girls")}</NavLink>
      <NavLink to="/category/unisex">{t("Unisex")}</NavLink>
      <NavLink to="/category/accessories">{t("Accessories")}</NavLink>
      <NavLink to="/category/maternity">{t("Maternity")}</NavLink>
      <NavLink to="/category/toys">{t("Toys")}</NavLink>
      <NavLink to="/category/sale">{t("Sale")}</NavLink>
      <NavLink to="/category/outlet">{t("Outlet")}</NavLink>
      <NavLink to="/about">{t("About us")}</NavLink>
      <NavLink to="/contact">{t("Contact")}</NavLink>
    </>
  );
  return (
    <>
      <div className="announcement">
        <span className="announcement-main"><Truck size={14} aria-hidden="true" /><strong>{t("FREE delivery")}</strong><span className="announcement-long">{t("all over Lebanon on orders over $99")}</span><span className="announcement-short">{t("in Lebanon on $99+ orders")}</span></span>
        <span className="announcement-divider" aria-hidden="true" />
        <span className="announcement-cod"><Heart size={12} aria-hidden="true" /> {t("Cash on Delivery available")}</span>
      </div>
      <header className="site-header">
        <div className="nav-inner page-width">
          <Logo />
          <nav className="desktop-nav" aria-label={t("Main navigation")}>
            <Link to="/shop?sort=newest">{t("New In")}</Link>
            <NavLink to="/category/boys">{t("Boys")}</NavLink>
            <NavLink to="/category/girls">{t("Girls")}</NavLink>
            <NavLink to="/category/unisex">{t("Unisex")}</NavLink>
            <NavLink className="nav-sale" to="/category/sale">{t("Sale")}</NavLink>
            <details ref={moreRef} className="nav-more"><summary>{t("More")}</summary><div>
              <Link to="/category/accessories">{t("Accessories")}</Link>
              <Link to="/category/maternity">{t("Maternity")}</Link>
              <Link to="/category/toys">{t("Toys")}</Link>
              <Link to="/category/outlet">{t("Outlet")}</Link>
              <Link to="/shop">{t("Shop all")}</Link>
            </div></details>
          </nav>
          <div className="nav-icons">
            <button className="language-switch" type="button" onClick={() => setLanguage(language === "en" ? "ar" : "en")} lang={language === "en" ? "ar" : "en"} aria-label={language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}>
              {language === "en" ? "العربية" : "English"}
            </button>
            <div className="nav-actions">
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
              aria-label={language === "ar" ? `المفضّلة، ${localizedCount(wishlist.length, "product", language)}` : `Wishlist, ${wishlist.length} items`}
            >
              <Heart size={22} />
              {wishlist.length > 0 && <span className="tiny-dot" />}
            </Link>
            <button
              id="cart-icon"
              className="icon-button bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={language === "ar" ? `سلّة التسوّق، ${localizedCount(count, "product", language)}` : `Shopping bag, ${count} items`}
            >
              <ShoppingBag size={21} />
              <span key={count} className="bag-count">
                {count}
              </span>
            </button>
            <button
              className="icon-button mobile-menu-button"
              aria-label={t("Open navigation")}
              aria-expanded={mobile}
              aria-controls="mobile-navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            </div>
          </div>
        </div>
      </header>
      <Modal
        id="mobile-navigation"
        open={mobile}
        onClose={() => setMobile(false)}
        title={t("Explore a little")}
        drawer
      >
        <nav className="mobile-nav" aria-label={t("Mobile navigation")} onClick={(event) => {
          if ((event.target as Element).closest("a")) setMobile(false);
        }}>
          {mobileNav}
        </nav>
      </Modal>
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("Find a little favorite")}
      >
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
            navigate(`/shop?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={20} />
          <input
            autoComplete="off"
            aria-label={t("Search product name or category")}
            placeholder={t("Try ‘romper’ or ‘toys’")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-button" aria-label={t("Search all products")}>
            <ArrowRight />
          </button>
        </form>
        <p className="small-muted">
          {query ? localizedCount(results.length, "suggestion", language) : t("A few little favorites")}
        </p>
        <div className="search-results">
          {results.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`}>
              <ProductImage product={p} />
              <div>
                <strong>{t(p.name)}</strong>
                <span>
                  {t(p.category)} · {money(p.price)}
                </span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!results.length && <p>{t("No little matches yet. Try another word.")}</p>}
        </div>
      </Modal>
    </>
  );
}
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="page-width site-footer">
      <div className="footer-main">
        <nav aria-label={t("Footer navigation")}>
          <Link to="/about">{t("About Us")}</Link>
          <Link to="/help/sizing">{t("Size Guide")}</Link>
          <Link to="/faq">{t("Help & FAQs")}</Link>
          <Link to="/contact">{t("Contact")}</Link>
        </nav>
        <div className="footer-socials" aria-label="Social links">
          <a href="https://www.instagram.com/boysandgirlz/" target="_blank" rel="noreferrer" aria-label="Boys & Girlz on Instagram"><Instagram size={20} /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Boys & Girlz · {t("A children's shop in Lebanon")}</span>
        <span><Truck size={14} /> {t("Delivery within Lebanon only")} · <Link to="/contact">{t("Contact us")}</Link></span>
      </div>
    </footer>
  );
}
