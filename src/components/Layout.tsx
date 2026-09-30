import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Instagram,
  Mail,
  Truck,
  ArrowRight,
  Facebook,
  Youtube,
} from "lucide-react";
import { useStore } from "../state/Store";
import { products, money } from "../data/products";
import { ProductImage } from "./ProductCard";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Boys and Girlz home">
      <img className="brand-logo-image" src="/assets/boys-girlz-logo.jpg" alt="Boys & Girlz" />
    </Link>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
}) {
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
      className={`modal ${drawer ? "drawer" : ""}`}
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
          aria-label={`Close ${title}`}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Header() {
  const { count, wishlist, setCartOpen } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMobile(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);
  const results = products
    .filter((p) =>
      `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
  const mobileNav = (
    <>
      <NavLink to="/" end>Home</NavLink>
      <Link to="/shop?sort=newest">New In</Link>
      <NavLink to="/category/boys">Boys</NavLink>
      <NavLink to="/category/girls">Girls</NavLink>
      <NavLink to="/category/unisex">Baby & Unisex</NavLink>
      <NavLink to="/category/accessories">Accessories</NavLink>
      <NavLink to="/category/maternity">Maternity</NavLink>
      <NavLink to="/category/toys">Toys</NavLink>
      <NavLink to="/category/outlet">Outlet · Like New</NavLink>
      <NavLink to="/about">About us</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </>
  );
  return (
    <>
      <div className="announcement">
        <span className="announcement-main"><Truck size={14} aria-hidden="true" /><strong>FREE delivery</strong><span className="announcement-long">all over Lebanon on orders over $99</span><span className="announcement-short">in Lebanon on $99+ orders</span></span>
        <span className="announcement-divider" aria-hidden="true" />
        <span className="announcement-cod"><Heart size={12} aria-hidden="true" /> Cash on Delivery available</span>
      </div>
      <header className="site-header">
        <div className="nav-inner page-width">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link to="/shop?sort=newest">New In</Link>
            <NavLink to="/category/boys">Boys</NavLink>
            <NavLink to="/category/girls">Girls</NavLink>
            <NavLink to="/category/unisex">Baby</NavLink>
            <NavLink className="nav-sale" to="/category/outlet">Sale</NavLink>
            <details className="nav-more"><summary>More</summary><div>
              <Link to="/category/accessories">Accessories</Link>
              <Link to="/category/maternity">Maternity</Link>
              <Link to="/category/toys">Toys</Link>
              <Link to="/shop">Shop all</Link>
            </div></details>
          </nav>
          <div className="nav-icons">
            <button
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
            >
              <Search size={21} />
            </button>
            <Link
              to="/wishlist"
              className="icon-button"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Heart size={22} />
              {wishlist.length > 0 && <span className="tiny-dot" />}
            </Link>
            <button
              id="cart-icon"
              className="icon-button bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag, ${count} items`}
            >
              <ShoppingBag size={21} />
              <span key={count} className="bag-count">
                {count}
              </span>
            </button>
            <button
              className="icon-button mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <Modal
        open={mobile}
        onClose={() => setMobile(false)}
        title="Explore a little"
        drawer
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {mobileNav}
        </nav>
      </Modal>
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Find a little favorite"
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
            aria-label="Search product name or category"
            placeholder="Try ‘romper’ or ‘toys’"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-button" aria-label="Search all products">
            <ArrowRight />
          </button>
        </form>
        <p className="small-muted">
          {query ? `${results.length} suggestions` : "A few little favorites"}
        </p>
        <div className="search-results">
          {results.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`}>
              <ProductImage product={p} />
              <div>
                <strong>{p.name}</strong>
                <span>
                  {p.category} · {money(p.price)}
                </span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!results.length && <p>No little matches yet. Try another word.</p>}
        </div>
      </Modal>
    </>
  );
}
export function Footer() {
  return (
    <footer className="page-width site-footer">
      <div className="footer-main">
        <Logo />
        <nav aria-label="Footer navigation">
          <Link to="/about">About Us</Link>
          <Link to="/help/sizing">Size Guide</Link>
          <Link to="/help/shipping">Help & FAQs</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <div className="footer-socials" aria-label="Social links">
          <a href="https://www.instagram.com/boysandgirlz/" target="_blank" rel="noreferrer" aria-label="Boys & Girlz on Instagram"><Instagram size={20} /></a>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={19} /></a>
          <a href="https://www.pinterest.com/" target="_blank" rel="noreferrer" aria-label="Pinterest"><span aria-hidden="true">p</span></a>
          <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={21} /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Boys & Girlz · A children's merchandising shop in Lebanon</span>
        <span><Truck size={14} /> Delivery within Lebanon only · <Mail size={14} /> support@boysandgirlz.com</span>
      </div>
    </footer>
  );
}
