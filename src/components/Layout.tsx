import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Instagram,
  Mail,
  Truck,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import { useStore } from "../state/Store";
import { products, money } from "../data/products";
import { ProductImage } from "./ProductCard";
import Newsletter from "./Newsletter";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Boys and Girlz home">
      <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 28v7c0 13 8 21 20 21s20-8 20-21v-7H41v7c0 7-3 11-9 11s-9-4-9-11v-7Z" />
        <circle cx="19" cy="17" r="6" />
        <path
          className="logo-spark"
          d="m45 8 2.7 5.3L53 16l-5.3 2.7L45 24l-2.7-5.3L37 16l5.3-2.7Z"
        />
      </svg>
      <span className="logo-type">
        <span>BOYS</span>
        <b>&</b>
        <span>GIRLZ</span>
      </span>
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
  const [account, setAccount] = useState(false);
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
  const nav = (
    <>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/shop">Shop</NavLink>
      <NavLink to="/category/outlet">Outlet</NavLink>
      <Link to="/shop?sort=newest">New arrivals</Link>
      <Link to="/#categories">Collections</Link>
      <NavLink to="/about">About us</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </>
  );
  return (
    <>
      <div className="announcement">
        <span>A little love, delivered.</span> Complimentary shipping on orders
        $75+ <Heart size={11} />
      </div>
      <header className="site-header">
        <div className="nav-inner page-width">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav}
          </nav>
          <div className="nav-icons">
            <button
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
            >
              <Search size={21} />
            </button>
            <button
              className="icon-button account-icon"
              aria-label="Your account"
              onClick={() => setAccount(true)}
            >
              <UserRound size={21} />
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
          {nav}
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
      <Modal
        open={account}
        onClose={() => setAccount(false)}
        title="Your little corner"
      >
        <div className="account-content">
          <UserRound size={38} strokeWidth={1.2} />
          <h3>Welcome to the family.</h3>
          <p>
            Your favorites and shopping bag are saved on this device, ready
            whenever you are.
          </p>
          <Link
            className="btn btn-blue"
            to="/wishlist"
            onClick={() => setAccount(false)}
          >
            Your wishlist <Heart size={17} />
          </Link>
          <p className="small-muted">
            You’re browsing our demo store. No account needed.
          </p>
        </div>
      </Modal>
    </>
  );
}
export function Footer() {
  return (
    <footer className="page-width site-footer">
      <div className="footer-main">
        <div>
          <Logo />
          <p>
            For their firsts.
            <br />
            And everything after.
          </p>
          <a
            className="social-link"
            href="https://www.instagram.com/boysandgirlz/"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={18} /> @boysandgirlz
          </a>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/shop">All the little things</Link>
          <Link to="/category/maternity">For mama</Link>
          <Link to="/category/toys">Playtime favorites</Link>
          <Link to="/category/outlet">Outlet · Like New</Link>
          <Link to="/about">Our story</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <Link to="/contact">Contact us</Link>
          <Link to="/help/shipping">Lebanon shipping</Link>
          <Link to="/help/returns">Returns & exchanges</Link>
          <Link to="/help/sizing">Size guide</Link>
        </div>
        <div className="footer-news">
          <h3>A little note from us</h3>
          <p>Lovely things, straight to your inbox.</p>
          <Newsletter compact />
        </div>
      </div>
      <div className="footer-trust">
        <a href="mailto:support@boysandgirlz.com">
          <Mail size={17} /> support@boysandgirlz.com
        </a>
        <span>
          <Truck size={18} /> Shipping within Lebanon only
        </span>
        <span>
          <LockKeyhole size={16} /> Secure payments
        </span>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Boys & Girlz. Made with a little love.
        </span>
        <span>
          Frontend demo · No real orders or payments <Heart size={12} />
        </span>
      </div>
    </footer>
  );
}
