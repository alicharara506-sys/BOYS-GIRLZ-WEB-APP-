import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  Package,
  Truck,
} from "lucide-react";
import { useStore } from "../state/Store";
import { itemKey } from "../state/storeCore";
import { money, productById } from "../data/products";
import { ProductImage } from "../components/ProductCard";
import { OrderSummary } from "./Cart";
export default function Checkout() {
  const { cart, totals, dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    postal: "",
    country: "Lebanon",
  });
  const [payment, setPayment] = useState("demo-card");
  const [order, setOrder] = useState<{ id: string; total: number } | null>(
    null,
  );
  const next = () => {
    setStep((v) => v + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (order)
    return (
      <div className="page-width success-page">
        <span className="success-icon">
          <Gift size={56} strokeWidth={1.2} />
        </span>
        <span className="eyebrow">A little happy dance</span>
        <h1>Oh, happy day!</h1>
        <p>
          Your demo order is all wrapped up.
          <br />
          Thank you for making us part of your little moments.
        </p>
        <div className="success-order">
          <CheckCircle2 size={20} />
          <div>
            <strong>{order.id}</strong>
            <span>{money(order.total)} · Demo order confirmed</span>
          </div>
        </div>
        <p className="small-muted">
          This was a practice checkout. No payment was taken,
          <br />
          no email was sent, and no items will be shipped.
        </p>
        <Link to="/shop" className="btn btn-pink">
          More little lovely things <ArrowRight size={16} />
        </Link>
      </div>
    );
  if (!cart.length)
    return (
      <div className="page-width empty-state">
        <Package size={45} />
        <h1>Your bag needs a little love.</h1>
        <p>Add a favorite before checking out.</p>
        <Link to="/shop" className="btn btn-blue">
          Explore the shop <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="page-width checkout-page">
      <div className="page-heading">
        <span className="eyebrow">Nearly yours</span>
        <h1>One more little moment.</h1>
        <p>A demo checkout. All the joy, no real payment.</p>
      </div>
      <ol className="checkout-steps">
        {["Shipping", "Payment", "Review"].map((s, i) => (
          <li
            key={s}
            className={step === i ? "current" : step > i ? "complete" : ""}
            aria-current={step === i ? "step" : undefined}
          >
            <span>{step > i ? <Check size={15} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="checkout-layout">
        <section className="checkout-panel">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <h2>
                <Truck size={23} /> Where shall we send the love?
              </h2>
              <div className="form-grid">
                {[
                  ["firstName", "First name", "given-name"],
                  ["lastName", "Last name", "family-name"],
                  ["email", "Email address", "email"],
                  ["address", "Street address", "street-address"],
                  ["city", "City", "address-level2"],
                  ["postal", "Postal code", "postal-code"],
                ].map(([key, label, auto]) => (
                  <label
                    key={key}
                    className={
                      key === "email" || key === "address" ? "full" : ""
                    }
                  >
                    {label}
                    <input
                      required
                      type={key === "email" ? "email" : "text"}
                      autoComplete={auto}
                      value={shipping[key as keyof typeof shipping]}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, [key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                <label className="full">
                  Country
                  <select
                    value={shipping.country}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, country: e.target.value }))
                    }
                  >
                    {[
                      "Lebanon",
                      "United States",
                      "United Kingdom",
                      "France",
                      "United Arab Emirates",
                      "Saudi Arabia",
                      "Canada",
                      "Australia",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="delivery-option">
                <Truck size={22} />
                <div>
                  <strong>Standard delivery</strong>
                  <p>Estimated 5–10 business days · Demo estimate</p>
                </div>
                <span>{totals.shipping ? money(totals.shipping) : "Free"}</span>
              </div>
              <button className="btn btn-blue" type="submit">
                Continue to payment <ArrowRight size={16} />
              </button>
            </form>
          )}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <h2>
                <CreditCard size={23} /> A little payment detail.
              </h2>
              <p className="section-description">
                Choose a sample payment method. No card information is
                collected.
              </p>
              <label
                className={`payment-option ${payment === "demo-card" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "demo-card"}
                  onChange={() => setPayment("demo-card")}
                />
                <CreditCard size={24} />
                <div>
                  <strong>Demo card</strong>
                  <span>Visa ending in 4242 · Sample only</span>
                </div>
              </label>
              <div className="demo-credit-card">
                <span>BOYS & GIRLZ</span>
                <CreditCard size={27} />
                <strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</strong>
                <div>
                  <span>OUR LITTLE DEMO</span>
                  <span>12 / 30</span>
                </div>
              </div>
              <label
                className={`payment-option ${payment === "delivery" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "delivery"}
                  onChange={() => setPayment("delivery")}
                />
                <Package size={24} />
                <div>
                  <strong>Pay on delivery</strong>
                  <span>Demo option · No money due</span>
                </div>
              </label>
              <div className="step-buttons">
                <button
                  className="text-link"
                  type="button"
                  onClick={() => setStep(0)}
                >
                  <ArrowLeft size={15} /> Shipping
                </button>
                <button className="btn btn-blue" type="submit">
                  Review your order <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
          {step === 2 && (
            <div>
              <h2>
                <Gift size={23} /> All your lovely little details.
              </h2>
              <div className="review-block">
                <div>
                  <h3>Delivering to</h3>
                  <button className="text-link" onClick={() => setStep(0)}>
                    Edit
                  </button>
                </div>
                <p>
                  {shipping.firstName} {shipping.lastName}
                  <br />
                  {shipping.address}
                  <br />
                  {shipping.city}, {shipping.postal}, {shipping.country}
                  <br />
                  {shipping.email}
                </p>
              </div>
              <div className="review-block">
                <div>
                  <h3>Payment</h3>
                  <button className="text-link" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>
                <p>
                  {payment === "demo-card"
                    ? "Demo Visa ending in 4242"
                    : "Pay on delivery (demo)"}
                </p>
              </div>
              <p className="demo-disclosure">
                Placing this order completes the demo and clears your shopping
                bag. No payment or delivery will take place.
              </p>
              <button
                className="btn btn-pink place-order"
                onClick={() => {
                  setOrder({
                    id: `BG-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                    total: totals.total,
                  });
                  dispatch({ type: "CLEAR_CART" });
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              >
                Place demo order <Check size={17} />
              </button>
            </div>
          )}
        </section>
        <OrderSummary checkout>
          <div className="checkout-items">
            {cart.map((i) => {
              const p = productById(i.productId)!;
              return (
                <div key={itemKey(i)}>
                  <ProductImage product={p} />
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      {i.size} · {i.color} · Qty {i.quantity}
                    </span>
                  </div>
                  <span>{money(p.price * i.quantity)}</span>
                </div>
              );
            })}
          </div>
        </OrderSummary>
      </div>
    </div>
  );
}
