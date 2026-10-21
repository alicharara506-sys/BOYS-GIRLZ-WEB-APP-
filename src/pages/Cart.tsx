import { Link } from "react-router-dom";
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
import { localizedCount, useLocale } from "../i18n/Locale";
import ReceiptFrame from "../components/ReceiptFrame";
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
      <output aria-live="polite">{value}</output>
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
  const p = productById(item.productId);
  if (!p) return null;
  return (
    <div className={`cart-line ${compact ? "compact" : ""}`}>
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
            onClick={() => dispatch({ type: "REMOVE", key: itemKey(item) })}
            aria-label={language === "ar" ? `إزالة ${t(p.name)} من السلة` : `Remove ${p.name} from bag`}
          >
            <Trash2 size={14} />
            {!compact && t("Remove")}
          </button>
        </div>
      </div>
      <strong>{money(p.price * item.quantity)}</strong>
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
    <ReceiptFrame className="order-summary" label={t("Order summary")}>
      <h2>{t("A lovely little total")}</h2>
      <div className="summary-line">
        <span>{t("Subtotal")}</span>
        <span>{money(totals.subtotal)}</span>
      </div>
      <div className="summary-line">
        <span>{t("Shipping")}</span>
        <span>{t("Calculated at checkout")}</span>
      </div>
      <div className="summary-total">
        <span>{t("Estimated subtotal")}</span>
        <strong>
          {money(totals.total)} <small>{t("USD")}</small>
        </strong>
      </div>
      {!checkout && (
        <>
          <p className="small-muted">{t("Enter a promo code at checkout. Stock, discounts and final delivery cost are checked when the order is placed.")}</p>
          <Link to="/checkout" className="btn btn-blue checkout-btn">
            {t("A little closer to yours")} <ArrowRight size={17} />
          </Link>
          <p className="checkout-note">
            <LockKeyhole size={12} /> {t("Cash on Delivery only")}
          </p>
          <WhatsAppOrderOption cart={cart} />
        </>
      )}
      {children}
    </ReceiptFrame>
  );
}
export function CartDrawer() {
  const { language, t } = useLocale();
  const { cartOpen, setCartOpen, cart, count, totals } = useStore();
  return (
    <Modal
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={language === "ar" ? `سلة التسوّق (${count})` : `Your little bag (${count})`}
      drawer
    >
      {cart.length ? (
        <>
          <div className="shipping-progress">
            <Truck size={18} />
            <p>
              {totals.subtotal > 99
                ? t("Lovely! Your shipping is on us.")
                : language === "ar" ? <>التوصيل مجاني للطلبات التي تتجاوز 99 دولارًا. المجموع الفرعي لطلبك: <bdi>{money(totals.subtotal)}</bdi>.</> : `Free delivery on orders over $99. Your subtotal is ${money(totals.subtotal)}.`}
            </p>
            <progress
              value={Math.min(totals.subtotal, 99)}
              max="99"
              aria-label={t("Progress toward free shipping")}
            />
          </div>
          <ReceiptFrame className="bag-receipt" label={t("Order summary")} active={cartOpen}>
          <div className="drawer-items">
            {cart.map((i) => (
              <CartLine key={itemKey(i)} item={i} compact />
            ))}
          </div>
          <div className="drawer-summary">
            <div className="summary-total">
              <span>{t("Subtotal")}</span>
              <strong>{money(totals.subtotal)}</strong>
            </div>
            <p className="small-muted">
              {t("Shipping and discounts shown in your bag.")}
            </p>
            <Link
              to="/cart"
              className="btn btn-blue"
              onClick={() => setCartOpen(false)}
            >
              {t("View your bag")} <ArrowRight size={16} />
            </Link>
            <WhatsAppOrderOption cart={cart} onClick={() => setCartOpen(false)} />
            <Link
              to="/checkout"
              className="text-link"
              onClick={() => setCartOpen(false)}
            >
              {t("Continue to checkout")} <ChevronRight size={14} />
            </Link>
          </div>
          </ReceiptFrame>
        </>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={48} strokeWidth={1.2} />
          <h2>{t("A little empty, for now.")}</h2>
          <p>{t("Your next favorite is waiting.")}</p>
          <Link
            to="/shop"
            className="btn btn-blue"
            onClick={() => setCartOpen(false)}
          >
            {t("Let’s explore")} <ArrowRight size={16} />
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
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">{t("Home")}</Link>
        <ChevronRight size={12} />
        <span>{t("Your bag")}</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">{t("A few lovely little things")}</span>
        <h1>{t("Your shopping bag.")}</h1>
        <p>
          {language === "ar" ? count ? `${localizedCount(count, "product", language)} في سلة التسوّق.` : "لم تُضف أيّ منتجات إلى سلة التسوّق بعد." : <>{count} {count === 1 ? "little favorite" : "little favorites"}, chosen with love.</>}
        </p>
      </div>
      {cart.length ? (
        <div className="cart-layout">
          <section>
            <div className="cart-shipping">
              <Truck size={20} />
              {totals.subtotal > 99
                ? t("Your order qualifies for FREE delivery all over Lebanon.")
                : t("FREE delivery within Lebanon on orders over $99.")}
            </div>
            {cart.map((i) => (
              <CartLine key={itemKey(i)} item={i} />
            ))}
            <Link to="/shop" className="text-link continue-link">
              {t("Keep exploring")} <ArrowRight size={15} />
            </Link>
          </section>
          <OrderSummary />
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={50} strokeWidth={1.2} />
          <h2>{t("Good things are on their way.")}</h2>
          <p>{t("Start with one little favorite.")}</p>
          <Link to="/shop" className="btn btn-blue">
            {t("Shop the collection")} <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
