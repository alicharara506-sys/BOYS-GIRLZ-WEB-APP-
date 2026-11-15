import { useState, type CSSProperties } from "react";
import { colorHex, type Product } from "../data/products";
import { colorDetails, colorImages } from "../domain/productColors";
import { ProductImage } from "./ProductCard";
import { useLocale } from "../i18n/Locale";

// The product photo in a still white frame over a soft glow in the chosen colour. Products with
// color details show only the chosen color's photos, with thumbnails to move between them; the
// product page remounts this per color, so switching color always opens on that color's cover
// and never mixes photos from two colors.
export default function ProductGallery({ product, color }: { product: Product; color?: string }) {
  const { t } = useLocale();
  const details = colorDetails(product, color);
  const images = details ? colorImages(product, color) : [];
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];
  const name = t(product.name);
  const colorName = color ? t(color) : "";
  return <div className="product-gallery" style={{ "--glow": details?.hex || colorHex[color || product.colors[0]] || "#f3c6d6" } as CSSProperties}>
    <div className="photo-stage">
      <span className="photo-glow" aria-hidden="true" />
      <div className="photo-viewer">
        {current
          ? <img src={current} alt={`${name}, ${colorName}${images.length > 1 ? ` (${index + 1}/${images.length})` : ""}`} width="800" height="800" fetchPriority="high" decoding="async" className="product-photo" data-color={color} />
          : <ProductImage product={product} priority />}
      </div>
    </div>
    {images.length > 1 && <div className="gallery-thumbs color-thumbs" role="group" aria-label={`${colorName} · ${t("Photos")}`}>
      {images.map((url, i) => <button key={url} type="button" className={i === index ? "active" : ""} aria-pressed={i === index} aria-label={`${t("Photo")} ${i + 1}`} onClick={() => setIndex(i)}>
        <img src={url} alt="" width="120" height="120" loading="lazy" decoding="async" className="product-photo" />
      </button>)}
    </div>}
    {!current && !product.imageUrl && <p className="small-muted">{t("Verified product photography is being prepared. Please contact the shop for current photos before ordering.")}</p>}
  </div>;
}
