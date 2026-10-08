import type { Product } from "../data/products";
import { ProductImage } from "./ProductCard";

export default function ProductGallery({ product }: { product: Product }) {
  return <div className="product-gallery">
    <div className="photo-viewer">
      <span className="photo-badge">Product preview</span>
      <ProductImage product={product} />
    </div>
    <p className="small-muted">Verified product photography is being prepared. Please contact the shop for current photos before ordering.</p>
  </div>;
}
