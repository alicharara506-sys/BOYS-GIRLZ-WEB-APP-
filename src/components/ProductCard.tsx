import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { colorHex, money, type Product } from "../data/products";
import { useStore } from "../state/Store";
import { useLocale } from "../i18n/Locale";
export function ProductImage({
  product,
  className = "",
  style,
}: {
  product: Pick<Product, "image" | "name" | "model">;
  className?: string;
  style?: CSSProperties;
}) {
  const { t } = useLocale();
  if (product.model === "duck")
    return (
      <div
        className={`product-photo duck-photo ${className}`}
        style={style}
        role="img"
        aria-label={t(product.name)}
      >
        <span>🦆</span>
      </div>
    );
  return (
    <div
      role="img"
      aria-label={t(product.name)}
      className={`product-photo ${className}`}
      style={{
        backgroundImage: product.image >= 8 ? 'url("/assets/featured-products.png")' : undefined,
        backgroundSize: product.image >= 8 ? "200% 200%" : undefined,
        backgroundPosition: product.image >= 8
          ? `${((product.image - 8) % 2) * 100}% ${Math.floor((product.image - 8) / 2) * 100}%`
          : `${((product.image % 4) * 100) / 3}% ${Math.floor(product.image / 4) * 100}%`,
        ...style,
      }}
    />
  );
}
export function WishButton({ product }: { product: Product }) {
  const { language, t } = useLocale();
  const { wishlist, toggleWish } = useStore();
  const active = wishlist.includes(product.id);
  const [burst, setBurst] = useState(false);
  return (
    <button
      className={`icon-button wish-button ${active ? "is-wished" : ""}`}
      aria-label={language === "ar" ? `${active ? "إزالة" : "حفظ"} ${t(product.name)} ${active ? "من" : "في"} المفضّلة` : `${active ? "Remove" : "Save"} ${product.name} ${active ? "from" : "to"} wishlist`}
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
export default function ProductCard({ product, showRange = false }: { product: Product; showRange?: boolean }) {
  const { language, t } = useLocale();
  const [quickOpen, setQuickOpen] = useState(false);
  const [size, setSize] = useState(product.sizes[0] || "");
  const [color, setColor] = useState(product.colors[0]);
  const { add } = useStore();
  return (
    <article className="product-card product-card-simple">
      <div className="card-front">
        <Link className="product-image-link" to={`/product/${product.id}`} aria-label={language === "ar" ? `عرض ${t(product.name)}` : `View ${product.name}`}>
          <ProductImage product={product} />
        </Link>
        {(product.isNew || product.originalPrice || product.condition === "like-new") && (
          <span className={`product-tag ${product.originalPrice ? "sale-tag" : ""}`}>
            {t(product.condition === "like-new" ? "LIKE NEW" : product.originalPrice ? "SALE" : "NEW")}
          </span>
        )}
        <WishButton product={product} />
      </div>
      <div className="product-info">
        <Link to={`/product/${product.id}`}>{t(product.name)}</Link>
        {showRange && product.sizes.length > 0 && <span className="product-range">{t(product.sizes[0])}–{t(product.sizes.at(-1) || "")}</span>}
        <div className="product-meta">
          <span>
            {money(product.price)}{" "}
            {product.originalPrice && <del>{money(product.originalPrice)}</del>}
          </span>
          <span
            className="color-dots"
            aria-label={language === "ar" ? `الألوان: ${product.colors.map(t).join("، ")}` : `Colors: ${product.colors.join(", ")}`}
          >
            {product.colors.map((c) => (
              <i key={c} style={{ background: colorHex[c] }} />
            ))}
          </span>
        </div>
        <button className="card-quick-button" type="button" aria-expanded={quickOpen} onClick={() => setQuickOpen((open) => !open)}>
          {t(quickOpen ? "Close options" : "Quick add")} <Plus size={15} aria-hidden="true" />
        </button>
        {quickOpen && <div className="card-quick-options">
          {product.sizes.length > 0 && <label>{t("Size")}
            <select value={size} onChange={(event) => setSize(event.target.value)}>{product.sizes.map((option) => <option key={option} value={option}>{t(option)}</option>)}</select>
          </label>}
          {product.colors.length > 1 && <label>{t("Color")}
            <select value={color} onChange={(event) => setColor(event.target.value)}>{product.colors.map((option) => <option key={option} value={option}>{t(option)}</option>)}</select>
          </label>}
          <button type="button" className="btn btn-blue btn-small" disabled={product.productType === "shoes" && product.sizes.length === 0} onClick={(event) => {
            add(product, size, color, 1, event.currentTarget);
            setQuickOpen(false);
          }}>{t(product.productType === "shoes" && product.sizes.length === 0 ? "Sizes coming soon" : "Add to bag")} <Plus size={15} /></button>
        </div>}
      </div>
    </article>
  );
}
