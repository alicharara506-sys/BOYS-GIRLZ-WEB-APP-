import type { Product } from "../data/products";
import { ProductImage } from "./ProductCard";
import { useLocale } from "../i18n/Locale";

export default function ProductGallery({ product }: { product: Product }) {
  const { t } = useLocale();
  return <div className="product-gallery">
    <div className="photo-viewer">
      <span className="photo-badge">{t("Product preview")}</span>
      <ProductImage product={product} />
    </div>
    <p className="small-muted">{t("Verified product photography is being prepared. Please contact the shop for current photos before ordering.")}</p>
  </div>;
}
