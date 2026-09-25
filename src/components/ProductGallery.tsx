import { useState } from "react";
import { Expand, Heart, Sparkles } from "lucide-react";
import type { Product } from "../data/products";
import { ProductImage } from "./ProductCard";

export default function ProductGallery({ product }: { product: Product }) {
  const [detail, setDetail] = useState(false);
  return (
    <div className="product-gallery">
      <div className={`photo-viewer ${detail ? "detail" : ""}`}>
        <span className="photo-badge">
          <Sparkles size={13} /> Little details to love
        </span>
        <ProductImage product={product} />
        <button
          className="photo-expand"
          aria-label={detail ? "Show full product" : "Show product close-up"}
          onClick={() => setDetail(!detail)}
        >
          <Expand size={17} /> {detail ? "Full view" : "Close-up"}
        </button>
      </div>
      <div className="gallery-thumbs">
        <button
          className={!detail ? "active" : ""}
          aria-label="Show full product photo"
          onClick={() => setDetail(false)}
        >
          <ProductImage product={product} />
        </button>
        <button
          className={detail ? "active" : ""}
          aria-label="Show product detail photo"
          onClick={() => setDetail(true)}
        >
          <ProductImage product={product} style={{ scale: "1.7" }} />
        </button>
        <p>
          Little details. Lots to love.
          <span>
            <Heart size={10} fill="currentColor" /> Product photos show the
            selected design.
          </span>
        </p>
      </div>
    </div>
  );
}
