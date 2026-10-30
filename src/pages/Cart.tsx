import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Link } from "../components/LocalizedLink";
import {
  ArrowRight,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  LockKeyhole,
} from "lucide-react";
import { useStore } from "../state/Store";
import { itemKey, type CartItem } from "../state/storeCore";
import { money, productById } from "../data/products";
import { ProductImage } from "../components/ProductCard";
import { Modal } from "../components/Layout";
import { WhatsAppOrderOption } from "../components/WhatsAppLink";
import { useLocale } from "../i18n/Locale";
import { SplitTitle } from "../components/HeroSection";
import { useCountUp } from "../hooks/useCountUp";
import { useReducedMotion } from "../hooks/useExperience";

const FREE_DELIVERY = 99;

function spotlight(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

// A money amount that counts smoothly to its new value.
export function CountingMoney({ value }: { value: number }) {
  return <>{money(useCountUp(value))}</>;
}

// Progress toward free delivery: a pink-to-blue bar with a little truck riding along it, which
// arrives with a burst once the subtotal passes $99.
export function FreeDeliveryBar({ subtotal, children }: { subtotal: number; children: ReactNode }) {
  const { t } = useLocale();
  const arrived = subtotal > FREE_DELIVERY;
  const percent = Math.min(100, (subtotal / FREE_DELIVERY) * 100);
  return <div className={`delivery-bar ${arrived ? "is-arrived" : ""}`} style={{ "--progress": `${percent}%` } as CSSProperties}>
    <p>{children}</p>
    <div className="delivery-track" role="progressbar" aria-label={t("Progress toward free shipping")} aria-valuemin={0} aria-valuemax={FREE_DELIVERY} aria-valuenow={Math.min(subtotal, FREE_DELIVERY)}>
      <span className="delivery-fill" />
      <span className="delivery-truck" aria-hidden="true"><Truck size={16} /></span>
      {arrived && <span className="delivery-burst" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ "--angle": `${i * 45}deg` } as CSSProperties} />)}</span>}
    </div>
  </div>;
}
export function Quantity({
  value,
  onChange,
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const { language, t } = useLocale();
  return (
    <div className="quantity-control" role="group" aria-label={t(label)}>
      <button
        aria-label={language === "ar" ? `تقليل ${t(label)}` : `Decrease ${label.toLowerCase()}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        type="button"
      >
        <Minus size={13} />
      </button>
      <output aria-live="polite"><span key={value} className="qty-flip">{value}</span></output>
      <button
        aria-label={language === "ar" ? `زيادة ${t(label)}` : `Increase ${label.toLowerCase()}`}
        disabled={value >= 10}
        onClick={() => onChange(value + 1)}
        type="button"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
export function CartLine({
  item,
  compact = false,
}: {
  item: CartItem;
  compact?: boolean;
}) {
  const { language, t } = useLocale();
  const { dispatch, setCartOpen } = useStore();
  const reduceMotion = useReducedMotion();
  const [removing, setRemoving] = useState(false);
  const p = productById(item.productId);
  if (!p) return null;
  const remove = () => {
    if (reduceMotion) return dispatch({ type: "REMOVE", key: itemKey(item) });
    setRemoving(true);
    window.setTimeout(() => dispatch({ type: "REMOVE", key: itemKey(item) }), 320);
  };
  return (
    <div className={`cart-line ${compact ? "compact" : ""} ${removing ? "is-removing" : ""}`}>
      <Link to={`/product/${p.id}`} onClick={() => setCartOpen(false)}>
        <ProductImage product={p} />
      </Link>
      <div className="cart-line-info">
        <Link to={`/product/${p.id}`} onClick={() => setCartOpen(false)}>
          {t(p.name)}
        </Link>
        <p>
          {item.size && <>{t(item.size)} <span>·</span> </>}{t(item.color)}
        </p>
        <div className="cart-line-controls">
          <Quantity
            value={item.quantity}
            onChange={(quantity) =>
              dispatch({ type: "QUANTITY", key: itemKey(item), quantity })
            }
            label={language === "ar" ? `كمية ${t(p.name)}` : `${p.name} quantity`}
          />
          <button
            className="remove-link"
            onClick={remove}
            disabled={removing}
            aria-label={language === "ar" ? `إزالة ${t(p.name)} من السلة` : `Remove ${p.name} from bag`}
          >
            <Trash2 size={14} />
            {!compact && t("Remove")}
          </button>
        </div>
      </div>
      <strong><CountingMoney value={p.price * item.quantity} /></strong>
    </div>
  );
}
export function OrderSummary({
  checkout = false,
  children,
}: {
  checkout?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();
  const { cart, totals } = useStore();
  return (
    <section className="order-summary bag-summary">
      <h2>{t("A lovely little total")}</h2>
      <div className="summary-line">
        <span>{t("Subtotal")}</span>
        <span><CountingMoney value={totals.subtotal} /></span>
      </div>
      <div className="summary-line">
        <span>{t("Shipping")}</span>
        <span>{t("Calculated at checkout")}</span>
      </div>
      <div className="summary-total">
        <span>{t("Estimated subtotal")}</span>
        <strong>
          <CountingMoney value={totals.total} /> <small>{t("USD")}</small>
        </strong>
      </div>
      {!checkout && (
        <>
          <p className="small-muted">{t("Enter a promo code at checkout. Stock, discounts and final delivery cost are checked when the order is placed.")}</p>
          <Link to="/checkout" className="bh-cta checkout-btn" onPointerMove={spotlight}>
            <span className="bh-cta-spot" aria-hidden="true" />
            <span className="bh-cta-shine" aria-hidden="true" />
            <span className="bh-cta-label">{t("A little closer to yours")}</span>
            <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
          </Link>
          <p className="checkout-note trust-chip">
            <LockKeyhole size={12} /> {t("Cash on Delivery only")}
          </p>
          <WhatsAppOrderOption cart={cart} />
        </>
      )}
      {children}
    </section>
  );
}
export function CartDrawer() {
  const { language, t } = useLocale();
  const { cartOpen, setCartOpen, cart, count, totals } = useStore();
  return (
    <Modal
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={language === "ar" ? `سلّتك الصغيرة (${count})` : `Your little bag (${count})`}
      drawer
      className="bag-drawer"
    >
      {cart.length ? (
        <>
          <FreeDeliveryBar subtotal={totals.subtotal}>
            {totals.subtotal > 99
              ? t("Lovely! Your shipping is on us.")
              : language === "ar" ? `توصيل مجاني للطلبات فوق 99$. مجموعك الفرعي ${money(totals.subtotal)}.` : `Free delivery on orders over $99. Your subtotal is ${money(totals.subtotal)}.`}
          </FreeDeliveryBar>
          <div className="drawer-items">
            {cart.map((i) => (
              <CartLine key={itemKey(i)} item={i} compact />
            ))}
          </div>
          <div className="drawer-summary">
            <div className="summary-total">
              <span>{t("Subtotal")}</span>
              <strong><CountingMoney value={totals.subtotal} /></strong>
            </div>
            <p className="small-muted">
              {t("Shipping and discounts shown in your bag.")}
            </p>
            <Link to="/cart" className="bh-cta drawer-cta" onClick={() => setCartOpen(false)} onPointerMove={spotlight}>
              <span className="bh-cta-spot" aria-hidden="true" />
              <span className="bh-cta-shine" aria-hidden="true" />
              <span className="bh-cta-label">{t("View your bag")}</span>
              <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
            </Link>
            <WhatsAppOrderOption cart={cart} onClick={() => setCartOpen(false)} />
            <Link to="/checkout" className="glass-button" onClick={() => setCartOpen(false)}>
              {t("Continue to checkout")} <ChevronRight size={15} />
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state bag-empty">
          <span className="bag-empty-art" aria-hidden="true">
            <span className="home-mascot home-mascot-boy" />
            <span className="bag-empty-icon"><ShoppingBag size={44} strokeWidth={1.4} /></span>
            <span className="home-mascot home-mascot-girl" />
          </span>
          <h2 className="bag-title"><SplitTitle text={t("A little empty, for now.")} byWord={language === "ar"} /></h2>
          <p>{t("Your next favorite is waiting.")}</p>
          <Link to="/shop" className="bh-cta" onClick={() => setCartOpen(false)} onPointerMove={spotlight}>
            <span className="bh-cta-shine" aria-hidden="true" />
            <span className="bh-cta-label">{t("Let’s explore")}</span>
            <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
          </Link>
        </div>
      )}
    </Modal>
  );
}
export default function Cart() {
  const { language, t } = useLocale();
  const { cart, count, totals } = useStore();
  return (
    <div className="bag-page">
      <div className="page-width">
        <div className="breadcrumbs">
          <Link to="/">{t("Home")}</Link>
          <ChevronRight size={12} />
          <span>{t("Your bag")}</span>
        </div>
      </div>
      <section className="contact-hero page-width bag-hero">
        <div className="about-fields" aria-hidden="true">
          <span className="about-field about-field-pink" />
          <span className="about-field about-field-blue" />
        </div>
        <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><ShoppingBag size={13} /></span>{t("A few lovely little things")}</span>
        <h1 className="contact-title"><SplitTitle text={t("Your shopping bag.")} byWord={language === "ar"} /></h1>
        <p className="contact-lead">
          {language === "ar" ? `${count} منتجات اخترتها بمحبة.` : <>{count} {count === 1 ? "little favorite" : "little favorites"}, chosen with love.</>}
        </p>
      </section>
      <div className="page-width">
        {cart.length ? (
          <div className="cart-layout">
            <section className="bag-items">
              <FreeDeliveryBar subtotal={totals.subtotal}>
                {totals.subtotal > 99
                  ? t("Your order qualifies for FREE delivery all over Lebanon.")
                  : t("FREE delivery all over Lebanon on orders over $99.")}
              </FreeDeliveryBar>
              {cart.map((i) => (
                <CartLine key={itemKey(i)} item={i} />
              ))}
              <Link to="/shop" className="glass-button continue-link">
                {t("Keep exploring")} <ArrowRight size={15} />
              </Link>
            </section>
            <OrderSummary />
          </div>
        ) : (
          <div className="empty-state bag-empty">
            <span className="bag-empty-art" aria-hidden="true">
              <span className="home-mascot home-mascot-boy" />
              <span className="bag-empty-icon"><ShoppingBag size={44} strokeWidth={1.4} /></span>
              <span className="home-mascot home-mascot-girl" />
            </span>
            <h2>{t("Good things are on their way.")}</h2>
            <p>{t("Start with one little favorite.")}</p>
            <Link to="/shop" className="bh-cta" onPointerMove={spotlight}>
              <span className="bh-cta-shine" aria-hidden="true" />
              <span className="bh-cta-label">{t("Shop the collection")}</span>
              <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
