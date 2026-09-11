import { lazy, Suspense, useState } from "react";
import {
  Box,
  Image,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Pause,
  Play,
} from "lucide-react";
import { colorHex, type Product } from "../data/products";
import { use3D } from "../hooks/useExperience";
import { ProductImage } from "./ProductCard";
import SceneBoundary from "./SceneBoundary";
const ProductScene = lazy(() => import("../scenes/ProductScene"));
export default function ProductViewer({
  product,
  color,
}: {
  product: Product;
  color: string;
}) {
  const { enabled } = use3D();
  const [mode, setMode] = useState<"photo" | "3d">(enabled ? "3d" : "photo");
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(5.1);
  const [reset, setReset] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [detail, setDetail] = useState(false);
  const fallback = <ProductImage product={product} />;
  return (
    <div className="product-gallery">
      <div
        className="viewer-stage"
        role="region"
        aria-label="Product photos and 3D viewer"
      >
        <div className="viewer-tabs">
          <button
            className={mode === "3d" ? "active" : ""}
            onClick={() => setMode("3d")}
            aria-pressed={mode === "3d"}
          >
            <Box size={15} /> 3D view
          </button>
          <button
            className={mode === "photo" ? "active" : ""}
            onClick={() => setMode("photo")}
            aria-pressed={mode === "photo"}
          >
            <Image size={15} /> Photo
          </button>
        </div>
        {mode === "3d" ? (
          <SceneBoundary fallback={fallback}>
            <Suspense
              fallback={
                <div className="viewer-loading">
                  <Box size={28} />
                  <span>Adding a little dimension…</span>
                </div>
              }
            >
              <ProductScene
                product={product}
                color={colorHex[color]}
                angle={angle}
                zoom={zoom}
                reset={reset}
                autoRotate={autoRotate}
              />
            </Suspense>
          </SceneBoundary>
        ) : (
          <div className={`photo-stage ${detail ? "detail" : ""}`}>
            {fallback}
          </div>
        )}
        {mode === "3d" && (
          <>
            <span className="viewer-caption">Drag to discover every angle</span>
            <div className="viewer-controls">
              <button
                aria-label="Rotate product left"
                onClick={() => setAngle((v) => v - Math.PI / 4)}
              >
                <RotateCcw size={16} />
              </button>
              <button
                aria-label="Rotate product right"
                onClick={() => setAngle((v) => v + Math.PI / 4)}
              >
                <RotateCw size={16} />
              </button>
              <span />
              <button
                aria-label="Zoom in"
                disabled={zoom <= 3}
                onClick={() => setZoom((v) => Math.max(3, v - 0.5))}
              >
                <Plus size={16} />
              </button>
              <button
                aria-label="Zoom out"
                disabled={zoom >= 8}
                onClick={() => setZoom((v) => Math.min(8, v + 0.5))}
              >
                <Minus size={16} />
              </button>
              <span />
              <button
                aria-label={
                  autoRotate ? "Pause product rotation" : "Auto rotate product"
                }
                onClick={() => setAutoRotate((v) => !v)}
              >
                {autoRotate ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button
                aria-label="Reset product view"
                onClick={() => {
                  setReset((v) => v + 1);
                  setZoom(5.1);
                  setAngle(0);
                  setAutoRotate(false);
                }}
              >
                <Box size={15} />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="gallery-thumbs">
        <button
          className={mode === "3d" ? "active" : ""}
          aria-label="Show 3D model"
          onClick={() => setMode("3d")}
        >
          <Box size={27} />
          <span>3D preview</span>
        </button>
        <button
          className={mode === "photo" && !detail ? "active" : ""}
          aria-label="Show product photo"
          onClick={() => {
            setMode("photo");
            setDetail(false);
          }}
        >
          <ProductImage product={product} />
        </button>
        <button
          className={mode === "photo" && detail ? "active" : ""}
          aria-label="Show product close-up"
          onClick={() => {
            setMode("photo");
            setDetail(true);
          }}
        >
          <ProductImage product={product} style={{ scale: "1.7" }} />
        </button>
        <p>
          Little details. Lots to love.
          <span>Illustrative 3D model · Product photos show the design.</span>
        </p>
      </div>
    </div>
  );
}
