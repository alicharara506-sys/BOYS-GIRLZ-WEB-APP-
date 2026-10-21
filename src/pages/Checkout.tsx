import { useEffect, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle, Package, ShoppingBag, Truck } from "lucide-react";
import { useStore } from "../state/Store";
import { money, productById } from "../data/products";
import { ProductImage } from "../components/ProductCard";
import { itemKey } from "../state/storeCore";
import { WhatsAppOrderOption } from "../components/WhatsAppLink";
import { useLocale } from "../i18n/Locale";
import { SplitTitle } from "../components/HeroSection";
import { CountingMoney } from "./Cart";

const hearts = Array.from({ length: 14 }, (_, i) => ({ angle: i * (360 / 14), distance: 80 + (i % 3) * 28, delay: (i % 4) * 0.04 }));
function spotlight(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

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
  const { language, t } = useLocale();
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
  if (order) return <div className="page-width success-page checkout-done" role="status">
    <span className="contact-sent-burst" aria-hidden="true">
      {hearts.map((heart, i) => <i key={i} style={{ "--angle": `${heart.angle}deg`, "--distance": `${heart.distance}px`, "--delay": `${heart.delay}s` } as CSSProperties}>♥</i>)}
    </span>
    <span className="contact-sent-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg></span>
    <h1 className="contact-title"><SplitTitle text={t("Your order has been received.")} byWord={language === "ar"} /></h1>
    <p>{language === "ar" ? <>الطلب <strong>{order}</strong> بانتظار التأكيد. يُرجى تجهيز المبلغ نقداً عند التوصيل.</> : <>Order <strong>{order}</strong> is awaiting confirmation. Please have cash ready when it is delivered.</>}</p>
    <p className="checkout-done-total">{language === "ar" ? "المجموع:" : "Total:"} {money((fetcher.data?.totals?.totalCents ?? 0) / 100)}</p>
    <Link to="/shop" className="bh-cta" onPointerMove={spotlight}>
      <span className="bh-cta-shine" aria-hidden="true" />
      <span className="bh-cta-label">{t("Continue shopping")}</span>
      <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
    </Link>
  </div>;
  if (!cart.length) return <div className="page-width empty-state bag-empty">
    <span className="bag-empty-art" aria-hidden="true">
      <span className="home-mascot home-mascot-boy" />
      <span className="bag-empty-icon"><Package size={42} strokeWidth={1.4} /></span>
      <span className="home-mascot home-mascot-girl" />
    </span>
    <h1>{t("Your bag is empty.")}</h1>
    <p>{t("Add an item before checking out.")}</p>
    <Link to="/shop" className="bh-cta" onPointerMove={spotlight}>
      <span className="bh-cta-shine" aria-hidden="true" />
      <span className="bh-cta-label">{t("Explore the shop")}</span>
      <span className="bh-cta-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
    </Link>
  </div>;
  const sending = fetcher.state !== "idle";
  const field = (key: keyof Shipping) => {
    const spec = fields.find((f) => f.key === key)!;
    return <div className={`float-field ${spec.full ? "full" : ""}`} key={key}>
      <input id={`co-${key}`} required={spec.required} type={spec.type || "text"} autoComplete={spec.autoComplete} placeholder=" "
        value={shipping[key]} onChange={(e) => update(key, e.target.value)} />
      <label htmlFor={`co-${key}`}>{t(spec.label)}</label>
      <Check className="float-ok" size={16} aria-hidden="true" />
    </div>;
  };
  const filled = (Object.keys(initialShipping) as (keyof Shipping)[]).filter((key) => shipping[key]);
  const labelFor = (key: keyof Shipping) => key === "governorate" ? "Governorate" : key === "deliveryNotes" ? "Delivery notes (optional)" : fields.find((f) => f.key === key)!.label;
  return <div className="checkout-page checkout-v2">
    <section className="contact-hero page-width">
      <div className="about-fields" aria-hidden="true">
        <span className="about-field about-field-pink" />
        <span className="about-field about-field-blue" />
      </div>
      <span className="bh-kicker"><span className="bh-pulse" aria-hidden="true"><Truck size={13} /></span>{t("Delivery within Lebanon")}</span>
      <h1 className="contact-title"><SplitTitle text={t("Checkout")} byWord={language === "ar"} /></h1>
      <p className="contact-lead">{t("Cash on Delivery. Your total and item availability are verified when you place the order.")}</p>
    </section>
    <div className="page-width">
      <ol className={`checkout-steps checkout-progress ${review ? "is-review" : ""}`}>
        <li className={review ? "complete" : "current"} aria-current={!review ? "step" : undefined}><span>{review ? <Check size={15} /> : 1}</span> {t("Delivery details")}</li>
        <li className={review ? "current" : ""} aria-current={review ? "step" : undefined}><span>2</span> {t("Review and order")}</li>
      </ol>
      <div className="checkout-layout">
        <section className="checkout-panel checkout-glass">
          <form onSubmit={submit}>
            <h2><span className="checkout-panel-icon" aria-hidden="true"><Truck size={20} /></span> {t(review ? "Review your details" : "Where should we deliver?")}</h2>
            {review ? <dl className="review-list">
              {filled.map((key) => <div key={key}><dt>{t(labelFor(key))}</dt><dd>{key === "governorate" ? t(shipping[key]) : shipping[key]}</dd></div>)}
            </dl> : <div className="form-grid checkout-fields">
              {field("fullName")}
              {field("mobile")}
              {field("email")}
              <div className="float-field float-select">
                <select id="co-governorate" required value={shipping.governorate} onChange={(e) => update("governorate", e.target.value)}>
                  <option value="">{t("Choose a governorate")}</option>
                  {governorates.map((name) => <option key={name} value={name}>{t(name)}</option>)}
                </select>
                <label htmlFor="co-governorate">{t("Governorate")}</label>
                <ChevronDown className="float-chevron" size={17} aria-hidden="true" />
              </div>
              {field("cityArea")}
              {field("streetBuilding")}
              {field("landmark")}
              {field("promoCode")}
              <div className="float-field full">
                <textarea id="co-deliveryNotes" rows={3} placeholder=" " value={shipping.deliveryNotes} onChange={(e) => update("deliveryNotes", e.target.value)} />
                <label htmlFor="co-deliveryNotes">{t("Delivery notes (optional)")}</label>
              </div>
            </div>}
            <div className="delivery-option delivery-glass"><span className="delivery-glass-icon" aria-hidden="true"><Truck size={22} /></span><div><strong>{t("Delivery in Lebanon")}</strong><p>{t("Cash on Delivery · Delivery timing confirmed with the shop")}</p></div></div>
            {review && <p className="demo-disclosure">{t("Payment method:")} <strong>{t("Cash on Delivery")}</strong>. {t("The server checks stock, promo eligibility and final shipping before accepting your order.")}</p>}
            {fetcher.data?.error && <p className="form-error" role="alert">{t(fetcher.data.error)}</p>}
            <div className="step-buttons">
              {review && <button className="glass-button" type="button" onClick={() => setReview(false)}><ArrowLeft size={15} /> {t("Edit details")}</button>}
              <button className={`bh-cta checkout-submit ${sending ? "is-sending" : ""}`} type="submit" disabled={sending} onPointerMove={spotlight}>
                <span className="bh-cta-spot" aria-hidden="true" />
                <span className="bh-cta-shine" aria-hidden="true" />
                <span className="bh-cta-label">{t(sending ? "Checking your order…" : review ? "Place Cash on Delivery order" : "Review order")}</span>
                <span className="bh-cta-arrow" aria-hidden="true">{sending ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}</span>
              </button>
            </div>
          </form>
        </section>
        <aside className="order-summary bag-summary" aria-label={t("Order summary")}>
          <h2><ShoppingBag size={19} aria-hidden="true" /> {t("Your bag")}</h2>
          <div className="checkout-items">{cart.map((item) => {
            const product = productById(item.productId);
            if (!product) return null;
            return <div key={itemKey(item)}><span className="checkout-thumb"><ProductImage product={product} /><b>{item.quantity}</b></span><div><strong>{t(product.name)}</strong><span>{item.size && `${t(item.size)} · `}{t(item.color)} · {language === "ar" ? "الكمية" : "Qty"} {item.quantity}</span></div><span>{money(product.price * item.quantity)}</span></div>;
          })}</div>
          <div className="summary-line summary-strong"><span>{t("Estimated subtotal")}</span><span><CountingMoney value={totals.subtotal} /></span></div>
          <p className="small-muted">{t("Final shipping, discounts and total are calculated on the server. No payment is collected online.")}</p>
          <WhatsAppOrderOption cart={cart} />
        </aside>
      </div>
    </div>
  </div>;
}
