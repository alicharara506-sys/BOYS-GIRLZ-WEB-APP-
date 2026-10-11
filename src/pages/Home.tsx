import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Shirt, Sparkles, Sun } from "lucide-react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import Newsletter from "../components/Newsletter";
import BrandRibbon from "../components/BrandRibbon";
import ToyBoxExperience from "../components/ToyBoxExperience";
import { useLocale } from "../i18n/Locale";

const featured = products.slice(0, 4);
const filters = ["All", "Boys", "Girls", "Baby"] as const;

export default function Home() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visibleProducts = featured.filter((product) =>
    filter === "All" ||
    (filter === "Baby" ? product.category === "Unisex" : product.category === filter),
  );

  return (
    <div className="home-page">
      <ToyBoxExperience />
      <BrandRibbon />

      <section className="home-favorites page-width" aria-labelledby="favorites-heading">
        <div className="home-section-heading">
          <h2 id="favorites-heading">{t("Their next favorites")}</h2>
          <div className="home-filters" role="group" aria-label={t("Filter featured products")}>
            {filters.map((item) => (
              <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{t(item)}</button>
            ))}
          </div>
          <Link to="/shop?sort=newest" className="home-view-all">{t("View all")} <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="home-product-grid">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} showRange />)}
        </div>
      </section>

      <section className="home-sale page-width" aria-labelledby="home-sale-heading">
        <span className="home-sale-glow" aria-hidden="true" />
        <span className="home-sale-icon" aria-hidden="true"><Sparkles size={24} /></span>
        <div>
          <span className="home-sale-label">{t("A little more to love")}</span>
          <h2 id="home-sale-heading">{t("Lovely finds. Lighter prices.")}</h2>
          <p>{t("Explore our Like New outlet favorites, carefully chosen for their next little chapter.")}</p>
        </div>
        <Link className="home-sale-link" to="/category/outlet">{t("Shop the outlet")} <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>

      <section className="home-promise page-width" aria-label={t("Why shop with us")}>
        <div><Leaf size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>{t("Soft on little skin")}</strong><small>{t("Gentle, breathable fabrics")}</small></span></div>
        <div><Sun size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>{t("Made for everyday play")}</strong><small>{t("Comfortable and durable")}</small></span></div>
        <div><Shirt size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>{t("Easy size guide")}</strong><small>{t("Find the perfect fit")}</small></span></div>
      </section>

      <div className="home-newsletter page-width"><Newsletter /></div>
    </div>
  );
}
