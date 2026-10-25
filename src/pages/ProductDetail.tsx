import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Truck,
  Heart,
  Plus,
  Ruler,
  Check,
  Banknote,
  RotateCcw,
  Info,
  ShoppingBag,
} from "lucide-react";
import {
  colorHex,
  money,
  productById,
  sizeHeights,
  products,
  type Product,
} from "../data/products";
import { useStore } from "../state/Store";
import ProductCard, { WishButton } from "../components/ProductCard";
import ProductGallery from "../components/ProductGallery";
import { Modal } from "../components/Layout";
import { CountingMoney, Quantity } from "./Cart";
import { ProductImage } from "../components/ProductCard";
import { SplitTitle } from "../components/HeroSection";
import { useReducedMotion } from "../hooks/useExperience";

gsap.registerPlugin(ScrollTrigger);

function spotlight(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}
import { NotFound } from "./Shop";
import WhatsAppLink from "../components/WhatsAppLink";
import { useLocale } from "../i18n/Locale";
export default function ProductDetail() {
  const { id } = useParams();
  const product = productById(id || "");
  return product ? (
    <ProductContent key={product.id} product={product} />
  ) : (
    <NotFound />
  );
}
function ProductContent({ product: p }: { product: Product }) {
  const { language, t } = useLocale();
  const [size, setSize] = useState(p.sizes[0] || "");
  const [color, setColor] = useState(p.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuide, setSizeGuide] = useState(false);
  const { add } = useStore();
  const reduceMotion = useReducedMotion();
  const [added, setAdded] = useState(false);
  const [openDetail, setOpenDetail] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLElement>(null);
  const soldOut = p.productType === "shoes" && p.sizes.length === 0;
  // Adds to the bag and briefly shows a drawn check on the button.
  const addToBag = (target: HTMLElement) => {
    add(p, size, color, quantity, target);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };
  // The sticky bar slides up once the main Add to bag button has scrolled out of view.
  useEffect(() => {
    const row = purchaseRef.current;
    if (!row) return;
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(row);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const section = relatedRef.current;
    if (!section || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".related-grid > *", { y: 50, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, clearProps: "transform,opacity", scrollTrigger: { trigger: section, start: "top 85%", once: true } });
    }, section);
    return () => ctx.revert();
  }, [reduceMotion]);
  const details: { title: string; Icon: typeof Info; tint: string; blend?: boolean; body: ReactNode }[] = [
    { title: "All the little details", Icon: Info, tint: "#0898d6", blend: true, body: t("For fabric composition, measurements and age guidance, please contact the shop before ordering.") },
  ];
  const related = products
    .filter((q) => q.category === p.category && q.id !== p.id)
    .slice(0, 4);
  return (
    <div className="page-width">
      <div className="breadcrumbs">
        <Link to="/">{t("Home")}</Link>
        <ChevronRight size={12} />
        <Link to={`/category/${p.category.toLowerCase()}`}>{t(p.category)}</Link>
        <ChevronRight size={12} />
        <span>{t(p.name)}</span>
      </div>
      <div className="product-detail-layout">
        <ProductGallery product={p} color={color} />
        <div className="product-details">
          <span className={`eyebrow ${p.gender ? `is-${p.gender.toLowerCase()}` : ""}`}>
            {p.isNew
              ? t("A new little favorite")
              : language === "ar" ? `مجموعة ${t(p.category)}` : `The ${p.category.toLowerCase()} collection`}
          </span>
          <h1 className="detail-title"><SplitTitle text={t(p.name)} byWord={language === "ar"} /></h1>
          <div className="detail-price">
            {money(p.price)}{" "}
            {p.originalPrice && (
              <>
                <del>{money(p.originalPrice)}</del>
                <span className="save-chip">{t("Save")} {money(p.originalPrice - p.price)}</span>
              </>
            )}
          </div>
          <p className="detail-description">{t(p.description)}</p>
          <fieldset className="variant-section">
            <legend>
              {t("Color")} <span>— {t(color)}</span>
            </legend>
            <div className="detail-colors">
              {p.colors.map((c) => (
                <button
                  key={c}
                  style={{ "--swatch": colorHex[c] } as CSSProperties}
                  className={color === c ? "selected" : ""}
                  onClick={() => setColor(c)}
                  aria-label={`${t("Select")} ${t(c)}`}
                  aria-pressed={color === c}
                >{color === c && <Check size={14} aria-hidden="true" />}</button>
              ))}
            </div>
          </fieldset>
          {p.sizes.length > 0 && <fieldset className="variant-section">
            <legend>
              {t("Size")}{" "}
              <button className="size-guide" onClick={() => setSizeGuide(true)}>
                <Ruler size={14} /> {t("Size guide")}
              </button>
            </legend>
            <div className="size-options">
              {p.sizes.map((s) => (
                <button
                  key={s}
                  className={size === s ? "selected" : ""}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                >
                  <span>{t(s)}</span>
                  {sizeHeights[s] && <small className="size-cm"><bdi>{t(sizeHeights[s])}</bdi> {t("cm")}</small>}
                </button>
              ))}
            </div>
          </fieldset>}
          <div className="purchase-row" ref={purchaseRef}>
            <Quantity value={quantity} onChange={setQuantity} />
            <button
              className={`bh-cta add-main ${added ? "is-added" : ""}`}
              disabled={soldOut}
              onClick={(e) => addToBag(e.currentTarget)}
              onPointerMove={spotlight}
            >
              <span className="bh-cta-spot" aria-hidden="true" />
              <span className="bh-cta-shine" aria-hidden="true" />
              <span className="bh-cta-label">{soldOut ? t("Sizes coming soon") : <>{t("Add to bag")} — <CountingMoney value={p.price * quantity} /></>}</span>
              <span className="bh-cta-arrow" aria-hidden="true">{added ? <svg className="add-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg> : <Plus size={17} />}</span>
            </button>
            <div className="detail-wish">
              <WishButton product={p} />
            </div>
          </div>
          <WhatsAppLink
            className="text-link product-whatsapp"
            label={t("Ask on WhatsApp")}
            message={language === "ar" ? `مرحباً بويز آند غيرلز! أود طلب ${quantity} × ${t(p.name)} (${[size, color].filter(Boolean).map(t).join("، ")}) للتوصيل داخل لبنان. يرجى تأكيد التوفّر والسعر ورسوم التوصيل.` : `Hello Boys & Girlz! I would like to request ${quantity} × ${p.name}${[size, color].filter(Boolean).length ? ` (${[size, color].filter(Boolean).join(", ")})` : ""} for delivery within Lebanon. Please confirm availability, price, and delivery charge.`}
          />
          <div className="ship-strip">
            <div className="ship-row ship-row-truck">
              <span className="ship-icon" aria-hidden="true"><span className="bh-road" /><Truck size={18} /></span>
              <span><strong>{t("Free delivery over $99")}</strong><small>{t("Delivery all over Lebanon")}</small></span>
            </div>
            <div className="ship-row ship-row-cash">
              <span className="ship-icon" aria-hidden="true"><Banknote size={18} /></span>
              <span><strong>{t("Cash on Delivery")}</strong><small>{t("Pay when it arrives")}</small></span>
            </div>
            <div className="ship-row ship-row-return">
              <span className="ship-icon" aria-hidden="true"><RotateCcw size={18} /></span>
              <span><strong>{t("Returns")}</strong><small>{t("Ask us before ordering")}</small></span>
            </div>
            <Link className="ship-more" to="/help/shipping">{t("Delivery & returns details")} <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <div className="product-accordions detail-cards">
            {details.map(({ title, Icon, tint, blend, body }, index) => {
              const open = openDetail === index;
              return <section key={title} className={`faq-item ${blend ? "is-blend" : ""} ${open ? "is-open" : ""}`} style={{ "--tint": tint, "--i": index } as CSSProperties} onPointerMove={spotlight}>
                <h2>
                  <button type="button" aria-expanded={open} aria-controls={`detail-${index}`} onClick={() => setOpenDetail(open ? -1 : index)}>
                    <span className="faq-icon" aria-hidden="true"><Icon size={18} /></span>
                    <span className="faq-question">{t(title)}</span>
                    <span className="faq-toggle" aria-hidden="true"><Plus size={17} /></span>
                  </button>
                </h2>
                <div className="faq-answer" id={`detail-${index}`} role="region" aria-label={t(title)}><div><p>{body}</p></div></div>
              </section>;
            })}
          </div>
        </div>
      </div>
      <section className="related-section" ref={relatedRef}>
        <div className="section-heading related-heading">
          <div className="section-eyebrow">
            <span aria-hidden="true" />
            <span className="section-eyebrow-text">{t("Chosen with love")}</span>
            <span aria-hidden="true" />
          </div>
          <h2>{t("A few more lovely things.")}</h2>
          <Link
            to={`/category/${p.category.toLowerCase()}`}
            className="text-link"
          >
            {t("Explore")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="related-grid">
          {related.map((q) => (
            <ProductCard key={q.id} product={q} />
          ))}
        </div>
      </section>
      <div className={`buy-bar ${showBar ? "is-visible" : ""}`} aria-hidden={!showBar}>
        <div className="buy-bar-inner">
          <span className="buy-bar-thumb"><ProductImage product={p} /></span>
          <span className="buy-bar-copy"><strong>{t(p.name)}</strong><small>{[size, color].filter(Boolean).map(t).join(" · ")}</small></span>
          <span className="buy-bar-price">{money(p.price * quantity)}</span>
          <button className={`bh-cta buy-bar-add ${added ? "is-added" : ""}`} disabled={soldOut} tabIndex={showBar ? 0 : -1} onClick={(e) => addToBag(e.currentTarget)}>
            <span className="bh-cta-shine" aria-hidden="true" />
            <span className="bh-cta-label">{soldOut ? t("Sizes coming soon") : t("Add to bag")}</span>
            <span className="bh-cta-arrow" aria-hidden="true">{added ? <Check size={16} /> : <ShoppingBag size={16} />}</span>
          </button>
        </div>
      </div>
      <Modal
        open={sizeGuide}
        onClose={() => setSizeGuide(false)}
        title={t("A little guide to the right fit")}
        className="fit-guide"
      >
        <p className="fit-guide-note"><Ruler size={16} aria-hidden="true" /> {t("Ask the shop for verified measurements before choosing a size.")}</p>
        <ol className="fit-steps" role="radiogroup" aria-label={t("Size")}>
          <span className="fit-line" aria-hidden="true" />
          {p.sizes.map((s, index) => <li key={s} style={{ "--i": index } as CSSProperties}>
            <button type="button" role="radio" aria-checked={size === s} className={size === s ? "is-chosen" : ""}
              onClick={() => { setSize(s); setSizeGuide(false); }}>
              <span className="fit-dot" aria-hidden="true">{size === s && <Check size={13} />}</span>
              <span className="fit-name">{t(s)}</span>
              {sizeHeights[s] && <span className="fit-cm">{sizeHeights[s].startsWith("up") ? "" : "≈ "}<bdi>{t(sizeHeights[s])}</bdi> {t("cm")}</span>}
              <ArrowRight className="fit-arrow" size={15} aria-hidden="true" />
            </button>
          </li>)}
        </ol>
        <p className="fit-guide-cm">{t("Approximate child height. Sizes can vary a little by brand.")}</p>
        <p className="fit-guide-tip"><Heart size={15} aria-hidden="true" /> {t("Between sizes? Choose a little room to grow.")}</p>
        <WhatsAppLink
          className="fit-guide-wa"
          label={t("Ask or order on WhatsApp")}
          message={language === "ar" ? `مرحباً بويز آند غيرلز! هل يمكنكم إرسال قياسات ${t(p.name)}؟` : `Hello Boys & Girlz! Could you send me the measurements for the ${p.name}?`}
        />
      </Modal>
    </div>
  );
}
