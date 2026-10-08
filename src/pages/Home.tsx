import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Shirt, Sparkles, Sun } from "lucide-react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import Newsletter from "../components/Newsletter";
import BrandRibbon from "../components/BrandRibbon";
import ToyBoxExperience from "../components/ToyBoxExperience";

const featured = products.slice(0, 4);
const filters = ["All", "Boys", "Girls", "Baby"] as const;

export default function Home() {
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
          <h2 id="favorites-heading">Their next favorites</h2>
          <div className="home-filters" role="group" aria-label="Filter featured products">
            {filters.map((item) => (
              <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <Link to="/shop?sort=newest" className="home-view-all">View all <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="home-product-grid">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} showRange />)}
        </div>
      </section>

      <section className="home-sale page-width" aria-labelledby="home-sale-heading">
        <span className="home-sale-glow" aria-hidden="true" />
        <span className="home-sale-icon" aria-hidden="true"><Sparkles size={24} /></span>
        <div>
          <span className="home-sale-label">A little more to love</span>
          <h2 id="home-sale-heading">Lovely finds. Lighter prices.</h2>
          <p>Explore our Like New outlet favorites, carefully chosen for their next little chapter.</p>
        </div>
        <Link className="home-sale-link" to="/category/outlet">Shop the outlet <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>

      <section className="home-promise page-width" aria-label="Why shop with us">
        <div><Leaf size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Soft on little skin</strong><small>Gentle, breathable fabrics</small></span></div>
        <div><Sun size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Made for everyday play</strong><small>Comfortable and durable</small></span></div>
        <div><Shirt size={31} strokeWidth={1.5} aria-hidden="true" /><span><strong>Easy size guide</strong><small>Find the perfect fit</small></span></div>
      </section>

      <div className="home-newsletter page-width"><Newsletter /></div>
    </div>
  );
}
