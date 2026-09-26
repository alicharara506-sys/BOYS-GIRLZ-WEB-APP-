import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Star,
  Truck,
  Heart,
  ShieldCheck,
  Plus,
  Minus,
  Ruler,
  Leaf,
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
  const [size, setSize] = useState(p.sizes[0]);
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
          <a href="#reviews" className="rating-link">
            <span>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={13} fill="currentColor" />
              ))}
            </span>
            {p.rating.toFixed(1)}{" "}
            <span className="review-count">({p.reviews} sample reviews)</span>
          </a>
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
          <fieldset className="variant-section">
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
          </fieldset>
          <div className="purchase-row">
            <Quantity value={quantity} onChange={setQuantity} />
            <button
              className="btn btn-blue add-main"
              onClick={(e) => add(p, size, color, quantity, e.currentTarget)}
            >
              Add to bag — {money(p.price * quantity)} <Plus size={17} />
            </button>
            <div className="detail-wish">
              <WishButton product={p} />
            </div>
          </div>
          <div className="product-reassurance">
            <span>
              <Truck size={17} /> Lebanon delivery · Free over $99
            </span>
            <span>
              <ShieldCheck size={17} /> 30-day demo returns
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
              <p>
                {p.category === "Toys"
                  ? "A soft little playtime companion. Toy materials and age suitability shown here are illustrative; replace with supplier specifications before launch."
                  : p.category === "Maternity"
                    ? "A relaxed, easy-fitting silhouette, room to grow, and soft fabric for everyday comfort. Sample product specifications."
                    : "A soft fabric feel, comfortable everyday fit, and easy dressing details. Fabric composition is illustrative until real product specifications are supplied."}
              </p>
            </details>
            <details>
              <summary>
                A little care goes a long way <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>
                For this demo, wash clothing on a gentle cold cycle and lay flat
                to dry. Follow the actual garment care label when real inventory
                is added. Surface-clean plush toys.
              </p>
            </details>
            <details>
              <summary>
                Shipping & returns <Plus size={15} />
                <Minus size={15} />
              </summary>
              <p>
                We ship within Lebanon only. Delivery is $5.95, or complimentary
                on orders over $99. Browse our <Link to="/help/shipping">shipping guide</Link>{" "}
                and <Link to="/help/returns">returns guide</Link> for this
                demo’s policy details.
              </p>
            </details>
          </div>
        </div>
      </div>
      <section id="reviews" className="reviews-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Little notes, lots of love</span>
            <h2>Loved by little families.</h2>
          </div>
          <span className="sample-label">Sample reviews</span>
        </div>
        <div className="review-grid">
          {[
            {
              name: "Sarah M.",
              text: "Even lovelier in person. Such a sweet little addition to our everyday favorites.",
              title: "Our new favorite",
            },
            {
              name: "Lina K.",
              text: "The little details are beautiful. I picked this as a gift and it was such a lovely surprise.",
              title: "The sweetest gift",
            },
            {
              name: "Emma R.",
              text: "Soft, thoughtful, and made for the little moments. We keep coming back to this one.",
              title: "A little everyday joy",
            },
          ].map((r) => (
            <article key={r.name}>
              <span className="review-stars">★★★★★</span>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <span className="review-author">
                {r.name} <Leaf size={11} /> Sample customer
              </span>
            </article>
          ))}
        </div>
      </section>
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
        <p className="small-muted">
          Sample sizing. Check real garment measurements before purchase.
        </p>
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
