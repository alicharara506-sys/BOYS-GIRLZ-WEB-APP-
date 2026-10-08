import { useEffect, useState, type FormEvent } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Package, Truck } from "lucide-react";
import { useStore } from "../state/Store";
import { money, productById } from "../data/products";
import { ProductImage } from "../components/ProductCard";
import { itemKey } from "../state/storeCore";

type OrderReply = { error?: string; orderNumber?: string; totals?: { totalCents: number } };
type Shipping = {
  fullName: string; mobile: string; email: string; governorate: string;
  cityArea: string; streetBuilding: string; landmark: string;
  deliveryNotes: string; promoCode: string;
};
const initialShipping: Shipping = {
  fullName: "", mobile: "", email: "", governorate: "", cityArea: "",
  streetBuilding: "", landmark: "", deliveryNotes: "", promoCode: "",
};
const governorates = ["Beirut", "Mount Lebanon", "North Lebanon", "Akkar", "Bekaa", "Baalbek-Hermel", "South Lebanon", "Nabatieh"];
const fields: { key: keyof Shipping; label: string; required?: boolean; type?: string; autoComplete?: string; full?: boolean }[] = [
  { key: "fullName", label: "Full name", required: true, autoComplete: "name", full: true },
  { key: "mobile", label: "Lebanese mobile number", required: true, type: "tel", autoComplete: "tel" },
  { key: "email", label: "Email (optional)", type: "email", autoComplete: "email" },
  { key: "cityArea", label: "City or area", required: true, autoComplete: "address-level2" },
  { key: "streetBuilding", label: "Street and building", required: true, autoComplete: "street-address", full: true },
  { key: "landmark", label: "Landmark (optional)" },
  { key: "promoCode", label: "Promo code (optional)" },
];
export default function Checkout() {
  const { cart, totals, dispatch } = useStore();
  const fetcher = useFetcher<OrderReply>();
  const [shipping, setShipping] = useState<Shipping>(initialShipping);
  const [review, setReview] = useState(false);
  const order = fetcher.data?.orderNumber;
  useEffect(() => { if (order) dispatch({ type: "CLEAR_CART" }); }, [order, dispatch]);
  const update = (key: keyof Shipping, value: string) => setShipping((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review) { setReview(true); return; }
    fetcher.submit({
      ...shipping,
      items: cart.map((item) => ({
        productSlug: item.productId, size: item.size || null,
        color: item.color || null, quantity: item.quantity,
      })),
    }, { method: "post", encType: "application/json" });
  };
  if (order) return <div className="page-width success-page" role="status">
    <span className="success-icon"><CheckCircle2 size={56} strokeWidth={1.2} /></span>
    <h1>Your order has been received.</h1>
    <p>Order <strong>{order}</strong> is awaiting confirmation. Please have cash ready when it is delivered.</p>
    <p>Total: {money((fetcher.data?.totals?.totalCents ?? 0) / 100)}</p>
    <Link to="/shop" className="btn btn-blue">Continue shopping <ArrowRight size={16} /></Link>
  </div>;
  if (!cart.length) return <div className="page-width empty-state">
    <Package size={45} /><h1>Your bag is empty.</h1>
    <p>Add an item before checking out.</p>
    <Link to="/shop" className="btn btn-blue">Explore the shop <ArrowRight size={16} /></Link>
  </div>;
  return <div className="page-width checkout-page">
    <div className="page-heading">
      <span className="eyebrow">Delivery within Lebanon</span>
      <h1>Checkout</h1>
      <p>Cash on Delivery. Your total and item availability are verified when you place the order.</p>
    </div>
    <ol className="checkout-steps">
      <li className={review ? "complete" : "current"} aria-current={!review ? "step" : undefined}><span>1</span> Delivery details</li>
      <li className={review ? "current" : ""} aria-current={review ? "step" : undefined}><span>2</span> Review and order</li>
    </ol>
    <div className="checkout-layout">
      <section className="checkout-panel">
        <form onSubmit={submit}>
          <h2><Truck size={23} /> {review ? "Review your details" : "Where should we deliver?"}</h2>
          <div className="form-grid">
            {fields.slice(0, 3).map((field) => <label key={field.key} className={field.full ? "full" : ""}>{field.label}
              <input required={field.required} type={field.type || "text"} autoComplete={field.autoComplete}
                value={shipping[field.key]} onChange={(e) => update(field.key, e.target.value)} disabled={review} />
            </label>)}
            <label>Governorate
              <select required value={shipping.governorate} onChange={(e) => update("governorate", e.target.value)} disabled={review}>
                <option value="">Choose a governorate</option>
                {governorates.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            {fields.slice(3).map((field) => <label key={field.key} className={field.full ? "full" : ""}>{field.label}
              <input required={field.required} type={field.type || "text"} autoComplete={field.autoComplete}
                value={shipping[field.key]} onChange={(e) => update(field.key, e.target.value)} disabled={review} />
            </label>)}
            <label className="full">Delivery notes (optional)
              <textarea rows={3} value={shipping.deliveryNotes} onChange={(e) => update("deliveryNotes", e.target.value)} disabled={review} />
            </label>
          </div>
          <div className="delivery-option"><Truck size={22} /><div><strong>Delivery in Lebanon</strong><p>Cash on Delivery · Delivery timing confirmed with the shop</p></div></div>
          {review && <p className="demo-disclosure">Payment method: <strong>Cash on Delivery</strong>. The server checks stock, promo eligibility and final shipping before accepting your order.</p>}
          {fetcher.data?.error && <p className="form-error" role="alert">{fetcher.data.error}</p>}
          <div className="step-buttons">
            {review && <button className="text-link" type="button" onClick={() => setReview(false)}><ArrowLeft size={15} /> Edit details</button>}
            <button className="btn btn-pink" type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Checking your order…" : review ? "Place Cash on Delivery order" : "Review order"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>
      <aside className="order-summary" aria-label="Order summary">
        <h2>Your bag</h2>
        <div className="checkout-items">{cart.map((item) => {
          const product = productById(item.productId);
          if (!product) return null;
          return <div key={itemKey(item)}><ProductImage product={product} /><div><strong>{product.name}</strong><span>{item.size && `${item.size} · `}{item.color} · Qty {item.quantity}</span></div><span>{money(product.price * item.quantity)}</span></div>;
        })}</div>
        <div className="summary-line"><span>Estimated subtotal</span><span>{money(totals.subtotal)}</span></div>
        <p className="small-muted">Final shipping, discounts and total are calculated on the server. No payment is collected online.</p>
      </aside>
    </div>
  </div>;
}

