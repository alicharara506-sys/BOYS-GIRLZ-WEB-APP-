import { useState } from "react";
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
  Check,
} from "lucide-react";
import { useStore } from "../state/Store";
import { itemKey, type CartItem } from "../state/storeCore";
import { money, productById } from "../data/products";
import { ProductImage, Tilt } from "../components/ProductCard";
import { Modal } from "../components/Layout";
export function Quantity({
  value,
  onChange,
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="quantity-control" role="group" aria-label={label}>
      <button
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        type="button"
      >
        <Minus size={13} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        aria-label={`Increase ${label.toLowerCase()}`}
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
          {p.name}
        </Link>
        <p>
          {item.size} <span>·</span> {item.color}
        </p>
        <div className="cart-line-controls">
          <Quantity
            value={item.quantity}
            onChange={(quantity) =>
              dispatch({ type: "QUANTITY", key: itemKey(item), quantity })
            }
            label={`${p.name} quantity`}
          />
          <button
            className="remove-link"
            onClick={() => dispatch({ type: "REMOVE", key: itemKey(item) })}
            aria-label={`Remove ${p.name} from bag`}
          >
            <Trash2 size={14} />
            {!compact && "Remove"}
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
  const { totals, promo, dispatch } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="order-summary">
      <h2>A lovely little total</h2>
      <div className="summary-line">
        <span>Subtotal</span>
        <span>{money(totals.subtotal)}</span>
      </div>
      <div className="summary-line">
        <span>Shipping</span>
        <span>{totals.shipping ? money(totals.shipping) : "On us"}</span>
      </div>
      {totals.discount > 0 && (
        <div className="summary-line discount">
          <span>Little love (10%)</span>
          <span>−{money(totals.discount)}</span>
        </div>
      )}
      <div className="summary-total">
        <span>Total</span>
        <strong>
          {money(totals.total)} <small>USD</small>
        </strong>
      </div>
      {!checkout && (
        <>
          <form
            className="promo-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().toUpperCase() === "LITTLELOVE10") {
                dispatch({ type: "PROMO", code });
                setError("");
              } else setError("That code isn’t quite right. Try LITTLELOVE10.");
            }}
          >
            <input
              aria-label="Promo code"
              placeholder="A little promo code?"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit">Apply</button>
          </form>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {promo ? (
            <p className="promo-success">
              <Check size={13} /> LITTLELOVE10 applied{" "}
              <button onClick={() => dispatch({ type: "PROMO", code: "" })}>
                Remove
              </button>
            </p>
          ) : (
            <p className="small-muted">
              A little welcome gift: use <b>LITTLELOVE10</b>.
            </p>
          )}
          <Tilt>
            <Link to="/checkout" className="btn btn-blue checkout-btn">
              A little closer to yours <ArrowRight size={17} />
            </Link>
          </Tilt>
          <p className="checkout-note">
            <LockKeyhole size={12} /> Demo checkout · No real payments
          </p>
        </>
      )}
      {children}
    </section>
  );
}
export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, count, totals } = useStore();
  return (
    <Modal
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={`Your little bag (${count})`}
      drawer
    >
      {cart.length ? (
        <>
          <div className="shipping-progress">
            <Truck size={18} />
            <p>
              {totals.subtotal >= 99
                ? "Lovely! Your shipping is on us."
                : `You’re ${money(99 - totals.subtotal)} away from free shipping.`}
            </p>
            <progress
              value={Math.min(totals.subtotal, 99)}
              max="99"
              aria-label="Progress toward free shipping"
            />
          </div>
          <div className="drawer-items">
            {cart.map((i) => (
              <CartLine key={itemKey(i)} item={i} compact />
            ))}
          </div>
          <div className="drawer-summary">
            <div className="summary-total">
              <span>Subtotal</span>
              <strong>{money(totals.subtotal)}</strong>
            </div>
            <p className="small-muted">
              Shipping and discounts shown in your bag.
            </p>
            <Link
              to="/cart"
              className="btn btn-blue"
              onClick={() => setCartOpen(false)}
            >
              View your bag <ArrowRight size={16} />
            </Link>
            <Link
              to="/checkout"
              className="text-link"
              onClick={() => setCartOpen(false)}
            >
              Continue to checkout <ChevronRight size={14} />
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={48} strokeWidth={1.2} />
          <h2>A little empty, for now.</h2>
          <p>Your next favorite is waiting.</p>
          <Link
            to="/shop"
            className="btn btn-blue"
            onClick={() => setCartOpen(false)}
          >
            Let’s explore <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </Modal>
  );
}
export default function Cart() {
  const { cart, count, totals } = useStore();
  return (
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <ChevronRight size={12} />
        <span>Your bag</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">A few lovely little things</span>
        <h1>Your shopping bag.</h1>
        <p>
          {count} {count === 1 ? "little favorite" : "little favorites"}, chosen
          with love.
        </p>
      </div>
      {cart.length ? (
        <div className="cart-layout">
          <section>
            <div className="cart-shipping">
              <Truck size={20} />
              {totals.subtotal >= 99
                ? "Your order qualifies for FREE delivery all over Lebanon."
                : `Add ${money(99 - totals.subtotal)} more for FREE delivery.`}
            </div>
            {cart.map((i) => (
              <CartLine key={itemKey(i)} item={i} />
            ))}
            <Link to="/shop" className="text-link continue-link">
              Keep exploring <ArrowRight size={15} />
            </Link>
          </section>
          <OrderSummary />
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={50} strokeWidth={1.2} />
          <h2>Good things are on their way.</h2>
          <p>Start with one little favorite.</p>
          <Link to="/shop" className="btn btn-blue">
            Shop the collection <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
