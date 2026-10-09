import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const [size, setSize] = useState(p.sizes[0] || "");
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
        <Link to="/">Home</Link>
        <ChevronRight size={12} />
        <Link to={`/category/${p.category.toLowerCase()}`}>{p.category}</Link>
        <ChevronRight size={12} />
        <span>{p.name}</span>
      </div>
      <div className="product-detail-layout">
        <ProductGallery product={p} />
        <div className="product-details">
          <span className="eyebrow">
            {p.isNew
              ? "A new little favorite"
              : `The ${p.category.toLowerCase()} collection`}
          </span>
          <h1>{p.name}</h1>
          <div className="detail-price">
            {money(p.price)}{" "}
            {p.originalPrice && (
              <>
                <del>{money(p.originalPrice)}</del>
                <span>Save {money(p.originalPrice - p.price)}</span>
              </>
            )}
          </div>
          <p className="detail-description">{p.description}</p>
          <fieldset className="variant-section">
            <legend>
              Color <span>— {color}</span>
            </legend>
            <div className="detail-colors">
              {p.colors.map((c) => (
                <button
                  key={c}
                  style={{ "--swatch": colorHex[c] } as React.CSSProperties}
                  className={color === c ? "selected" : ""}
                  onClick={() => setColor(c)}
                  aria-label={`Select ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </fieldset>
          {p.sizes.length > 0 && <fieldset className="variant-section">
            <legend>
              Size{" "}
              <button className="size-guide" onClick={() => setSizeGuide(true)}>
                <Ruler size={14} /> Size guide
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
                  {s}
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
              {p.productType === "shoes" && p.sizes.length === 0 ? "Sizes coming soon" : `Add to bag — ${money(p.price * quantity)}`} <Plus size={17} />
            </button>
            <div className="detail-wish">
              <WishButton product={p} />
            </div>
          </div>
          <WhatsAppLink
            className="text-link product-whatsapp"
            label="Ask or order on WhatsApp"
            message={`Hello Boys & Girlz! I would like to request ${quantity} × ${p.name}${[size, color].filter(Boolean).length ? ` (${[size, color].filter(Boolean).join(", ")})` : ""} for delivery within Lebanon. Please confirm availability, price, and delivery charge.`}
          />
          <div className="product-reassurance">
            <span>
              <Truck size={17} /> Lebanon delivery · Free over $99
            </span>
            <span>
              <Heart size={16} /> Chosen with love
            </span>
          </div>
          <div className="product-accordions">
            <details open>
              <summary>
                All the little details <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>For fabric composition, measurements and age guidance, please contact the shop before ordering.</p>
            </details>
            <details>
              <summary>
                A little care goes a long way <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>Follow the care label on the item. Contact us if you need care information before ordering.</p>
            </details>
            <details>
              <summary>
                Shipping & returns <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>
                We deliver within Lebanon only. Delivery is free on orders over $99. Read our <Link to="/help/shipping">shipping guide</Link>{" "}
                and <Link to="/help/returns">returns guide</Link> before ordering.
              </p>
            </details>
          </div>
        </div>
      </div>
      <section className="related-section">
        <div className="section-heading">
          <h2>A few more lovely things.</h2>
          <Link
            to={`/category/${p.category.toLowerCase()}`}
            className="text-link"
          >
            Explore <ArrowRight size={16} />
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
        title="A little guide to the right fit"
      >
        <p className="small-muted">Ask the shop for verified measurements before choosing a size.</p>
        <table className="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>{p.category === "Maternity" ? "UK size" : "Height / fit"}</th>
            </tr>
          </thead>
          <tbody>
            {p.sizes.map((s) => [s, "See product details"]).map(([s, h]) => (
              <tr key={s}>
                <td>{s}</td>
                <td>{h}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small-muted">
          Between sizes? Choose a little room to grow.
        </p>
      </Modal>
    </div>
  );
}
