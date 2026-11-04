import { useState, type CSSProperties, type PointerEvent } from "react";
import { Link } from "./LocalizedLink";
import { Heart, Plus } from "lucide-react";
import { colorHex, money, type Product } from "../data/products";
import { useStore } from "../state/Store";
import { useLocale } from "../i18n/Locale";
export function ProductImage({
  product,
  className = "",
  style,
  priority = false,
}: {
  product: Pick<Product, "image" | "name" | "model" | "imageUrl">;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const { t } = useLocale();
  const imageUrl = product.imageUrl && (/^\/(?:media|assets)\/[a-zA-Z0-9_./-]+$/.test(product.imageUrl) || /^https:\/\//i.test(product.imageUrl))
    ? product.imageUrl
    : "";
  if (imageUrl) return <img
    src={imageUrl}
    alt={t(product.name)}
    width="800"
    height="800"
    loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : "auto"}
    decoding="async"
    className={`product-photo ${className}`}
    style={style}
  />;
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
    <img
      src={`/assets/catalog-previews/${product.image}.webp`}
      alt={t(product.name)}
      width={[444, 443, 443, 444, 444, 443, 443, 444, 656, 656, 656, 656][product.image]}
      height={[444, 444, 444, 444, 443, 443, 443, 443, 600, 600, 599, 599][product.image]}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`product-photo ${className}`}
      style={style}
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
// Tilts the card toward the cursor and moves its light to follow it; only for a mouse.
function follow(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  card.style.setProperty("--mx", `${x * 100}%`);
  card.style.setProperty("--my", `${y * 100}%`);
  card.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
  card.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
}
function settle(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}

// A product as a glass card: its photo floating over a soft glow in the product's own colour,
// with quick add in a glass bar over the photo. On hover it tilts toward the cursor, a light
// follows the cursor, and the lights always running round its edge come into focus.
export default function ProductCard({ product, showRange = false }: { product: Product; showRange?: boolean }) {
  const { language, t } = useLocale();
  const [quickOpen, setQuickOpen] = useState(false);
  const [size, setSize] = useState(product.sizes[0] || "");
  const [color, setColor] = useState(product.colors[0]);
  const { add } = useStore();
  const unavailable = product.available === false || (product.productType === "shoes" && product.sizes.length === 0);
  const unavailableLabel = product.available === false
    ? language === "ar" ? "غير متوفر حالياً" : "Currently unavailable"
    : t("Sizes coming soon");
  return (
    <article className={`product-card pc ${quickOpen ? "pc-open" : ""}`} style={{ "--pc-glow": colorHex[color] || "#f3c6d6" } as CSSProperties}>
      <div className="pc-tilt" onPointerMove={follow} onPointerLeave={settle}>
        <span className="pc-light" aria-hidden="true" />
        <span className="pc-edge" aria-hidden="true" />
        <div className="pc-media">
          <span className="pc-aura" aria-hidden="true" />
          <span className="pc-shadow" aria-hidden="true" />
          <Link className="pc-image-link" to={`/product/${product.id}`} aria-label={language === "ar" ? `عرض ${t(product.name)}` : `View ${product.name}`}>
            <ProductImage product={product} className="pc-photo" />
          </Link>
          {(product.isNew || product.originalPrice || product.condition === "like-new") && (
            <span className={`pc-tag ${product.originalPrice ? "pc-tag-sale" : ""}`}>
              {t(product.condition === "like-new" ? "LIKE NEW" : product.originalPrice ? "SALE" : "NEW")}
            </span>
          )}
          <WishButton product={product} />
          <div className="pc-quick">
            {quickOpen && <div className="pc-quick-options">
              {product.sizes.length > 0 && <div className="pc-field">
                <span className="pc-field-label" id={`${product.id}-size`}>{t("Size")} <b>{t(size)}</b></span>
                <div className="pc-chips" role="radiogroup" aria-labelledby={`${product.id}-size`}>
                  {product.sizes.map((option) => <button key={option} type="button" role="radio" aria-checked={size === option}
                    className={size === option ? "active" : ""} onClick={(event) => {
                      setSize(option);
                      event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                    }}>{t(option)}</button>)}
                </div>
              </div>}
              {product.colors.length > 1 && <div className="pc-field">
                <span className="pc-field-label" id={`${product.id}-color`}>{t("Color")} <b>{t(color)}</b></span>
                <div className="pc-swatches" role="radiogroup" aria-labelledby={`${product.id}-color`}>
                  {product.colors.map((option) => <button key={option} type="button" role="radio" aria-checked={color === option} aria-label={t(option)}
                    className={color === option ? "active" : ""} style={{ "--swatch": colorHex[option] } as CSSProperties} onClick={() => setColor(option)} />)}
                </div>
              </div>}
              <button type="button" className="pc-add" disabled={unavailable} onClick={(event) => {
                add(product, size, color, 1, event.currentTarget);
                setQuickOpen(false);
              }}>{unavailable ? unavailableLabel : t("Add to bag")} <Plus size={15} /></button>
            </div>}
            <button className="pc-quick-button" type="button" aria-expanded={quickOpen} onClick={() => setQuickOpen((open) => !open)}>
              {t(quickOpen ? "Close options" : "Quick add")} <Plus size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pc-info">
          <Link className="pc-name" to={`/product/${product.id}`}>{t(product.name)}</Link>
          {showRange && product.sizes.length > 0 && <span className="pc-range">{t(product.sizes[0])}–{t(product.sizes.at(-1) || "")}</span>}
          <div className="pc-meta">
            <span className="pc-price">
              {money(product.price)}{" "}
              {product.originalPrice && <del>{money(product.originalPrice)}</del>}
            </span>
            <span
              className="pc-dots"
              role="group"
              aria-label={language === "ar" ? `الألوان: ${product.colors.map(t).join("، ")}` : `Colors: ${product.colors.join(", ")}`}
            >
              {product.colors.map((c) => (
                <button key={c} type="button" aria-label={t(c)} aria-pressed={color === c} className={color === c ? "active" : ""}
                  style={{ "--swatch": colorHex[c] } as CSSProperties} onClick={() => setColor(c)} />
              ))}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
