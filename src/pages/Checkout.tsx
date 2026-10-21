import { useEffect, useState, type FormEvent } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Package, Printer, Truck } from "lucide-react";
import { useStore } from "../state/Store";
import { money, productById } from "../data/products";
import { ProductImage } from "../components/ProductCard";
import { itemKey, type CartItem } from "../state/storeCore";
import ReceiptFrame from "../components/ReceiptFrame";
import { WhatsAppOrderOption } from "../components/WhatsAppLink";
import { useLocale } from "../i18n/Locale";

type OrderReply = { error?: string; orderNumber?: string; totals?: { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number } };
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
  const { language, t } = useLocale();
  const { cart, totals, dispatch } = useStore();
  const fetcher = useFetcher<OrderReply>();
  const [shipping, setShipping] = useState<Shipping>(initialShipping);
  const [review, setReview] = useState(false);
  const [submittedItems, setSubmittedItems] = useState<CartItem[]>([]);
  const order = fetcher.data?.orderNumber;
  useEffect(() => {
    if (!order) return;
    dispatch({ type: "CLEAR_CART" });
    document.getElementById("order-received-heading")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [order, dispatch]);
  const update = (key: keyof Shipping, value: string) => setShipping((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review) { setReview(true); return; }
    setSubmittedItems(cart.map((item) => ({ ...item })));
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
    <h1 id="order-received-heading" tabIndex={-1}>{t("Your order has been received.")}</h1>
    <p>{language === "ar" ? <>طلبك رقم <strong><bdi>{order}</bdi></strong> بانتظار التأكيد. يُرجى تجهيز المبلغ نقدًا عند الاستلام.</> : <>Order <strong>{order}</strong> is awaiting confirmation. Please have cash ready when it is delivered.</>}</p>
    <ReceiptFrame className="confirmed-receipt" label={t("Order receipt")}>
      <h2>{t("Order receipt")}</h2>
      <p className="receipt-order-number"><bdi>{order}</bdi></p>
      <p>{shipping.fullName}<br />{t(shipping.governorate)} · {shipping.cityArea}<br />{shipping.streetBuilding}<br /><bdi>{shipping.mobile}</bdi></p>
      <div className="receipt-order-items">{submittedItems.map((item) => {
        const product = productById(item.productId);
        return product && <div key={itemKey(item)}><strong>{t(product.name)}</strong><span>{item.size && `${t(item.size)} · `}{t(item.color)} · {t("Quantity")}: {item.quantity}</span></div>;
      })}</div>
      {fetcher.data?.totals && <>
        <div className="summary-line"><span>{t("Subtotal")}</span><bdi>{money(fetcher.data.totals.subtotalCents / 100)}</bdi></div>
        <div className="summary-line"><span>{t("Discount")}</span><bdi>{money(fetcher.data.totals.discountCents / 100)}</bdi></div>
        <div className="summary-line"><span>{t("Shipping")}</span><bdi>{money(fetcher.data.totals.shippingCents / 100)}</bdi></div>
        <div className="summary-total"><span>{t("Total")}</span><strong><bdi>{money(fetcher.data.totals.totalCents / 100)}</bdi></strong></div>
      </>}
      <p className="receipt-payment-note">{t("Cash on Delivery")} · {t("Awaiting confirmation")}</p>
    </ReceiptFrame>
    <button type="button" className="btn btn-outline receipt-print-button" onClick={() => window.print()}><Printer size={18} /> {t("Print receipt")}</button>
    <Link to="/shop" className="btn btn-blue">{t("Continue shopping")} <ArrowRight size={16} /></Link>
  </div>;
  if (!cart.length) return <div className="page-width empty-state">
    <Package size={45} /><h1>{t("Your bag is empty.")}</h1>
    <p>{t("Add an item before checking out.")}</p>
    <Link to="/shop" className="btn btn-blue">{t("Explore the shop")} <ArrowRight size={16} /></Link>
  </div>;
  return <div className="page-width checkout-page">
    <div className="page-heading">
      <span className="eyebrow">{t("Delivery within Lebanon")}</span>
      <h1>{t("Checkout")}</h1>
      <p>{t("Cash on Delivery. Your total and item availability are verified when you place the order.")}</p>
    </div>
    <ol className="checkout-steps">
      <li className={review ? "complete" : "current"} aria-current={!review ? "step" : undefined}><span>1</span> {t("Delivery details")}</li>
      <li className={review ? "current" : ""} aria-current={review ? "step" : undefined}><span>2</span> {t("Review and order")}</li>
    </ol>
    <div className="checkout-layout">
      <section className="checkout-panel">
        <form onSubmit={submit}>
          <h2><Truck size={23} /> {t(review ? "Review your details" : "Where should we deliver?")}</h2>
          <div className="form-grid">
            {fields.slice(0, 3).map((field) => <label key={field.key} className={field.full ? "full" : ""}>{t(field.label)}
              <input required={field.required} type={field.type || "text"} autoComplete={field.autoComplete}
                value={shipping[field.key]} onChange={(e) => update(field.key, e.target.value)} disabled={review} />
            </label>)}
            <label>{t("Governorate")}
              <select required value={shipping.governorate} onChange={(e) => update("governorate", e.target.value)} disabled={review}>
                <option value="">{t("Choose a governorate")}</option>
                {governorates.map((name) => <option key={name} value={name}>{t(name)}</option>)}
              </select>
            </label>
            {fields.slice(3).map((field) => <label key={field.key} className={field.full ? "full" : ""}>{t(field.label)}
              <input required={field.required} type={field.type || "text"} autoComplete={field.autoComplete}
                value={shipping[field.key]} onChange={(e) => update(field.key, e.target.value)} disabled={review} />
            </label>)}
            <label className="full">{t("Delivery notes (optional)")}
              <textarea rows={3} value={shipping.deliveryNotes} onChange={(e) => update("deliveryNotes", e.target.value)} disabled={review} />
            </label>
          </div>
          <div className="delivery-option"><Truck size={22} /><div><strong>{t("Delivery in Lebanon")}</strong><p>{t("Cash on Delivery · Delivery timing confirmed with the shop")}</p></div></div>
          {review && <p className="demo-disclosure">{t("Payment method:")} <strong>{t("Cash on Delivery")}</strong>. {t("The server checks stock, promo eligibility and final shipping before accepting your order.")}</p>}
          {fetcher.data?.error && <p className="form-error" role="alert">{t(fetcher.data.error)}</p>}
          <div className="step-buttons">
            {review && <button className="text-link" type="button" onClick={() => setReview(false)}><ArrowLeft size={15} /> {t("Edit details")}</button>}
            <button className="btn btn-pink" type="submit" disabled={fetcher.state !== "idle"}>
              {t(fetcher.state !== "idle" ? "Checking your order…" : review ? "Place Cash on Delivery order" : "Review order")} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>
      <ReceiptFrame className="order-summary" label={t("Order summary")}>
        <h2>{t("Your bag")}</h2>
        <div className="checkout-items">{cart.map((item) => {
          const product = productById(item.productId);
          if (!product) return null;
          return <div key={itemKey(item)}><ProductImage product={product} /><div><strong>{t(product.name)}</strong><span>{item.size && `${t(item.size)} · `}{t(item.color)} · {language === "ar" ? "الكمية" : "Qty"} {item.quantity}</span></div><span>{money(product.price * item.quantity)}</span></div>;
        })}</div>
        <div className="summary-line"><span>{t("Estimated subtotal")}</span><span>{money(totals.subtotal)}</span></div>
        <p className="small-muted">{t("Final shipping, discounts and total are calculated on the server. No payment is collected online.")}</p>
        <WhatsAppOrderOption cart={cart} />
      </ReceiptFrame>
    </div>
  </div>;
}

