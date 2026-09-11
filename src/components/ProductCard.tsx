import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { colorHex, money, type Product } from "../data/products";
import { useStore } from "../state/Store";
import { useReducedMotion } from "../hooks/useExperience";
export function ProductImage({
  product,
  className = "",
  style,
}: {
  product: Pick<Product, "image" | "name" | "model">;
  className?: string;
  style?: CSSProperties;
}) {
  if (product.model === "duck")
    return (
      <div
        className={`product-photo duck-photo ${className}`}
        style={style}
        role="img"
        aria-label={product.name}
      >
        <span>🦆</span>
      </div>
    );
  return (
    <div
      role="img"
      aria-label={product.name}
      className={`product-photo ${className}`}
      style={{
        backgroundPosition: `${((product.image % 4) * 100) / 3}% ${Math.floor(product.image / 4) * 100}%`,
        ...style,
      }}
    />
  );
}
export function Tilt({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const b = e.currentTarget.getBoundingClientRect();
        ref.current.style.setProperty(
          "--rx",
          `${(-(e.clientY - b.top - b.height / 2) / b.height) * 9}deg`,
        );
        ref.current.style.setProperty(
          "--ry",
          `${((e.clientX - b.left - b.width / 2) / b.width) * 12}deg`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--rx", "0deg");
        ref.current?.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}
export function WishButton({ product }: { product: Product }) {
  const { wishlist, toggleWish } = useStore();
  const active = wishlist.includes(product.id);
  const [burst, setBurst] = useState(false);
  return (
    <button
      className={`icon-button wish-button ${active ? "is-wished" : ""}`}
      aria-label={`${active ? "Remove" : "Save"} ${product.name} ${active ? "from" : "to"} wishlist`}
      aria-pressed={active}
      onClick={() => {
        toggleWish(product.id);
        if (!active) setBurst(true);
      }}
      onAnimationEnd={() => setBurst(false)}
    >
      <Heart size={20} fill={active ? "currentColor" : "none"} />
      {burst && (
        <span className="heart-burst" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} style={{ "--angle": `${i * 60}deg` } as CSSProperties}>
              ♥
            </i>
          ))}
        </span>
      )}
    </button>
  );
}
export default function ProductCard({ product }: { product: Product }) {
  const [flipped, setFlipped] = useState(false);
  const [size, setSize] = useState(product.sizes[0]);
  const { add } = useStore();
  return (
    <article className="product-card">
      <Tilt>
        <div className={`product-flipper ${flipped ? "flipped" : ""}`}>
          <div className="card-front" inert={flipped}>
            <button
              className="product-image-button"
              aria-label={`Quick shop ${product.name}`}
              onClick={() => setFlipped(true)}
            >
              <ProductImage product={product} />
              <span className="quick-shop">
                <Plus size={15} /> Quick shop
              </span>
            </button>
            {(product.isNew || product.originalPrice) && (
              <span
                className={`product-tag ${product.originalPrice ? "sale-tag" : ""}`}
              >
                {product.originalPrice ? "SALE" : "NEW"}
              </span>
            )}
            <WishButton product={product} />
          </div>
          <div className="card-back" inert={!flipped}>
            <button
              className="icon-button flip-close"
              aria-label="Back to product photo"
              onClick={() => setFlipped(false)}
            >
              <RotateCcw size={18} />
            </button>
            <ShoppingBag size={25} strokeWidth={1.4} />
            <h3>{product.name}</h3>
            <p>{money(product.price)}</p>
            <label>
              Size
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                {product.sizes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-blue btn-small"
              onClick={(e) => {
                add(product, size, product.colors[0], 1, e.currentTarget);
                setFlipped(false);
              }}
            >
              Add to bag <Plus size={16} />
            </button>
            <Link to={`/product/${product.id}`} className="text-link">
              All the little details <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Tilt>
      <div className="product-info">
        <Link to={`/product/${product.id}`}>{product.name}</Link>
        <div className="product-meta">
          <span>
            {money(product.price)}{" "}
            {product.originalPrice && <del>{money(product.originalPrice)}</del>}
          </span>
          <span
            className="color-dots"
            aria-label={`Colors: ${product.colors.join(", ")}`}
          >
            {product.colors.map((c) => (
              <i key={c} style={{ background: colorHex[c] }} />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}
