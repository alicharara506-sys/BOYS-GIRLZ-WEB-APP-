import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Truck,
  Heart,
  Plus,
  Minus,
  Ruler,
} from "lucide-react";
import {
  colorHex,
  money,
  productById,
  products,
  type Product,
} from "../data/products";
import { useStore } from "../state/Store";
import ProductCard, { WishButton } from "../components/ProductCard";
import ProductGallery from "../components/ProductGallery";
import { Modal } from "../components/Layout";
import { Quantity } from "./Cart";
import { NotFound } from "./Shop";
import WhatsAppLink from "../components/WhatsAppLink";
import { useLocale } from "../i18n/Locale";
export default function ProductDetail() {
  const { id } = useParams();
  const product = productById(id || "");
  const [params] = useSearchParams();
  const selectedSize = params.get("size") || "";
  return product ? (
    <ProductContent key={`${product.id}:${selectedSize}`} product={product} selectedSize={selectedSize} />
  ) : (
    <NotFound />
  );
}
function ProductContent({ product: p, selectedSize }: { product: Product; selectedSize: string }) {
  const { language, t } = useLocale();
  const [size, setSize] = useState(p.sizes.includes(selectedSize) ? selectedSize : p.sizes[0] || "");
  const [color, setColor] = useState(p.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuide, setSizeGuide] = useState(false);
  const { add } = useStore();
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
        <ProductGallery product={p} />
        <div className="product-details">
          <span className="eyebrow">
            {p.isNew
              ? t("A new little favorite")
              : language === "ar" ? `مجموعة ${t(p.category)}` : `The ${p.category.toLowerCase()} collection`}
          </span>
          <h1>{t(p.name)}</h1>
          <div className="detail-price">
            {money(p.price)}{" "}
            {p.originalPrice && (
              <>
                <del>{money(p.originalPrice)}</del>
                <span>{t("Save")} {money(p.originalPrice - p.price)}</span>
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
                  style={{ "--swatch": colorHex[c] } as React.CSSProperties}
                  className={color === c ? "selected" : ""}
                  onClick={() => setColor(c)}
                  aria-label={`${t("Select")} ${t(c)}`}
                  aria-pressed={color === c}
                />
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
                  {t(s)}
                </button>
              ))}
            </div>
          </fieldset>}
          <div className="purchase-row">
            <Quantity value={quantity} onChange={setQuantity} />
            <button
              className="btn btn-blue add-main"
              disabled={p.productType === "shoes" && p.sizes.length === 0}
              onClick={(e) => add(p, size, color, quantity, e.currentTarget)}
            >
              {p.productType === "shoes" && p.sizes.length === 0 ? t("Sizes coming soon") : `${t("Add to bag")} — ${money(p.price * quantity)}`} <Plus size={17} />
            </button>
            <div className="detail-wish">
              <WishButton product={p} />
            </div>
          </div>
          <WhatsAppLink
            className="text-link product-whatsapp"
            label={t("Ask or order on WhatsApp")}
            message={language === "ar" ? `مرحباً بويز آند غيرلز! أود طلب ${quantity} × ${t(p.name)} (${[size, color].filter(Boolean).map(t).join("، ")}) للتوصيل داخل لبنان. يرجى تأكيد التوفّر والسعر ورسوم التوصيل.` : `Hello Boys & Girlz! I would like to request ${quantity} × ${p.name}${[size, color].filter(Boolean).length ? ` (${[size, color].filter(Boolean).join(", ")})` : ""} for delivery within Lebanon. Please confirm availability, price, and delivery charge.`}
          />
          <div className="product-reassurance">
            <span>
              <Truck size={17} /> {t("Lebanon delivery · Free over $99")}
            </span>
            <span>
              <Heart size={16} /> {t("Chosen with love")}
            </span>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>
                {t("All the little details")} <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>{t("For fabric composition, measurements and age guidance, please contact the shop before ordering.")}</p>
            </details>
            <details>
              <summary>
                {t("A little care goes a long way")} <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>{t("Follow the care label on the item. Contact us if you need care information before ordering.")}</p>
            </details>
            <details>
              <summary>
                {t("Shipping & returns")} <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>
                {language === "ar" ? "نوفّر التوصيل داخل لبنان فقط، ويكون مجانيًا للطلبات التي تتجاوز 99 دولارًا. يُرجى الاطّلاع على " : "We deliver within Lebanon only. Delivery is free on orders over $99. Read our "}<Link to="/help/shipping">{t("shipping guide")}</Link>{" "}
                {language === "ar" ? "و" : "and "}<Link to="/help/returns">{t("returns guide")}</Link>{language === "ar" ? " قبل الطلب." : " before ordering."}
              </p>
            </details>
          </div>
        </div>
      </div>
      <section className="related-section">
        <div className="section-heading">
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
      <Modal
        open={sizeGuide}
        onClose={() => setSizeGuide(false)}
        title={t("A little guide to the right fit")}
      >
        <p className="small-muted">{t("Ask the shop for verified measurements before choosing a size.")}</p>
        <div className="table-scroll" role="region" aria-label={t("Size guide")} tabIndex={0}>
        <table className="size-table">
          <thead>
            <tr>
              <th>{t("Size")}</th>
              <th>{t(p.category === "Maternity" ? "UK size" : "Height / fit")}</th>
            </tr>
          </thead>
          <tbody>
            {p.sizes.map((s) => [s, "See product details"]).map(([s, h]) => (
              <tr key={s}>
                <td>{t(s)}</td>
                <td>{t(h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="small-muted">
          {t("Between sizes? Choose a little room to grow.")}
        </p>
      </Modal>
    </div>
  );
}
