import type { CSSProperties } from "react";
import { colorHex, type Product } from "../data/products";
import { ProductImage } from "./ProductCard";
import { useLocale } from "../i18n/Locale";

// The product photo in a still white frame over a soft glow in the chosen colour.
export default function ProductGallery({ product, color }: { product: Product; color?: string }) {
  const { t } = useLocale();
  return <div className="product-gallery" style={{ "--glow": colorHex[color || product.colors[0]] || "#f3c6d6" } as CSSProperties}>
    <div className="photo-stage">
      <span className="photo-glow" aria-hidden="true" />
      <div className="photo-viewer">
        <ProductImage product={product} priority />
      </div>
    </div>
    {!product.imageUrl && <p className="small-muted">{t("Verified product photography is being prepared. Please contact the shop for current photos before ordering.")}</p>}
  </div>;
}
